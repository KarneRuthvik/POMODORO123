// Timer functionality
let workTimer = {
    seconds: 0,
    interval: null,
    isRunning: false,
    startTime: null
};

let pomodoroTimer = {
    seconds: 0,
    interval: null,
    isRunning: false,
    isBreak: false,
    workDuration: 25 * 60, // 25 minutes
    breakDuration: 5 * 60, // 5 minutes
    startTime: null
};

function initializeTimers() {
    // Initialize work timer
    updateWorkTimerDisplay();
    
    // Initialize pomodoro timer
    updatePomodoroSettings();
    updatePomodoroTimerDisplay();
    
    // Set up settings listeners
    document.getElementById('pomodoro-work').addEventListener('change', updatePomodoroSettings);
    document.getElementById('pomodoro-break').addEventListener('change', updatePomodoroSettings);
}

// Work Timer Functions
function startWorkTimer() {
    if (!workTimer.isRunning) {
        workTimer.startTime = new Date();
        workTimer.interval = setInterval(() => {
            workTimer.seconds++;
            updateWorkTimerDisplay();
        }, 1000);
        workTimer.isRunning = true;
        
        // Update button states
        updateWorkTimerButtons();
        
        showNotification('Work timer started!', 'success');
    }
}

function pauseWorkTimer() {
    if (workTimer.isRunning) {
        clearInterval(workTimer.interval);
        workTimer.isRunning = false;
        updateWorkTimerButtons();
        showNotification('Work timer paused', 'info');
    }
}

function stopWorkTimer() {
    if (workTimer.isRunning || workTimer.seconds > 0) {
        clearInterval(workTimer.interval);
        workTimer.isRunning = false;
        
        // Save working session
        if (workTimer.seconds > 60) { // Only save if worked for more than 1 minute
            saveWorkingSession();
        }
        
        workTimer.seconds = 0;
        workTimer.startTime = null;
        updateWorkTimerDisplay();
        updateWorkTimerButtons();
        showNotification('Work timer stopped!', 'info');
    }
}

function resetWorkTimer() {
    clearInterval(workTimer.interval);
    workTimer.seconds = 0;
    workTimer.isRunning = false;
    workTimer.startTime = null;
    updateWorkTimerDisplay();
    updateWorkTimerButtons();
    showNotification('Work timer reset', 'info');
}

function updateWorkTimerDisplay() {
    const display = document.getElementById('work-timer');
    if (display) {
        display.textContent = formatTime(workTimer.seconds);
    }
}

function updateWorkTimerButtons() {
    const startBtn = document.querySelector('[onclick="startWorkTimer()"]');
    const pauseBtn = document.querySelector('[onclick="pauseWorkTimer()"]');
    const stopBtn = document.querySelector('[onclick="stopWorkTimer()"]');
    
    if (startBtn && pauseBtn && stopBtn) {
        if (workTimer.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = workTimer.seconds === 0;
        }
    }
}

// Pomodoro Timer Functions
function startPomodoroTimer() {
    if (!pomodoroTimer.isRunning) {
        pomodoroTimer.startTime = new Date();
        pomodoroTimer.interval = setInterval(() => {
            pomodoroTimer.seconds--;
            updatePomodoroTimerDisplay();
            
            if (pomodoroTimer.seconds <= 0) {
                pomodoroTimerComplete();
            }
        }, 1000);
        pomodoroTimer.isRunning = true;
        updatePomodoroTimerButtons();
        
        const timerType = pomodoroTimer.isBreak ? 'break' : 'work';
        showNotification(`Pomodoro ${timerType} timer started!`, 'success');
    }
}

function pausePomodoroTimer() {
    if (pomodoroTimer.isRunning) {
        clearInterval(pomodoroTimer.interval);
        pomodoroTimer.isRunning = false;
        updatePomodoroTimerButtons();
        showNotification('Pomodoro timer paused', 'info');
    }
}

function stopPomodoroTimer() {
    if (pomodoroTimer.isRunning || pomodoroTimer.seconds !== pomodoroTimer.workDuration) {
        clearInterval(pomodoroTimer.interval);
        pomodoroTimer.isRunning = false;
        pomodoroTimer.isBreak = false;
        pomodoroTimer.seconds = pomodoroTimer.workDuration;
        pomodoroTimer.startTime = null;
        updatePomodoroTimerDisplay();
        updatePomodoroTimerButtons();
        showNotification('Pomodoro timer stopped!', 'info');
    }
}

function resetPomodoroTimer() {
    clearInterval(pomodoroTimer.interval);
    pomodoroTimer.isRunning = false;
    pomodoroTimer.isBreak = false;
    pomodoroTimer.seconds = pomodoroTimer.workDuration;
    pomodoroTimer.startTime = null;
    updatePomodoroTimerDisplay();
    updatePomodoroTimerButtons();
    showNotification('Pomodoro timer reset', 'info');
}

