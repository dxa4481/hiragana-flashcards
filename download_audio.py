#!/usr/bin/env python3
"""
Download every MP3 the flash-card app expects and save them in ./audio/.

Edit BASE_URL if the files live somewhere else, then run:
    python download_audio.py
You only need to do this once.
"""
import os
import requests
from pathlib import Path

BASE_URL = "https://www.learn-japanese-adventure.com/media-files/"        # ← CHANGE ME
DEST_DIR = Path(__file__).with_name("audio")
DEST_DIR.mkdir(exist_ok=True)

ROMAJI = [
    # 46 basic
    "a","i","u","e","o",
    "ka","ki","ku","ke","ko",
    "sa","shi","su","se","so",
    "ta","chi","tsu","te","to",
    "na","ni","nu","ne","no",
    "ha","hi","fu","he","ho",
    "ma","mi","mu","me","mo",
    "ya","yu","yo",
    "ra","ri","ru","re","ro",
    "wa","wo","n",
    # 濁音/半濁音
    "ga","gi","gu","ge","go",
    "za","ji","zu","ze","zo",
    "da","de","do",            # ぢ/じ and づ/ず share the same recording
    "ba","bi","bu","be","bo",
    "pa","pi","pu","pe","po",
    # 拗音
    "kya","kyu","kyo","sha","shu","sho","cha","chu","cho",
    "nya","nyu","nyo","hya","hyu","hyo","mya","myu","myo",
    "rya","ryu","ryo",
    # 拗音＋濁点/半濁点
    "gya","gyu","gyo","ja","ju","jo",
    "bya","byu","byo","pya","pyu","pyo",
]

for r in ROMAJI:
    src = BASE_URL + f"kanasound-{r}.mp3"
    dst = DEST_DIR / f"{r}.mp3"
    if dst.exists():
        print(f"✔ {dst.name} already present")
        continue
    try:
        print(f"↓ {dst.name}")
        data = requests.get(src, timeout=30)
        data.raise_for_status()
        dst.write_bytes(data.content)
    except Exception as e:
        print(f"✖ couldn’t fetch {src}: {e}")

