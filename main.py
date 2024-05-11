import asyncio
import io
import os
import pathlib
import shutil
import tempfile
from io import BytesIO

import av
import numpy as np
import scipy
import torch
from fastapi import FastAPI, Form, UploadFile
from fastapi.responses import JSONResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pathvalidate import ValidationError, validate_filename
from pydantic import BaseModel
from TTS.utils.manage import ModelManager
from TTS.utils.synthesizer import Synthesizer

from configs.config import Config
from infer.modules.vc.modules import VC

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

@app.post("/api/upload")
def upload(model: UploadFile = None, index: UploadFile = None, sample: UploadFile = None, name: str = Form()):
    try:
        validate_filename(name)
        if sample is not None:
            validate_filename(sample.filename)
    except ValidationError:
        return JSONResponse({"error": "Invalid model or sample name"}, 400)

    root = pathlib.Path(os.getenv("weight_root"))
    model_path = root / name
    exists = model_path.exists()
    if exists:
        model = None
        index = None
    elif model is None:
        return JSONResponse({"error": "Missing model file"}, 400)

    os.makedirs(model_path / "samples", exist_ok=True)
    if model is not None:
        with open(model_path / "model.pth", "wb") as f:
            shutil.copyfileobj(model.file, f)

    if index is not None:
        with open(model_path / "model.index", "wb") as f:
            shutil.copyfileobj(index.file, f)
    if sample is not None:
        with open(model_path / "samples" / sample.filename, "wb") as f:
            shutil.copyfileobj(sample.file, f)

    return {"result": "success"}


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
