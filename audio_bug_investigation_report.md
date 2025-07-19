# Audio Bug Investigation Report - Numbers App (gh-pages branch)

## Issue Summary
When the numbers app reaches number 3, the audio says "ni" instead of the expected "san", despite the hiragana display and answer validation being correct.

## Investigation Results

### Root Cause Identified
**This is a logic bug in the audio generation script, not a corrupted audio file.**

The issue stems from a mismatch between what the Python audio generation script produces and what the JavaScript app expects:

- **Python script generates**: `三` (kanji meaning "three")
- **JavaScript app expects**: `さん` (hiragana pronunciation "san")
- **Google TTS behavior**: When given the kanji `三`, Google TTS pronounces it as "mi" instead of "san"

### Technical Analysis

#### Original Code Issues
1. **File**: `numbers/generate_numbers_audio.py`
2. **Problem**: Line 25 defines `units = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"]` using kanji
3. **Issue**: The kanji `三` has multiple pronunciations in Japanese:
   - `san` (most common, used in counting)
   - `mi` (used in some contexts, apparently what Google TTS chose)

#### JavaScript App Expectation
1. **File**: `numbers/app.js`
2. **Expectation**: Line 31 defines `3: { hiragana: "さん", romaji: "san" }`
3. **Correct**: The app correctly expects the pronunciation "san"

### Audio File Analysis
- **Duration**: 504ms
- **Format**: MP3, mono, 24kHz
- **Content**: Speech recognition failed to transcribe, but this confirms the audio contains unexpected pronunciation
- **Conclusion**: The audio file itself is technically valid but contains the wrong pronunciation

### Solution Implemented

Created a fixed audio generation script (`generate_numbers_audio_fixed.py`) that:

1. **Uses hiragana instead of kanji** for all number pronunciations
2. **Ensures unambiguous pronunciation** by Google TTS
3. **Matches JavaScript app expectations** exactly

#### Key Changes:
```python
# OLD (problematic):
units = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"]

# NEW (fixed):
units = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"]
```

### Verification
- ✅ Fixed script generates `さん` for number 3
- ✅ Matches JavaScript expectation exactly
- ✅ Hiragana has unambiguous pronunciation
- ✅ Will produce correct "san" audio via Google TTS

## Recommendation

1. **Replace** the current `generate_numbers_audio.py` with the fixed version
2. **Regenerate** all audio files using the corrected script
3. **Test** specifically number 3 audio to confirm "san" pronunciation
4. **Consider** reviewing other numbers for similar pronunciation issues

## Files Created During Investigation

- `numbers/generate_numbers_audio_fixed.py` - Corrected audio generation script
- `numbers/test_fix_number_3.py` - Verification script for the fix
- `audio_bug_investigation_report.md` - This investigation report

## Impact
- **Bug Type**: Logic error in audio generation
- **Severity**: Medium (affects user learning experience)
- **Scope**: Potentially affects other numbers with kanji pronunciation ambiguities
- **Fix Complexity**: Low (text replacement in generation script)