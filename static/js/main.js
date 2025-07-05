// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize music toggle
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
        musicToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            saveSettings({ music_enabled: isEnabled });
            
            if (isEnabled) {
                playBackgroundMusic();
            } else {
                pauseBackgroundMusic();
            }
        });
    }

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Initialize page based on current location
    initializePage();
});

function initializePage() {
    const path = window.location.pathname;
    
    if (path === '/') {
        // Dashboard page
        initializeDashboard();
    } else if (path.startsWith('/section/')) {
        // Section detail page
        initializeSectionDetail();
    }
}

function initializeDashboard() {
    // Initialize timers
    if (typeof initializeTimers === 'function') {
        initializeTimers();
    }
    
    // Initialize audio
    if (typeof initializeAudio === 'function') {
        initializeAudio();
    }
    
    // Set up streak counter
    setupStreakCounter();
}

function initializeSectionDetail() {
    // Initialize task filters
    setupTaskFilters();
    
    // Initialize task sorting
    setupTaskSorting();
}

function setupStreakCounter() {
    const streakDisplay = document.getElementById('current-streak');
    if (!streakDisplay) return;
    
    const streakCard = streakDisplay.closest('.card-body');
    if (streakCard && !document.getElementById('streak-buttons')) {
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'streak-buttons';
        buttonContainer.className = 'mt-2';
        
        const incrementBtn = document.createElement('button');
        incrementBtn.className = 'btn btn-sm btn-outline-primary me-2';
        incrementBtn.innerHTML = '<i class="fas fa-plus me-1"></i>+1';
        incrementBtn.onclick = function() {
            incrementStreak();
        };
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-sm btn-outline-secondary';
        resetBtn.innerHTML = '<i class="fas fa-redo me-1"></i>Reset';
        resetBtn.onclick = function() {
            resetStreak();
        };
        
        buttonContainer.appendChild(incrementBtn);
        buttonContainer.appendChild(resetBtn);
        streakCard.appendChild(buttonContainer);
    }
}

function incrementStreak() {
    const streakDisplay = document.getElementById('current-streak');
    if (streakDisplay) {
        const currentStreak = parseInt(streakDisplay.textContent);
        const newStreak = currentStreak + 1;
        streakDisplay.textContent = newStreak;
        
        // Add visual feedback
        streakDisplay.classList.add('updated');
        setTimeout(() => {
            streakDisplay.classList.remove('updated');
        }, 2000);
        
        // Save to server
        fetch('/api/update_streak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ streak_count: newStreak })
        }).then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showNotification('Streak updated!', 'success');
            }
        });
    }
}

function resetStreak() {
    const streakDisplay = document.getElementById('current-streak');
    if (streakDisplay) {
        streakDisplay.textContent = '0';
        
        // Add visual feedback
        streakDisplay.classList.add('updated');
        setTimeout(() => {
            streakDisplay.classList.remove('updated');
        }, 2000);
        
        // Save to server
        fetch('/api/update_streak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ streak_count: 0 })
        }).then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showNotification('Streak reset!', 'info');
            }
        });
    }
}

function setupTaskFilters() {
    // Add filter buttons to task view
    const taskCard = document.querySelector('.card:last-child');
    if (taskCard && window.location.pathname.startsWith('/section/')) {
        const cardHeader = taskCard.querySelector('.card-header');
        if (cardHeader) {
            const filterContainer = document.createElement('div');
            filterContainer.className = 'd-flex justify-content-between align-items-center';
            
            const title = cardHeader.querySelector('.card-title');
            const filterButtons = document.createElement('div');
            filterButtons.className = 'btn-group btn-group-sm';
            filterButtons.innerHTML = `
                <button class="btn btn-outline-primary active" onclick="filterTasks('all')">All</button>
                <button class="btn btn-outline-primary" onclick="filterTasks('pending')">Pending</button>
                <button class="btn btn-outline-primary" onclick="filterTasks('completed')">Completed</button>
                <button class="btn btn-outline-primary" onclick="filterTasks('high')">High Priority</button>
            `;
            
            filterContainer.appendChild(title);
            filterContainer.appendChild(filterButtons);
            
            cardHeader.innerHTML = '';
            cardHeader.appendChild(filterContainer);
        }
    }
}

function filterTasks(filter) {
    const taskCards = document.querySelectorAll('.task-card');
    const filterButtons = document.querySelectorAll('.btn-group .btn');
    
    // Update active button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    taskCards.forEach(card => {
        let show = false;
        
        switch (filter) {
            case 'all':
                show = true;
                break;
            case 'pending':
                show = !card.classList.contains('task-completed');
                break;
            case 'completed':
                show = card.classList.contains('task-completed');
                break;
            case 'high':
                show = card.querySelector('.priority-high') !== null;
                break;
        }
        
        card.closest('.col-md-6').style.display = show ? 'block' : 'none';
    });
}

function setupTaskSorting() {
    // This would add sorting functionality
    // Implementation depends on specific requirements
}

function saveSettings(settings) {
    fetch('/api/save_settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    }).then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('Settings saved successfully');
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification alert alert-${type}`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close ms-2" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Utility functions
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(hours) {
    if (hours < 1) {
        return `${Math.round(hours * 60)}m`;
    } else {
        return `${hours.toFixed(1)}h`;
    }
}

// Export functions for other modules
window.showNotification = showNotification;
window.saveSettings = saveSettings;
window.formatTime = formatTime;
window.formatDuration = formatDuration;
