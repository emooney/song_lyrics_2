# Lyrics Finder

A modern web application that allows users to search for and view song lyrics. The app combines local storage with an external API to provide quick access to lyrics while building a personal collection.

## Features

- **Unified Search**: Search for songs using a single input field
  - Filter local songs as you type
  - Search external lyrics by using the format "song by artist"
- **Automatic Local Storage**: Lyrics fetched from the API are automatically saved locally
- **Modern UI/UX**:
  - Clean, responsive single-column layout
  - Dark/Light theme toggle with persistent preference
  - Smooth transitions between views
- **Cache Prevention**: Implemented to ensure always-fresh content

## Technical Details

### Backend (Python/Flask)
- Flask server handling both static files and API endpoints
- Local song storage in text files
- Integration with lyrics.ovh API for fetching new lyrics
- Cache prevention headers for all responses

### Frontend (HTML/CSS/JavaScript)
- Bootstrap 5 for responsive design
- Modern ES6+ JavaScript
- Dynamic content loading without page refreshes
- Bootstrap Icons for visual elements

### File Structure
```
song_lyrics_2/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── static/
│   ├── script.js      # Frontend JavaScript
│   └── style.css      # Custom styling
├── templates/
│   └── index.html     # Main HTML template
└── songs/             # Local lyrics storage (gitignored)
```

## Setup and Running

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   python -m flask run
   ```

3. Open in browser:
   ```
   http://localhost:5000
   ```

## Usage

1. **View Local Songs**:
   - All locally stored songs are displayed on startup
   - Filter through them by typing in the search box

2. **Search for New Songs**:
   - Enter a search in the format "song by artist"
   - Example: "Hotel California by Eagles"
   - Press Enter to search

3. **View Lyrics**:
   - Click any song in the list to view its lyrics
   - Use the back button to return to the song list

4. **Theme Preference**:
   - Toggle between light and dark themes using the moon/sun icon
   - Your preference is saved between sessions

## Notes

- The `songs/` directory is automatically created when needed
- All downloaded lyrics are saved locally for faster future access
- The application prevents caching to ensure fresh content
- Responsive design works on both desktop and mobile devices
