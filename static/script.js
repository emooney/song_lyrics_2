document.addEventListener('DOMContentLoaded', function() {
    // Get all DOM elements
    const songList = document.getElementById('songList');
    const songSearch = document.getElementById('songSearch');
    const lyricsDisplay = document.getElementById('lyricsDisplay');
    const themeToggle = document.getElementById('themeToggle');
    const backButton = document.getElementById('backButton');

    let songs = [];

    // Navigation functions
    function showLyricsView() {
        songList.classList.add('d-none');
        lyricsDisplay.classList.remove('d-none');
        backButton.classList.remove('d-none');
    }

    function showSongListView() {
        lyricsDisplay.classList.add('d-none');
        songList.classList.remove('d-none');
        backButton.classList.add('d-none');
        songSearch.value = '';
        displayFilteredSongs(songs);
    }

    // Theme toggling
    function toggleTheme() {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-bs-theme') === 'dark';
        html.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
        themeToggle.innerHTML = `<i class="bi bi-${isDark ? 'moon-stars' : 'sun'}"></i>`;
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    themeToggle.innerHTML = `<i class="bi bi-${savedTheme === 'dark' ? 'sun' : 'moon-stars'}"></i>`;
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Fetch and display songs
    async function fetchSongs() {
        try {
            const response = await fetch('/api/songs');
            songs = await response.json();
            displayFilteredSongs(songs);
        } catch (error) {
            console.error('Error fetching songs:', error);
        }
    }

    function displayFilteredSongs(filteredSongs) {
        songList.innerHTML = '';
        if (filteredSongs.length === 0) {
            songList.innerHTML = '<p class="text-center text-muted mt-3">No songs found. Try searching with "song by artist"</p>';
            return;
        }
        
        filteredSongs.forEach(song => {
            const item = document.createElement('button');
            item.className = 'list-group-item list-group-item-action song-item';
            item.textContent = song;
            item.onclick = () => {
                fetchLyrics(song);
                showLyricsView();
            };
            songList.appendChild(item);
        });
    }

    async function fetchLyrics(searchTerm) {
        try {
            // Parse search term for artist if provided
            let song = searchTerm;
            let artist = '';
            
            if (searchTerm.toLowerCase().includes(' by ')) {
                [song, artist] = searchTerm.split(/\s+by\s+/i);
            }

            const response = await fetch(`/api/lyrics?song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}`);
            const data = await response.json();
            
            if (response.ok) {
                let sourceText = `Source: ${data.source}`;
                if (data.source === 'api' && data.saved_as) {
                    sourceText += ` (Saved locally as "${data.saved_as}")`;
                }
                
                lyricsDisplay.innerHTML = `
                    <h3 class="mb-4">${song}${artist ? ` by ${artist}` : ''}</h3>
                    <p>${data.lyrics.replace(/\n/g, '<br>')}</p>
                    <small class="text-muted">${sourceText}</small>
                `;
                
                // Refresh the song list if we saved a new song
                if (data.source === 'api' && data.saved_as) {
                    fetchSongs();
                }
            } else {
                lyricsDisplay.innerHTML = `<p class="text-center text-danger mt-3">Lyrics not found. Try searching with "song by artist"</p>`;
            }
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            lyricsDisplay.innerHTML = `<p class="text-center text-danger mt-3">Error loading lyrics</p>`;
        }
    }

    // Event listeners
    if (songSearch) {
        songSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = songs.filter(song => song.toLowerCase().includes(query));
            displayFilteredSongs(filtered);
        });

        songSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = songSearch.value.trim();
                if (searchTerm) {
                    fetchLyrics(searchTerm);
                }
            }
        });
    }

    if (backButton) {
        backButton.addEventListener('click', showSongListView);
    }

    // Initialize
    fetchSongs();
    showSongListView(); // Ensure we start in the song list view
});
