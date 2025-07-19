# Offline Functionality for Japanese Numbers Learning App

This document describes the offline functionality implemented for the Japanese Numbers Learning app.

## Features

### Service Worker Implementation
- **Caching Strategy**: The app uses a service worker to cache the first 1000 audio files for offline use
- **Progressive Caching**: Audio files are cached in batches of 50 to avoid overwhelming the browser
- **Static File Caching**: Core app files (HTML, CSS, JS) are cached immediately
- **Fallback Strategy**: If an audio file isn't cached, it attempts to fetch from network

### Offline Indicators
- **Status Display**: Shows current connection status (Online/Offline/Online with Cache)
- **Visual Feedback**: Color-coded indicators for different states
- **Real-time Updates**: Status updates automatically when connection changes

### PWA Features
- **Web App Manifest**: Makes the app installable as a PWA
- **Standalone Mode**: App can run in standalone mode when installed
- **Theme Colors**: Consistent branding with theme colors

## Technical Implementation

### Service Worker (`sw.js`)
- **Cache Names**: 
  - `numbers-app-v1`: Static files
  - `numbers-audio-v1`: Audio files
- **Install Event**: Caches static files and starts audio caching
- **Activate Event**: Cleans up old caches
- **Fetch Event**: Serves cached content when available

### Audio Caching Strategy
1. **Batch Processing**: Caches 50 files at a time
2. **Error Handling**: Gracefully handles missing audio files
3. **Progress Logging**: Console logs show caching progress
4. **Network Fallback**: Attempts network fetch if not cached

### Offline Status Monitoring
- **Connection Events**: Listens for `online`/`offline` events
- **Service Worker Status**: Monitors service worker registration
- **UI Updates**: Updates status indicator in real-time

## Usage

### First Visit
1. App loads normally from network
2. Service worker installs in background
3. Audio files begin caching (first 1000 numbers)
4. Status indicator shows "Online with Cache" when ready

### Offline Usage
1. App continues to work without internet
2. Cached audio files play immediately
3. Status indicator shows "Offline Mode"
4. All core functionality remains available

### Installation
1. Visit the app in a supported browser
2. Look for "Add to Home Screen" prompt
3. Install the app for standalone experience
4. App works offline after installation

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11.3+)
- **Edge**: Full support

## Performance Considerations

- **Storage**: ~50MB for 1000 audio files
- **Caching Time**: ~2-3 minutes for full audio cache
- **Memory Usage**: Minimal impact on app performance
- **Battery**: Efficient caching strategy minimizes battery drain

## Troubleshooting

### Audio Not Playing Offline
1. Check if service worker is registered
2. Verify audio files are cached (check browser dev tools)
3. Clear cache and reload if needed

### App Not Working Offline
1. Ensure HTTPS is used (required for service workers)
2. Check browser console for errors
3. Verify service worker is active

### Cache Issues
1. Clear browser cache
2. Unregister service worker
3. Reload page to reinstall

## Development

### Testing Offline Functionality
1. Open browser dev tools
2. Go to Application tab
3. Check Service Workers and Cache Storage
4. Use Network tab to simulate offline mode

### Updating the App
- Increment cache version in service worker
- Clear old caches automatically
- Users get new version on next visit

## Future Enhancements

- **Background Sync**: Sync progress when back online
- **Push Notifications**: Remind users to practice
- **Advanced Caching**: Cache based on usage patterns
- **Offline Analytics**: Track offline usage statistics