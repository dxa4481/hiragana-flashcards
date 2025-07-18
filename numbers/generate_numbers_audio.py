#!/usr/bin/env python3
"""
Generate Japanese number audio files using Google Cloud TTS.
Generates audio for numbers 0-10,000 in Japanese.
"""
import os
import json
from pathlib import Path
from google.cloud import texttospeech
import time

# Configuration
VOICE_NAME = "ja-JP-Neural2-C"
LANG_CODE = "ja-JP"
AUDIO_DIR = Path(__file__).parent / "audio"
AUDIO_DIR.mkdir(exist_ok=True)

def number_to_japanese(num):
    """Convert number to Japanese text representation."""
    if num == 0:
        return "ゼロ"
    
    # Japanese number system
    units = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
    tens = ["", "十", "二十", "三十", "四十", "五十", "六十", "七十", "八十", "九十"]
    hundreds = ["", "百", "二百", "三百", "四百", "五百", "六百", "七百", "八百", "九百"]
    thousands = ["", "千", "二千", "三千", "四千", "五千", "六千", "七千", "八千", "九千"]
    
    if num < 10:
        return units[num]
    elif num < 100:
        if num % 10 == 0:
            return tens[num // 10]
        else:
            return tens[num // 10] + units[num % 10]
    elif num < 1000:
        if num % 100 == 0:
            return hundreds[num // 100]
        elif num % 100 < 10:
            return hundreds[num // 100] + units[num % 100]
        else:
            return hundreds[num // 100] + number_to_japanese(num % 100)
    elif num < 10000:
        if num % 1000 == 0:
            return thousands[num // 1000]
        elif num % 1000 < 100:
            return thousands[num // 1000] + number_to_japanese(num % 1000)
        else:
            return thousands[num // 1000] + number_to_japanese(num % 1000)
    else:
        return "一万"

def generate_audio(text, filename):
    """Generate audio file using Google Cloud TTS."""
    client = texttospeech.TextToSpeechClient()
    
    synthesis_input = texttospeech.SynthesisInput(text=text)
    
    voice = texttospeech.VoiceSelectionParams(
        language_code=LANG_CODE,
        name=VOICE_NAME
    )
    
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    
    with open(filename, "wb") as out:
        out.write(response.audio_content)
    
    print(f"Generated: {filename}")

def main():
    """Generate audio for numbers 0-10,000."""
    print(f"Generating Japanese number audio files...")
    print(f"Voice: {VOICE_NAME}")
    print(f"Language: {LANG_CODE}")
    print(f"Output directory: {AUDIO_DIR}")
    
    # Generate audio for numbers 0-10,000
    for num in range(0, 10001):
        japanese_text = number_to_japanese(num)
        filename = AUDIO_DIR / f"{num}.mp3"
        
        if filename.exists():
            print(f"✓ {num}.mp3 already exists")
            continue
        
        try:
            generate_audio(japanese_text, filename)
            # Small delay to avoid rate limiting
            time.sleep(0.1)
        except Exception as e:
            print(f"✗ Error generating {num}.mp3: {e}")
            continue
    
    print("Audio generation complete!")

if __name__ == "__main__":
    main()