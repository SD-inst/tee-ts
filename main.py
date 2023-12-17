import asyncio
from io import BytesIO
import os
import pathlib
import tempfile
from TTS.utils.manage import ModelManager
from TTS.utils.synthesizer import Synthesizer
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, Response
import numpy as np
from pydantic import BaseModel
import scipy
from infer.modules.vc.modules import VC
from configs.config import Config
from pathvalidate import validate_filename, ValidationError

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

@app.post("/api/generate")
async def generate(req: GenerateRequest):
    try:
        validate_filename(req.model)
        validate_filename(req.sample)
    except ValidationError:
        return Response("Invalid model or sample name", 400)

    async with genLock:
        root = os.getenv('weight_root')
        wav = s.tts(req.text, speaker_wav=os.path.join(root, req.model, "samples", req.sample), speaker_name=None, language_name=req.language)
        wav = np.array(wav)
        if not req.rvc:
            return StreamingResponse(content=convert_wav(wav, s.output_sample_rate), media_type="audio/wav")

        f = tempfile.NamedTemporaryFile(suffix=".wav")
        convert_wav(wav, s.output_sample_rate, f.name)
        index = os.path.join(root, req.model, "model.index")
        if not pathlib.Path(index).exists():
            index = None

        rvc.get_vc(f"{req.model}/model.pth")
        _, result = rvc.vc_single(
            0,
            f.name,
            0,
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
        f.close()
        return StreamingResponse(
            content=convert_wav(result[1], result[0]), media_type="audio/wav"
        )

class Model(BaseModel):
    name: str
    samples: list[str]

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
        model = Model(name=d, samples=[])
        if p.joinpath("samples").is_dir():
            samples = os.listdir(os.path.join(root, d, "samples"))
            model.samples = samples
            result.append(model)
        elif filter:
            result.append(model)

    return result

@app.get("/api/play_sample")
def play_sample(model: str, sample: str):
    f = open(f"{os.getenv('weight_root')}/{model}/samples/{sample}", "rb")
    c = f.read()
    f.close()
    return Response(content=c)

manager = ModelManager()
model_path = os.path.join(manager.output_prefix, "tts_models--multilingual--multi-dataset--xtts_v2")
s = Synthesizer(
    model_dir=model_path,
).to("cuda")
app.mount("/", StaticFiles(directory="static", html=True))
