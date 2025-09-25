document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentTrackName = document.getElementById('current-track-name');
    const currentArtistName = document.getElementById('current-artist-name');
    const currentAlbumArt = document.getElementById('current-album-art');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const progressBar = document.getElementById('progress');
    const volumeSlider = document.getElementById('volume-slider');
    const playlistEl = document.getElementById('playlist');
    const categoriesEl = document.getElementById('categories');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    // State
    let songs = [];
    let categories = [];
    let currentSongIndex = 0;
    let isPlaying = false;
    let currentAudio = null;
    
    // Fetch data from db.json
    async function fetchData() {
        try {
            const response = await fetch('db.json');
            const data = await response.json();
            songs = data.songs;
            categories = data.categories;
            renderPlaylist();
            renderCategories();
            if (songs.length > 0) {
                loadSong(0);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            playlistEl.innerHTML = '<p>Error loading songs. Please try again later.</p>';
        }
    }
    
    // Render playlist
    function renderPlaylist(songsToRender = songs) {
        playlistEl.innerHTML = '';
        
        if (songsToRender.length === 0) {
            playlistEl.innerHTML = '<p>No songs found.</p>';
            return;
        }
        
        songsToRender.forEach((song, index) => {
            const songItem = document.createElement('div');
            songItem.classList.add('song-item');
            songItem.innerHTML = `
                <img src="${song.cover}" alt="${song.title}">
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>
            `;
            songItem.addEventListener('click', () => {
                const originalIndex = songs.findIndex(s => s.id === song.id);
                loadSong(originalIndex);
                playSong();
            });
            playlistEl.appendChild(songItem);
        });
    }
    
    // Render categories
    function renderCategories() {
        categoriesEl.innerHTML = '';
        
        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.classList.add('category-item');
            categoryItem.innerHTML = `
                <i class="${category.icon}"></i>
                <h3>${category.name}</h3>
            `;
            categoryItem.addEventListener('click', () => {
                const filteredSongs = songs.filter(song => song.category === category.id);
                renderPlaylist(filteredSongs);
            });
            categoriesEl.appendChild(categoryItem);
        });
    }
    
    // Load song
    function loadSong(index) {
        if (index < 0 || index >= songs.length) return;
        
        currentSongIndex = index;
        const song = songs[currentSongIndex];
        
        currentTrackName.textContent = song.title;
        currentArtistName.textContent = song.artist;
        currentAlbumArt.src = song.cover;
        
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.removeEventListener('timeupdate', updateProgress);
            currentAudio.removeEventListener('ended', nextSong);
        }
        
        currentAudio = new Audio(song.audioUrl);
        currentAudio.addEventListener('timeupdate', updateProgress);
        currentAudio.addEventListener('ended', nextSong);
        
        volumeSlider.value = currentAudio.volume * 100;
        
        updatePlayPauseButton();
    }
    
    // Play song
    function playSong() {
        if (currentAudio) {
            currentAudio.play();
            isPlaying = true;
            updatePlayPauseButton();
        }
    }
    
    // Pause song
    function pauseSong() {
        if (currentAudio) {
            currentAudio.pause();
            isPlaying = false;
            updatePlayPauseButton();
        }
    }
    
    // Toggle play/pause
    function togglePlayPause() {
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
    }
    
    // Update play/pause button
    function updatePlayPauseButton() {
        if (isPlaying) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    // Previous song
    function prevSong() {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        loadSong(currentSongIndex);
        if (isPlaying) {
            playSong();
        }
    }
    
    // Next song
    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        loadSong(currentSongIndex);
        if (isPlaying) {
            playSong();
        }
    }
    
    // Update progress
    function updateProgress() {
        if (currentAudio) {
            const currentTime = currentAudio.currentTime;
            const duration = currentAudio.duration;
            
            if (isNaN(duration)) return;
            
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
            
            currentTimeEl.textContent = formatTime(currentTime);
            durationEl.textContent = formatTime(duration);
        }
    }
    
    // Format time
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    // Set progress
    function setProgress(e) {
        if (currentAudio) {
            const width = this.clientWidth;
            const clickX = e.offsetX;
            const duration = currentAudio.duration;
            
            if (isNaN(duration)) return;
            
            currentAudio.currentTime = (clickX / width) * duration;
        }
    }
    
    // Set volume
    function setVolume() {
        if (currentAudio) {
            currentAudio.volume = volumeSlider.value / 100;
        }
    }
    
    // Search songs
    function searchSongs() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredSongs = songs.filter(song => 
            song.title.toLowerCase().includes(searchTerm) || 
            song.artist.toLowerCase().includes(searchTerm)
        );
        renderPlaylist(filteredSongs);
    }
    
    // Event listeners
    playBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    progressBar.parentElement.addEventListener('click', setProgress);
    volumeSlider.addEventListener('input', setVolume);
    searchBtn.addEventListener('click', searchSongs);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchSongs();
        }
    });
    
    // Initialize
    fetchData();
});