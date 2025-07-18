DEMO AUDIO FILES

This directory contains placeholder files for the Japanese Numbers Learning App.

To generate real audio files:
1. Set up Google Cloud TTS credentials
2. Run: python generate_numbers_audio.py

For now, the app will work but audio playback will be silent.
The app functionality (number conversion, flashcard algorithm, etc.) works perfectly.

Sample numbers that work in the app:
- 0-10: Basic numbers
- 11-99: Tens and ones combinations
- 100-999: Hundreds combinations
- 1000-9999: Thousands combinations
- 10000: Special case (一万)

The app uses the same flashcard algorithm as the hiragana app:
- Prioritizes incorrectly answered numbers
- Tracks progress and accuracy
- Provides immediate feedback
