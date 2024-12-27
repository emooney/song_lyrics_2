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

@app.route('/api/delete_song', methods=['POST'])
def delete_song():
    """Delete a song file from the songs directory"""
    song_name = request.json.get('song')
    if not song_name:
        return jsonify({'error': 'No song name provided'}), 400
    
    # Add .txt extension if not present
    if not song_name.endswith('.txt'):
        song_name = f"{song_name}.txt"
    
    file_path = os.path.join(SONGS_DIR, song_name)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'success': True, 'message': f'Successfully deleted {song_name}'})
        else:
            return jsonify({'error': 'Song file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lyrics/edit', methods=['POST'])
def edit_lyrics():
    """Edit lyrics for a song"""
    data = request.get_json()
    song_name = data.get('song')
    new_lyrics = data.get('lyrics')
    
    if not song_name or not new_lyrics:
        return jsonify({'error': 'Missing song name or lyrics'}), 400
        
    try:
        file_path = os.path.join(SONGS_DIR, f"{song_name}.txt")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_lyrics)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.after_request
def add_header(response):
    """Add headers to prevent caching."""
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    app.run(debug=True)
