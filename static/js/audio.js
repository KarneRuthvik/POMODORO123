// Audio functionality
let audioPlayer = {
    audio: null,
    isPlaying: false,
    currentFile: null
};

function initializeAudio() {
    const audioElement = document.getElementById('background-audio');
    const musicToggle = document.getElementById('musicToggle');
    
    if (audioElement) {
        audioPlayer.audio = audioElement;
        audioPlayer.currentFile = audioElement.querySelector('source')?.src;
        
        // Set up audio event listeners
        audioElement.addEventListener('loadstart', () => {
            console.log('Audio loading started');
        });
        
        audioElement.addEventListener('canplay', () => {
            console.log('Audio can play');
        });
        
        audioElement.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showNotification('Error loading audio file', 'error');
        });
        
        audioElement.addEventListener('ended', () => {
            // Audio ended, but it should loop
            console.log('Audio ended');
        });
        
        // Check if music should be playing
        if (musicToggle && musicToggle.checked) {
            playBackgroundMusic();
        }
    }
    
    // Set up music toggle listener
    if (musicToggle) {
        musicToggle.addEventListener('change', function() {
            if (this.checked) {
                playBackgroundMusic();
            } else {
                pauseBackgroundMusic();
            }
        });
    }
    
    // Set up audio controls
    setupAudioControls();
}

function playBackgroundMusic() {
    if (audioPlayer.audio && audioPlayer.currentFile) {
        audioPlayer.audio.play().then(() => {
            audioPlayer.isPlaying = true;
            console.log('Background music started');
        }).catch(error => {
            console.error('Error playing audio:', error);
            showNotification('Could not play audio. Please check your browser settings.', 'warning');
        });
    }
}

function pauseBackgroundMusic() {
    if (audioPlayer.audio) {
        audioPlayer.audio.pause();
        audioPlayer.isPlaying = false;
        console.log('Background music paused');
    }
}

function stopBackgroundMusic() {
    if (audioPlayer.audio) {
        audioPlayer.audio.pause();
        audioPlayer.audio.currentTime = 0;
        audioPlayer.isPlaying = false;
        console.log('Background music stopped');
    }
}

function setVolume(volume) {
    if (audioPlayer.audio) {
        audioPlayer.audio.volume = volume / 100;
    }
}

function setupAudioControls() {
    // Add audio controls to the page if they don't exist
    const audioControlsContainer = document.querySelector('.audio-controls');
    if (!audioControlsContainer && audioPlayer.audio) {
        const controls = createAudioControls();
        const musicToggleContainer = document.getElementById('musicToggle').closest('.me-3');
        if (musicToggleContainer) {
            musicToggleContainer.appendChild(controls);
        }
    }
}

function createAudioControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'audio-controls mt-2';
    
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = '50';
    volumeSlider.className = 'form-range';
    volumeSlider.style.width = '100px';
    volumeSlider.addEventListener('input', (e) => {
        setVolume(e.target.value);
    });
    
    const volumeLabel = document.createElement('label');
    volumeLabel.innerHTML = '<i class="fas fa-volume-up me-1"></i>Volume';
    volumeLabel.className = 'form-label text-muted';
    
    controlsDiv.appendChild(volumeLabel);
    controlsDiv.appendChild(volumeSlider);
    
    return controlsDiv;
}

function switchAudioFile(audioId) {
    // This function would be called when switching audio files
    fetch(`/set_active_audio/${audioId}`, {
        method: 'POST'
    }).then(response => {
        if (response.ok) {
            // Reload the page to update the audio element
            location.reload();
        }
    }).catch(error => {
        console.error('Error switching audio file:', error);
        showNotification('Error switching audio file', 'error');
    });
}

function uploadAudioFile(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please select a valid audio file (MP3, WAV, OGG, M4A)', 'error');
        return;
    }
    
    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
        showNotification('File size must be less than 16MB', 'error');
        return;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Show loading state
    const uploadBtn = document.querySelector('#uploadModal .btn-primary');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Uploading...';
    uploadBtn.disabled = true;
    
    // Upload file
    fetch('/upload_file', {
        method: 'POST',
        body: formData
    }).then(response => {
        if (response.ok) {
            showNotification('Audio file uploaded successfully!', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            throw new Error('Upload failed');
        }
    }).catch(error => {
        console.error('Error uploading file:', error);
        showNotification('Error uploading audio file', 'error');
    }).finally(() => {
        // Reset button state
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
    });
}

function deleteAudioFile(audioId) {
    if (confirm('Are you sure you want to delete this audio file?')) {
        fetch(`/delete_audio/${audioId}`, {
            method: 'POST'
        }).then(response => {
            if (response.ok) {
                showNotification('Audio file deleted successfully', 'success');
                location.reload();
            } else {
                throw new Error('Delete failed');
            }
        }).catch(error => {
            console.error('Error deleting audio file:', error);
            showNotification('Error deleting audio file', 'error');
        });
    }
}

// Audio visualization (optional enhancement)
function createAudioVisualizer() {
    if (!audioPlayer.audio) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioPlayer.audio);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    canvas.style.border = '1px solid #FF6200';
    canvas.style.borderRadius = '4px';
    
    const canvasCtx = canvas.getContext('2d');
    
    function draw() {
        requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        canvasCtx.fillStyle = '#121212';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            canvasCtx.fillStyle = '#FF6200';
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
    
    draw();
    
    // Add canvas to audio controls
    const audioControls = document.querySelector('.audio-controls');
    if (audioControls) {
        audioControls.appendChild(canvas);
    }
}

// Initialize audio when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAudio();
});

// Handle page visibility change to pause/resume audio
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, pause audio
        if (audioPlayer.isPlaying) {
            pauseBackgroundMusic();
        }
    } else {
        // Page is visible, resume audio if music toggle is on
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle && musicToggle.checked) {
            playBackgroundMusic();
        }
    }
});
