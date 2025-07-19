# Split Vocabulary Flashcards into Two Separate Apps

## Overview
This PR splits the existing "Vocabulary flashcards" app into two separate, focused applications:
1. **Vocabulary Words** - for learning individual Japanese vocabulary words
2. **Common Phrases** - for learning useful Japanese phrases and expressions

## Changes Made

### 🏗️ App Structure
- Created two new app directories: `vocab-words/` and `common-phrases/`
- Each app has its own complete set of files and dependencies
- Copied shared assets (images, audio, public files) to both apps

### 📊 Data Management
- **Vocabulary Words**: Uses `words.json` with 1000+ shuffled vocab words
- **Common Phrases**: Uses `phrases.json` with 85 common phrases
- **Shuffled Data**: Vocab words are now in random order (was previously sorted by frequency)
- **Separate Storage**: Each app uses unique localStorage keys to prevent conflicts:
  - `jp-vocab-words-progress` / `jp-vocab-words-stats`
  - `jp-common-phrases-progress` / `jp-common-phrases-stats`

### 🔧 Code Modifications

#### useFlashcards.js
- **Vocab Words**: Modified to only handle word data, removed phrase functionality
- **Common Phrases**: Modified to only handle phrase data, removed word functionality
- Simplified card selection logic (no more alternating between word/phrase types)
- Each app loads only its relevant data file

#### App.jsx
- **Vocab Words**: UI shows only word-related controls and lists
- **Common Phrases**: UI shows only phrase-related controls and lists
- Removed unused UI elements for cleaner, more focused interfaces

#### index.html Files
- **Vocab Words**: Title "Japanese Vocabulary Words"
- **Common Phrases**: Title "Japanese Common Phrases"
- Each app has its own entry point

### 🎨 UI Updates
- Updated main `index.html` to show both apps separately:
  - 📚 **Vocabulary Words** (blue theme)
  - 💬 **Common Phrases** (indigo theme)
- Removed the original combined "Vocabulary Flashcards" entry

## Benefits

### 🎯 Focused Learning
- Users can now focus on either vocabulary words OR common phrases
- No more mixed content that might confuse learning objectives
- Cleaner, more targeted learning experience

### 🔄 Better Data Organization
- Vocab words are now shuffled randomly instead of frequency-sorted
- This prevents weird words like "to be" from always appearing first
- More natural learning progression

### 🚀 Improved Performance
- Each app loads only the data it needs
- Smaller memory footprint per app
- Faster initial load times

### 🛡️ Data Isolation
- Progress and stats are completely separate between apps
- Users can reset one app without affecting the other
- No conflicts between word and phrase learning progress

## Testing
- Both apps function independently with their respective data
- Progress tracking works correctly for each app
- Audio playback works for both words and phrases
- UI elements are appropriate for each app's content type

## Migration Notes
- Existing users will need to start fresh in the new apps
- The original `vocab/` directory remains unchanged for reference
- All functionality from the original app is preserved, just split appropriately

## Files Changed
- `index.html` - Updated main navigation
- `vocab-words/` - New app directory with all necessary files
- `common-phrases/` - New app directory with all necessary files
- `vocab-words/data/words.json` - Shuffled vocab data
- `common-phrases/data/phrases.json` - Phrase data (unchanged)

## Files Added
- `vocab-words/index.html`
- `vocab-words/App.jsx`
- `vocab-words/useFlashcards.js`
- `common-phrases/index.html`
- `common-phrases/App.jsx`
- `common-phrases/useFlashcards.js`
- Plus all supporting files (components, assets, data)