# Japanese Numbers Learning App

A modern, interactive web application for learning Japanese numbers with audio pronunciation and intelligent flashcard algorithm.

## Features

- **Four Learning Ranges**: 0-10, 0-100, 0-1000, and 0-10,000
- **Audio Pronunciation**: Click on Japanese characters to hear pronunciation
- **Smart Flashcard Algorithm**: Prioritizes incorrectly answered numbers
- **Progress Tracking**: Real-time statistics including accuracy and streaks
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Google Cloud TTS**: High-quality Japanese audio generation

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set up Google Cloud TTS

1. Create a Google Cloud project
2. Enable the Cloud Text-to-Speech API
3. Create a service account and download the JSON key file
4. Set the environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
```

### 3. Generate Audio Files

```bash
python generate_numbers_audio.py
```

This will generate MP3 files for numbers 0-10,000 in the `audio/` directory.

### 4. Run the App

Open `index.html` in your web browser, or serve it using a local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`

## How to Use

1. **Select Range**: Choose your desired number range from the dropdown
2. **Learn**: The app displays a number in Japanese characters
3. **Listen**: Click on the Japanese text to hear pronunciation
4. **Practice**: Enter the number in the input field
5. **Review**: Get immediate feedback and see your progress
6. **Progress**: The app tracks your accuracy and shows statistics

## Flashcard Algorithm

The app uses an intelligent algorithm that:
- Prioritizes numbers you've answered incorrectly
- Removes numbers from the pool after 3 correct answers
- Maintains a streak counter for motivation
- Provides real-time accuracy statistics

## File Structure

```
numbers/
├── index.html          # Main application
├── styles.css          # Styling and layout
├── app.js             # Application logic
├── generate_numbers_audio.py  # Audio generation script
├── requirements.txt   # Python dependencies
├── README.md         # This file
└── audio/            # Generated audio files (after running script)
```

## Audio Generation Settings

- **Voice**: ja-JP-Neural2-C (Google Cloud TTS)
- **Language**: ja-JP (Japanese)
- **Format**: MP3
- **Range**: 0-10,000 numbers

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Notes

- Audio playback requires user interaction due to browser autoplay policies
- The app works offline once audio files are generated
- Progress is not persisted between sessions (stored in memory only)