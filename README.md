# Syncbit-frontend

## Used Technologies
- React Native
- Expo Vector Icons

## How It Works
- Synchronizes audio playback using an NTP server as the reference time.
- Sends 8 time requests to the server and calculates the median offset for the most accurate result.
- Delays playback by the computed offset before playing the audio in sync.