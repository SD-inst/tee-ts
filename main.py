from io import BytesIO
import os
import tempfile
from TTS.utils.manage import ModelManager
from TTS.utils.synthesizer import Synthesizer
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
import numpy as np
from pydantic import BaseModel
import scipy
from infer.modules.vc.modules import VC
from configs.config import Config

app = FastAPI()

s: Synthesizer = None
rvc_c = Config()
rvc = VC(rvc_c)

class GenerateRequest(BaseModel):
    text: str
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
    wav = s.tts(req.text, speaker_wav="me2/nortl_relationship_05_h_S_INT_229376.wav", speaker_name=None, language_name=req.language)
    wav = np.array(wav)
    if not req.rvc:
        return StreamingResponse(content=convert_wav(wav, s.output_sample_rate))

    f = tempfile.NamedTemporaryFile(suffix=".wav")
    convert_wav(wav, s.output_sample_rate, f.name)

    rvc.get_vc("Tali/model.pth")
    _, result = rvc.vc_single(
        0,
        f.name,
        0,
        None,
        "rmvpe",
        "/mnt/2Tb/tts/assets/weights/Tali/model.index",
        None,
        req.index,
        req.filter_radius,
        req.resample,
        req.rms_mix_rate,
        req.protect
    )
    f.close()
    return StreamingResponse(
        content=convert_wav(result[1], result[0])
    )

manager = ModelManager()
model_path, _, _ = manager.download_model("tts_models/multilingual/multi-dataset/xtts_v2")
s = Synthesizer(
    model_dir=model_path,
).to("cuda")
app.mount("/", StaticFiles(directory="static", html=True))
