document.addEventListener('DOMContentLoaded', function() {
    // Get all DOM elements
    const songList = document.getElementById('songList');
    const songSearch = document.getElementById('songSearch');
    const lyricsDisplay = document.getElementById('lyricsDisplay');
    const themeToggle = document.getElementById('themeToggle');
    const backButton = document.getElementById('backButton');
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const lyricsEdit = document.getElementById('lyricsEdit');
    const lyricsTextarea = document.getElementById('lyricsTextarea');

    let songs = [];
    let currentSong = null;

    // Navigation functions
    function showLyricsView() {
        songList.classList.add('d-none');
        lyricsDisplay.classList.remove('d-none');
        backButton.classList.remove('d-none');
        editButton.classList.remove('d-none');
        saveButton.classList.add('d-none');
        lyricsEdit.classList.add('d-none');
    }

    function showSongListView() {
        lyricsDisplay.classList.add('d-none');
        songList.classList.remove('d-none');
        backButton.classList.add('d-none');
        editButton.classList.add('d-none');
        saveButton.classList.add('d-none');
        lyricsEdit.classList.add('d-none');
        songSearch.value = '';
        displayFilteredSongs(songs);
    }

    function showEditView() {
        lyricsDisplay.classList.add('d-none');
        lyricsEdit.classList.remove('d-none');
        editButton.classList.add('d-none');
        saveButton.classList.remove('d-none');
        lyricsTextarea.value = lyricsDisplay.textContent;
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
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'song-title';
            titleSpan.textContent = song;
            titleSpan.onclick = (e) => {
                e.stopPropagation();
                fetchLyrics(song);
                showLyricsView();
            };
            
            const deleteBtn = document.createElement('i');
            deleteBtn.className = 'bi bi-trash delete-btn';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${song}"?`)) {
                    try {
                        const response = await fetch('/api/delete_song', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ song: song })
                        });
                        
                        if (response.ok) {
                            // Remove the song from our list and refresh display
                            songs = songs.filter(s => s !== song);
                            displayFilteredSongs(songs.filter(s => 
                                s.toLowerCase().includes(songSearch.value.toLowerCase())
                            ));
                        } else {
                            const data = await response.json();
                            alert(data.error || 'Failed to delete song');
                        }
                    } catch (error) {
                        console.error('Error deleting song:', error);
                        alert('Failed to delete song');
                    }
                }
            };
            
            item.appendChild(titleSpan);
            item.appendChild(deleteBtn);
            songList.appendChild(item);
        });
    }

    async function fetchLyrics(searchTerm) {
        try {
            showLyricsView();
            const response = await fetch('/api/lyrics?song=' + encodeURIComponent(searchTerm));
            const data = await response.json();
            
            if (data.error) {
                lyricsDisplay.innerHTML = `<p class="text-danger">${data.error}</p>`;
            } else {
                currentSong = searchTerm;
                lyricsDisplay.textContent = data.lyrics;
            }
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            lyricsDisplay.innerHTML = '<p class="text-danger">Error fetching lyrics</p>';
        }
    }

    async function saveLyrics() {
        if (!currentSong) return;
        
        try {
            const response = await fetch('/api/lyrics/edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    song: currentSong,
                    lyrics: lyricsTextarea.value
                })
            });
            
            if (response.ok) {
                lyricsDisplay.textContent = lyricsTextarea.value;
                showLyricsView();
            } else {
                const data = await response.json();
                alert('Error saving lyrics: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving lyrics:', error);
            alert('Error saving lyrics: ' + error.message);
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

    if (backButton) backButton.addEventListener('click', showSongListView);
    if (editButton) editButton.addEventListener('click', showEditView);
    if (saveButton) saveButton.addEventListener('click', saveLyrics);

    // Initialize
    fetchSongs();
    showSongListView(); // Ensure we start in the song list view
});