function pomodoroTimerComplete() {
    clearInterval(pomodoroTimer.interval);
    pomodoroTimer.isRunning = false;
    
    if (pomodoroTimer.isBreak) {
        // Break complete, switch to work
        pomodoroTimer.isBreak = false;
        pomodoroTimer.seconds = pomodoroTimer.workDuration;
        showNotification('Break time over! Ready for work?', 'info');
        sendBrowserNotification('Break Complete', 'Time to get back to work!');
    } else {
        // Work complete, switch to break
        pomodoroTimer.isBreak = true;
        pomodoroTimer.seconds = pomodoroTimer.breakDuration;
        showNotification('Work session complete! Time for a break.', 'success');
        sendBrowserNotification('Work Session Complete', 'Time for a well-deserved break!');
        
        // Save pomodoro session
        savePomodoroSession();
    }
    
    updatePomodoroTimerDisplay();
    updatePomodoroTimerButtons();
    
    // Play notification sound
    playNotificationSound();
}

function updatePomodoroTimerDisplay() {
    const display = document.getElementById('pomodoro-timer');
    if (display) {
        display.textContent = formatTime(pomodoroTimer.seconds);
        
        // Update display color based on timer state
        if (pomodoroTimer.isBreak) {
            display.style.color = '#28a745'; // Green for break
        } else {
            display.style.color = '#FF6200'; // Orange for work
        }
    }
}

function updatePomodoroTimerButtons() {
    const startBtn = document.querySelector('[onclick="startPomodoroTimer()"]');
    const pauseBtn = document.querySelector('[onclick="pausePomodoroTimer()"]');
    const stopBtn = document.querySelector('[onclick="stopPomodoroTimer()"]');
    
    if (startBtn && pauseBtn && stopBtn) {
        if (pomodoroTimer.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = false;
        }
        
        // Update start button text based on timer state
        if (pomodoroTimer.isBreak) {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start Break';
        } else {
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start Work';
        }
    }
}

function updatePomodoroSettings() {
    const workInput = document.getElementById('pomodoro-work');
    const breakInput = document.getElementById('pomodoro-break');
    
    if (workInput && breakInput) {
        const workMinutes = parseInt(workInput.value) || 25;
        const breakMinutes = parseInt(breakInput.value) || 5;
        
        pomodoroTimer.workDuration = workMinutes * 60;
        pomodoroTimer.breakDuration = breakMinutes * 60;
        
        // Reset timer if not running
        if (!pomodoroTimer.isRunning) {
            pomodoroTimer.seconds = pomodoroTimer.workDuration;
            pomodoroTimer.isBreak = false;
            updatePomodoroTimerDisplay();
        }
        
        // Save settings
        saveSettings({
            pomodoro_duration: workMinutes,
            break_duration: breakMinutes
        });
    }
}

function saveWorkingSession() {
    const duration = workTimer.seconds / 3600; // Convert to hours
    const endTime = new Date();
    
    const sessionData = {
        start_time: workTimer.startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: duration,
        session_type: 'work'
    };
    
    fetch('/api/save_working_session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
    }).then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update the working hours display
            updateWorkingHoursDisplay(duration);
            showNotification(`Work session saved: ${formatDuration(duration)}`, 'success');
        }
    });
}

function savePomodoroSession() {
    const duration = pomodoroTimer.workDuration / 3600; // Convert to hours
    const endTime = new Date();
    
    const sessionData = {
        start_time: pomodoroTimer.startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: duration,
        session_type: 'pomodoro'
    };
    
    fetch('/api/save_working_session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
    }).then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update the working hours display
            updateWorkingHoursDisplay(duration);
            showNotification(`Pomodoro session completed: ${formatDuration(duration)}`, 'success');
        }
    });
}

function updateWorkingHoursDisplay(additionalHours) {
    const hoursDisplay = document.getElementById('total-working-hours');
    if (hoursDisplay) {
        const currentHours = parseFloat(hoursDisplay.textContent.replace('h', ''));
        const newHours = currentHours + additionalHours;
        hoursDisplay.textContent = newHours.toFixed(1) + 'h';
        
        // Add visual feedback
        hoursDisplay.classList.add('updated');
        setTimeout(() => {
            hoursDisplay.classList.remove('updated');
        }, 2000);
    }
}

function sendBrowserNotification(title, message) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/static/favicon.ico',
                requireInteraction: true
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, {
                        body: message,
                        icon: '/static/favicon.ico',
                        requireInteraction: true
                    });
                }
            });
        }
    }
}

function playNotificationSound() {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    
    // Second beep
    setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        gainNode2.gain.value = 0.3;
        
        oscillator2.start();
        oscillator2.stop(audioContext.currentTime + 0.2);
    }, 300);
}

// Request notification permission on page load
document.addEventListener('DOMContentLoaded', function() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
