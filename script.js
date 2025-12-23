/* ==================== CANVAS SETUP ==================== */
const canvas = document.getElementById('landscapesCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const landscapes = [
  'landscapes/lofoten_islands.jpg',
  'landscapes/benagil_cave.jpg',
  'landscapes/yellowstone.jpg'
];

const randomLandscape = landscapes[Math.floor(Math.random() * landscapes.length)];

const landscapeImage = new Image();
landscapeImage.src = randomLandscape;

landscapeImage.onload = function() {
  console.log('Loaded:', randomLandscape);
  ctx.drawImage(landscapeImage, 0, 0, canvas.width, canvas.height);
};

landscapeImage.onerror = function() {
  console.error('Failed to load:', randomLandscape);
};

/* ==================== CONSTANTS ==================== */
const timeButton = document.getElementById('timeButton')
const pauseButton = document.getElementById('pauseButton')
const inputBox = document.querySelector('.input');
const titleStudyTime = document.getElementById('titleStudyTime');
const plus30 = document.getElementById('plus30');
const startButton = document.getElementById('startButton');
const inputScreen = document.querySelector('.inputScreen');
const clockScreen = document.querySelector('.clock');
const clockStudyTime = document.getElementById('studyTime');
let isHovering = false;
let inputValue = 0;
let remainingSeconds = 0;
let countdownInterval = null;
let inFinalMinute = false

/* ==================== TIMER LOGIC ==================== */

/* --------------------TITLE SCREEN-------------------- */

/* Update on Enter key press */
inputBox.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        updateStudyTime();
        inputBox.blur();
    }
});

/* Update when input user clicks elsewhere */
inputBox.addEventListener('blur', function() {
    updateStudyTime();
});

/* Update +30 */
plus30.addEventListener('click', function() {
    inputValue += 30;
    titleStudyTime.textContent = secondsToTime(inputValue * 60);
});

/* Start button - switch screens */
startButton.addEventListener('click', function() {
    if (inputValue > 0) {
        inputScreen.style.display = 'none';
        clockScreen.style.display = 'flex';
        document.body.style.backgroundImage = 'none';
        canvas.style.display = 'block';
        remainingSeconds = inputValue * 60;
        clockStudyTime.textContent = secondsToTime(remainingSeconds);
    }
});

/* Update study time display */
function updateStudyTime() {
    inputValue = parseInt(inputBox.value.trim()) || 0;
    titleStudyTime.textContent = secondsToTime(inputValue * 60);
}

/* --------------------CLOCK SCREEN-------------------- */

/* Hide function for real time clock */
timeButton.addEventListener('mouseenter', function (){
    isHovering = true;
    timeButton.textContent = "Hide";
});

timeButton.addEventListener('mouseleave', function (){
    isHovering = false;
    updateClock();
});

timeButton.addEventListener('click', function(){
    timeButton.style.display = 'none';
})

/* Pause/Start button */
pauseButton.addEventListener('click', function() {
    if (pauseButton.textContent === "Start") {
        pauseButton.style.opacity = '0';
        startCountdown();
        pauseButton.textContent = "Pause";
    } else if (pauseButton.textContent === "Pause") {
        clearInterval(countdownInterval);
        pauseButton.textContent = "Resume";
    } else {
        startCountdown();
        pauseButton.textContent = "Pause";
    }
});

pauseButton.addEventListener('mouseenter', function() {
    if (pauseButton.textContent === "Pause") {
        pauseButton.style.opacity = '1';
    }
});

/* Hide pause button when mouse leaves */
pauseButton.addEventListener('mouseleave', function() {
    if (pauseButton.textContent === "Pause") {
        pauseButton.style.opacity = '0';
    }
});

/* Real time clock update */
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours());
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (!isHovering) {
        document.getElementById('timeButton').textContent = `${hours} : ${minutes} : ${seconds}`;
    }
}

/* --------------------CLOCK LOGIC-------------------- */

/* Convert seconds to time format */
function secondsToTime(seconds) {
    const total = parseInt(seconds) || 0;
    const secs = total % 60;
    const mins = Math.floor(total / 60) % 60;
    const hours = Math.floor(total / 3600);
    if (hours === 0) {
        return `0:${String(mins).padStart(2, '0')}`;
    }
    return `${hours}:${String(mins).padStart(2, '0')}`;
}

/* Countdown timer function */
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    countdownInterval = setInterval(function() {
        remainingSeconds --;
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            clockStudyTime.textContent = '';
            timeButton.style.display = 'none';
            pauseButton.style.display = 'none';
        } else if (remainingSeconds <= 60) {
            clockStudyTime.textContent = remainingSeconds;
        } else
            clockStudyTime.textContent = secondsToTime(remainingSeconds);
        
        
    }, 1000);
}

updateClock();
setInterval(updateClock, 1000);

/* ==================== PIXEL REVEAL ==================== */


/* ==================== INITIALIZATION ==================== */