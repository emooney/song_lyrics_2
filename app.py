from flask import Flask, render_template, jsonify, request
import os
import requests
import json

app = Flask(__name__)

SONGS_DIR = "songs"

# Create songs directory if it doesn't exist
os.makedirs(SONGS_DIR, exist_ok=True)

def get_local_songs():
    """Get list of songs from local directory"""
    if not os.path.exists(SONGS_DIR):
        return []
    songs = []
    for file in os.listdir(SONGS_DIR):
        if file.endswith('.txt'):
            songs.append(file[:-4])  # Remove .txt extension
    return sorted(songs)

def save_lyrics_to_file(song_title, artist, lyrics):
    """Save lyrics to a local file using the format 'song_title - artist.txt'"""
    filename = f"{song_title} - {artist}.txt"
    filepath = os.path.join(SONGS_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(lyrics)
    return filename[:-4]  # Return filename without .txt extension

def get_lyrics_from_api(artist, title):
    """Fetch lyrics from lyrics.ovh API"""
    try:
        response = requests.get(f'https://api.lyrics.ovh/v1/{artist}/{title}')
        if response.status_code == 200:
            return response.json()['lyrics']
        return None
    except:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/songs')
def get_songs():
    return jsonify(get_local_songs())

@app.route('/api/lyrics')
def get_lyrics():
    song_name = request.args.get('song')
    artist = request.args.get('artist', '')
    
    # First try to get from local files
    # Check if the file exists either as just song_name or song_name - artist
    local_paths = [
        os.path.join(SONGS_DIR, f"{song_name}.txt"),
        os.path.join(SONGS_DIR, f"{song_name} - {artist}.txt")
    ]
    
    for path in local_paths:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return jsonify({'lyrics': f.read(), 'source': 'local'})
    
    # If not found locally and artist is provided, try API
    if artist:
        lyrics = get_lyrics_from_api(artist, song_name)
        if lyrics:
            # Save the lyrics locally
            saved_name = save_lyrics_to_file(song_name, artist, lyrics)
            return jsonify({
                'lyrics': lyrics, 
                'source': 'api',
                'saved_as': saved_name
            })
    
    return jsonify({'error': 'Lyrics not found'}), 404

@app.after_request
def add_header(response):
    """Add headers to prevent caching."""
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    app.run(debug=True)
