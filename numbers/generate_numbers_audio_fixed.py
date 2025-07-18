#!/usr/bin/env python3
"""
Generate Japanese number audio files using Google Cloud TTS.
FIXED VERSION: Uses hiragana pronunciations instead of kanji to ensure correct TTS output.
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

def number_to_japanese_hiragana(num):
    """Convert number to Japanese hiragana representation for proper TTS pronunciation."""
    if num == 0:
        return "ぜろ"
    
    # Japanese number system using hiragana for proper pronunciation
    units = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"]
    tens = ["", "じゅう", "にじゅう", "さんじゅう", "よんじゅう", "ごじゅう", "ろくじゅう", "ななじゅう", "はちじゅう", "きゅうじゅう"]
    
    if num < 10:
        return units[num]
    elif num < 100:
        if num % 10 == 0:
            return tens[num // 10]
        else:
            if num // 10 == 1:
                # For 11-19, just say じゅう + unit
                return "じゅう" + units[num % 10]
            else:
                return tens[num // 10] + units[num % 10]
    elif num < 1000:
        hundreds_digit = num // 100
        remainder = num % 100
        
        if hundreds_digit == 1:
            result = "ひゃく"
        elif hundreds_digit == 3:
            result = "さんびゃく"  # Special pronunciation
        elif hundreds_digit == 6:
            result = "ろっぴゃく"  # Special pronunciation
        elif hundreds_digit == 8:
            result = "はっぴゃく"  # Special pronunciation
        else:
            result = units[hundreds_digit] + "ひゃく"
        
        if remainder > 0:
            result += number_to_japanese_hiragana(remainder)
        
        return result
    elif num < 10000:
        thousands_digit = num // 1000
        remainder = num % 1000
        
        if thousands_digit == 1:
            result = "せん"
        elif thousands_digit == 3:
            result = "さんぜん"  # Special pronunciation
        elif thousands_digit == 8:
            result = "はっせん"  # Special pronunciation
        else:
            result = units[thousands_digit] + "せん"
        
        if remainder > 0:
            result += number_to_japanese_hiragana(remainder)
        
        return result
    else:
        return "いちまん"

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
    print(f"Generating Japanese number audio files with HIRAGANA pronunciations...")
    print(f"Voice: {VOICE_NAME}")
    print(f"Language: {LANG_CODE}")
    print(f"Output directory: {AUDIO_DIR}")
    
    # Test the fix first - generate audio for number 3
    print("\nTesting fix for number 3:")
    japanese_text = number_to_japanese_hiragana(3)
    print(f"Number 3 will be generated as: '{japanese_text}' (hiragana)")
    
    # Generate audio for numbers 0-10,000
    for num in range(0, 10001):
        japanese_text = number_to_japanese_hiragana(num)
        filename = AUDIO_DIR / f"{num}.mp3"
        
        # For debugging, show what we're generating for first 10 numbers
        if num <= 10:
            print(f"Number {num}: '{japanese_text}'")
        
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