import asyncio
from io import BytesIO
import io
import os
import pathlib
import shutil
import tempfile
from TTS.utils.manage import ModelManager
from TTS.utils.synthesizer import Synthesizer
from fastapi import FastAPI, Form, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, Response
import numpy as np
from pydantic import BaseModel
import scipy
import torch
from infer.modules.vc.modules import VC
from configs.config import Config
from pathvalidate import validate_filename, ValidationError
import av

app = FastAPI()

genLock = asyncio.Lock()
s: Synthesizer = None
rvc_c = Config()
rvc = VC(rvc_c)

class GenerateRequest(BaseModel):
    text: str
    sample: str
    model: str
    language: str = "en"
    pitch: int = 0
    rvc: bool = True
    index: float = 0.75
    filter_radius: int = 3
    resample: int = 0
    rms_mix_rate: float = 0.25
    protect: float = 0.33

def convert_wav(wav, sample_rate, path=None):
    wav_norm = wav * (32767 / max(0.01, np.max(np.abs(wav))))

    wav_norm = wav_norm.astype(np.int16)
    if path is None:
        wav_buffer = BytesIO()
        scipy.io.wavfile.write(wav_buffer, sample_rate, wav_norm)
        return wav_buffer
    else:
        scipy.io.wavfile.write(path, sample_rate, wav_norm)

def convert_audio(in_file: str) -> io.FileIO:
    out_file = tempfile.NamedTemporaryFile(suffix='.ogg')
    with av.open(in_file) as in_container:
        in_stream = in_container.streams.audio[0]
        with av.open(out_file.name, 'w', 'ogg') as out_container:
            out_stream = out_container.add_stream(
                'libvorbis',
                rate=48000,
                layout='mono'
            )
            for frame in in_container.decode(in_stream):
                for packet in out_stream.encode(frame):
                    out_container.mux(packet)
            for packet in out_stream.encode():
                out_container.mux(packet)
    return out_file

@app.post("/api/generate")
async def generate(req: GenerateRequest):
    try:
        validate_filename(req.model)
        validate_filename(req.sample)
    except ValidationError:
        return Response("Invalid model or sample name", 400)

    async with genLock:
        root = os.getenv('weight_root')
        maybe_load_model()
        wav = s.tts(req.text, speaker_wav=os.path.join(root, req.model, "samples", req.sample), speaker_name=None, language_name=req.language)
        unload()
        wav = np.array(wav)
        with tempfile.NamedTemporaryFile(suffix=".wav") as f:
            convert_wav(wav, s.output_sample_rate, f.name)
            if not req.rvc:
                r = convert_audio(f.name)
                return StreamingResponse(content=open(r.name, "rb"), media_type="audio/ogg")

            index = os.path.join(root, req.model, "model.index")
            if not pathlib.Path(index).exists():
                index = None

            rvc.get_vc(f"{req.model}/model.pth")
            _, result = rvc.vc_single(
                0,
                f.name,
                req.pitch,
                None,
                "rmvpe",
                index,
                None,
                req.index,
                req.filter_radius,
                req.resample,
                req.rms_mix_rate,
                req.protect
            )
            convert_wav(result[1], result[0], f.name)
            r = convert_audio(f.name)
            return StreamingResponse(
                content=open(r.name, "rb"), media_type="audio/ogg"
            )

class Model(BaseModel):
    name: str
    samples: list[str]
    ts: float

@app.get("/api/models")
def list_models(filter: str = '') -> list[Model]:
    root = os.getenv("weight_root")
    model_dirs = os.listdir(root)
    result = []
    filter = filter.lower()
    for d in model_dirs:
        p = pathlib.Path(os.path.join(root, d))
        if not p.is_dir():
            continue
        if d.lower().count(filter) == 0:
            continue
        r = p.stat()
        model = Model(name=d, samples=[], ts=r.st_ctime)
        if p.joinpath("samples").is_dir():
            samples = os.listdir(os.path.join(root, d, "samples"))
            model.samples = samples
        result.append(model)

    return sorted(result, key=lambda x: x.ts, reverse=True)

@app.get("/api/play_sample")
def play_sample(model: str, sample: str):
    f = open(f"{os.getenv('weight_root')}/{model}/samples/{sample}", "rb")
    c = f.read()
    f.close()
    return Response(content=c)

@app.post("/api/rvc")
async def rvc_process(file: UploadFile, model: str = Form(), pitch: int = Form(0), index: float = Form(0.75), filter_radius: int = Form(3), rms_mix_rate: float = Form(0.25), protect: float = Form(0.33)):
    async with genLock:
        root = os.getenv('weight_root')
        indexfn = os.path.join(root, model, "model.index")
        if not pathlib.Path(indexfn).exists():
            indexfn = None
        with tempfile.NamedTemporaryFile() as src_file:
            shutil.copyfileobj(file.file, src_file)
            rvc.get_vc(f"{model}/model.pth")
            _, result = rvc.vc_single(
                0,
                src_file.name,
                pitch,
                None,
                "rmvpe",
                indexfn,
                None,
                index,
                filter_radius,
                0,
                rms_mix_rate,
                protect
            )
        f = tempfile.NamedTemporaryFile(prefix=".wav")
        convert_wav(result[1], result[0], f.name)
        r = convert_audio(f.name)
        return StreamingResponse(
            content=open(r.name, "rb"), media_type="audio/ogg"
        )

def unload():
    global s
    if s is not None:
        s.to("cpu")
    torch.cuda.empty_cache()
    torch.cuda.ipc_collect()
    return {"result": "ok"}

def maybe_load_model():
    global s
    if s is not None:
        s.to("cuda")
        return
    manager = ModelManager()
    model_path = os.path.join(manager.output_prefix, "tts_models--multilingual--multi-dataset--xtts_v2")
    s = Synthesizer(
        model_dir=model_path,
    ).to("cuda")

app.mount("/", StaticFiles(directory="static", html=True))
