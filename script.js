/* ==================== STUDY TOUR - SCRIPT ==================== */

(function() {
  'use strict';

  /* -------------------- CONFIGURATION -------------------- */
  const CONFIG = {
    API_URL: 'https://landscape-data-pipeline-production.up.railway.app/api/random',
    CANVAS_MAX_WIDTH: 1920,
    CANVAS_MAX_HEIGHT: 1080,
    PIXEL_STAGES: 16,
    MAX_BLOCK_SIZE: 256,
    MIN_BLOCK_SIZE: 8,
    BLAST_DURATION: 3000,
    TRANSITION_ZONE: 150
  };

  const LOCAL_LANDSCAPES = [
    { path: 'landscapes/lofoten_islands.jpg', caption: 'Lofoten Islands, Norway' },
    { path: 'landscapes/benagil_cave.jpg', caption: 'Benagil Cave, Portugal' },
    { path: 'landscapes/yellowstone.jpg', caption: 'Yellowstone, United States' },
    { path: 'landscapes/great_wall_of_china.jpg', caption: 'Great Wall of China, China' },
    { path: 'landscapes/ben_gioc.jpg', caption: 'Ban Gioc Waterfall, Vietnam' }
  ];

  /* -------------------- DOM ELEMENTS -------------------- */

  const elements = {
    canvas: document.getElementById('landscapesCanvas'),
    timeButton: document.getElementById('timeButton'),
    pauseButton: document.getElementById('pauseButton'),
    inputBox: document.querySelector('.input'),
    titleStudyTime: document.getElementById('titleStudyTime'),
    plus30: document.getElementById('plus30'),
    startButton: document.getElementById('startButton'),
    inputScreen: document.querySelector('.inputScreen'),
    clockScreen: document.querySelector('.clock'),
    clockStudyTime: document.getElementById('studyTime')
  };

  const ctx = elements.canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  /* -------------------- APPLICATION STATE -------------------- */

  const state = {
    inputValue: 0,
    remainingSeconds: 0,
    lastStage: -1,
    countdownInterval: null,
    isHovering: false,
    imageData: null,
    currentImageData: null
  };

  const randomIndex = Math.floor(Math.random() * 5);
  const landscapeImage = LOCAL_LANDSCAPES[randomIndex];
  landscapeImage.crossOrigin = 'anonymous';

  /* -------------------- UTILITY FUNCTIONS -------------------- */

  function secondsToTime(seconds) {
    const total = parseInt(seconds) || 0;
    const secs = total % 60;
    const mins = Math.floor(total / 60) % 60;
    const hours = Math.floor(total / 3600);

    if (hours === 0) {
      return `${mins}:${String(secs).padStart(2, '0')}`;
    }
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function minutesToDisplay(minutes) {
    const total = parseInt(minutes) || 0;
    const hours = Math.floor(total / 60);
    const mins = total % 60;

    if (hours === 0) {
      return `0:${String(mins).padStart(2, '0')}`;
    }
    return `${hours}:${String(mins).padStart(2, '0')}`;
  }

  function updateRealTimeClock() {
    if (state.isHovering) return;

    const now = new Date();
    const hours = String(now.getHours());
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    elements.timeButton.textContent = `${hours} : ${minutes} : ${seconds}`;
  }

  /* -------------------- CANVAS & PIXEL FUNCTIONS -------------------- */

  function initializeCanvas() {
    elements.canvas.width = Math.min(window.innerWidth, CONFIG.CANVAS_MAX_WIDTH);
    elements.canvas.height = Math.min(window.innerHeight, CONFIG.CANVAS_MAX_HEIGHT);
  }

  function getAverageColor(startX, startY, blockWidth, blockHeight, saturation = 1.0) {
    let r = 0, g = 0, b = 0, count = 0;

    for (let y = startY; y < startY + blockHeight && y < elements.canvas.height; y++) {
      for (let x = startX; x < startX + blockWidth && x < elements.canvas.width; x++) {
        const index = (y * elements.canvas.width + x) * 4;
        r += state.imageData.data[index];
        g += state.imageData.data[index + 1];
        b += state.imageData.data[index + 2];
        count++;
      }
    }

    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    if (saturation < 1.0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = Math.floor(r * saturation + gray * (1 - saturation));
      g = Math.floor(g * saturation + gray * (1 - saturation));
      b = Math.floor(b * saturation + gray * (1 - saturation));
    }

    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawPixelated(blockSize) {
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    for (let y = 0; y < elements.canvas.height; y += blockSize) {
      for (let x = 0; x < elements.canvas.width; x += blockSize) {
        const color = getAverageColor(x, y, blockSize, blockSize);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, blockSize, blockSize);
      }
    }
  }

  function calculateStage() {
    const totalSeconds = state.inputValue * 60;
    if (totalSeconds === 0) return 0;

    const progress = (totalSeconds - state.remainingSeconds) / totalSeconds;
    const stage = Math.floor(progress * CONFIG.PIXEL_STAGES);
    return Math.min(stage, CONFIG.PIXEL_STAGES - 1);
  }

  function calculateBlockSize() {
    const stage = calculateStage();
    const stageProgress = stage / (CONFIG.PIXEL_STAGES - 1);
    const easedProgress = Math.pow(stageProgress, 1.4);
    const blockSize = CONFIG.MAX_BLOCK_SIZE * Math.pow(CONFIG.MIN_BLOCK_SIZE / CONFIG.MAX_BLOCK_SIZE, easedProgress);
    return Math.round(blockSize);
  }

  /* -------------------- IMAGE LOADING -------------------- */

  async function loadRandomLandscape() {
    try {
      const response = await fetch(CONFIG.API_URL);
      const data = await response.json();

      if (data.success) {
        state.currentImageData = data.data;
        landscapeImage.src = data.data.imageUrl;
      } else {
        fallbackToLocalImage();
      }
    } catch (error) {
      console.error('Failed to fetch from API:', error);
      fallbackToLocalImage();
    }
  }

  function fallbackToLocalImage() {
    const randomLandscape = LOCAL_LANDSCAPES[Math.floor(Math.random() * LOCAL_LANDSCAPES.length)];

    state.currentImageData = {
      imageUrl: randomLandscape.path,
      caption: randomLandscape.caption,
      photographer: { name: 'Unknown' }
    };

    landscapeImage.src = randomLandscape.path;
  }

  function handleImageLoad() {
    ctx.drawImage(landscapeImage, 0, 0, elements.canvas.width, elements.canvas.height);
    state.imageData = ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
    drawPixelated(200);
  }

  /* -------------------- TIMER FUNCTIONS -------------------- */

  function updateStudyTime() {
    state.inputValue = parseInt(elements.inputBox.value.trim()) || 0;
    elements.titleStudyTime.textContent = minutesToDisplay(state.inputValue);
  }

  function startTimer() {
    if (state.inputValue <= 0) return;

    elements.inputScreen.style.display = 'none';
    elements.clockScreen.style.display = 'flex';
    document.body.style.backgroundImage = 'none';
    elements.canvas.style.display = 'block';

    state.remainingSeconds = state.inputValue * 60;
    elements.clockStudyTime.textContent = secondsToTime(state.remainingSeconds);
    drawPixelated(calculateBlockSize());
  }

  function startCountdown() {
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
    }

    state.countdownInterval = setInterval(function() {
      state.remainingSeconds--;

      if (state.remainingSeconds <= 0) {
        clearInterval(state.countdownInterval);
        elements.clockStudyTime.textContent = '';
        elements.timeButton.style.display = 'none';
        elements.pauseButton.style.display = 'none';
        colorBlastReveal();
      } else {
        elements.clockStudyTime.textContent = secondsToTime(state.remainingSeconds);
      }

      const newStage = calculateStage();
      if (newStage !== state.lastStage) {
        state.lastStage = newStage;
        drawPixelated(calculateBlockSize());
      }
    }, 1000);
  }

  /* -------------------- REVEAL ANIMATION -------------------- */

  function colorBlastReveal() {
    elements.clockScreen.style.background = 'transparent';
    elements.clockScreen.style.backdropFilter = 'none';
    elements.clockScreen.style.webkitBackdropFilter = 'none';
    elements.clockScreen.style.border = 'none';
    elements.clockScreen.style.boxShadow = 'none';

    const startTime = Date.now();

    function animateBlast() {
      const elapsed = Date.now() - startTime;
      const blastProgress = Math.min(1, elapsed / CONFIG.BLAST_DURATION);
      const easedProgress = 1 - Math.pow(1 - blastProgress, 2);
      const wavePosition = easedProgress * (elements.canvas.width + CONFIG.TRANSITION_ZONE);

      ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

      const blockSize = CONFIG.MIN_BLOCK_SIZE;
      for (let y = 0; y < elements.canvas.height; y += blockSize) {
        for (let x = 0; x < elements.canvas.width; x += blockSize) {
          const color = getAverageColor(x, y, blockSize, blockSize);
          ctx.fillStyle = color;
          ctx.fillRect(x, y, blockSize, blockSize);
        }
      }

      if (wavePosition > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, Math.max(0, wavePosition), elements.canvas.height);
        ctx.clip();
        ctx.drawImage(landscapeImage, 0, 0, elements.canvas.width, elements.canvas.height);
        ctx.restore();

        if (wavePosition < elements.canvas.width + CONFIG.TRANSITION_ZONE) {
          const gradient = ctx.createLinearGradient(
            wavePosition - CONFIG.TRANSITION_ZONE, 0,
            wavePosition, 0
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
          ctx.fillStyle = gradient;
          ctx.fillRect(wavePosition - CONFIG.TRANSITION_ZONE, 0, CONFIG.TRANSITION_ZONE, elements.canvas.height);
        }
      }

      if (blastProgress < 1) {
        requestAnimationFrame(animateBlast);
      } else {
        ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
        ctx.drawImage(landscapeImage, 0, 0, elements.canvas.width, elements.canvas.height);
        showLocationCaption();
      }
    }

    requestAnimationFrame(animateBlast);
  }

  /* -------------------- UI OVERLAYS -------------------- */

  function showLocationCaption() {
    if (!state.currentImageData || !state.currentImageData.caption) {
      setTimeout(showRestartPrompt, 2000);
      return;
    }

    const caption = document.createElement('div');
    caption.id = 'locationCaption';
    caption.textContent = `📍 ${state.currentImageData.caption}`;

    Object.assign(caption.style, {
      position: 'fixed',
      bottom: '40px',
      left: '40px',
      color: 'white',
      fontSize: '1.5rem',
      fontFamily: "'Inter', sans-serif",
      fontWeight: '600',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      padding: '15px 25px',
      borderRadius: '15px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      webkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      opacity: '0',
      transform: 'translateY(10px)',
      transition: 'opacity 1s ease, transform 1s ease, box-shadow 0.5s ease',
      zIndex: '1000'
    });

    document.body.appendChild(caption);

    setTimeout(() => {
      caption.style.opacity = '1';
      caption.style.transform = 'translateY(0)';
    }, 500);

    setTimeout(() => {
      caption.style.boxShadow = '0 8px 40px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.3)';
      setTimeout(() => {
        caption.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
      }, 600);
    }, 1500);

    setTimeout(showRestartPrompt, 4000);
  }

  function showRestartPrompt() {
    const prompt = document.createElement('div');
    prompt.id = 'restartPrompt';
    prompt.textContent = 'Press SPACE to restart';

    Object.assign(prompt.style, {
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: 'translate(-50%, 20px)',
      color: 'white',
      fontSize: '1.5rem',
      fontFamily: "'Inter', sans-serif",
      fontWeight: '600',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      padding: '15px 35px',
      borderRadius: '15px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      webkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      opacity: '0',
      transition: 'opacity 1.5s ease, transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      zIndex: '1000'
    });

    document.body.appendChild(prompt);

    setTimeout(() => {
      prompt.style.opacity = '1';
      prompt.style.transform = 'translate(-50%, 0)';
    }, 100);

    setTimeout(() => {
      prompt.style.animation = 'blink 2s ease-in-out infinite';
    }, 1600);

    if (!document.getElementById('blinkAnimation')) {
      const style = document.createElement('style');
      style.id = 'blinkAnimation';
      style.textContent = `
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /* -------------------- RESTART -------------------- */

  function restartTimer() {
    const caption = document.getElementById('locationCaption');
    const prompt = document.getElementById('restartPrompt');
    if (caption) caption.remove();
    if (prompt) prompt.remove();

    elements.clockScreen.style.display = 'none';
    elements.inputScreen.style.display = 'flex';
    elements.canvas.style.display = 'none';
    document.body.style.backgroundImage = "url('images/title-screen-background.png')";

    Object.assign(elements.clockScreen.style, {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      webkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    });

    elements.timeButton.style.visibility = 'visible';
    elements.timeButton.style.display = 'block';
    elements.pauseButton.style.display = 'block';
    elements.pauseButton.textContent = 'Start';
    elements.pauseButton.style.opacity = '1';

    state.inputValue = 0;
    state.remainingSeconds = 0;
    state.lastStage = -1;

    elements.inputBox.value = '';
    elements.titleStudyTime.textContent = '0:00';

    loadRandomLandscape();
    elements.inputBox.focus();
  }

  /* -------------------- EVENT LISTENERS -------------------- */

  function initializeEventListeners() {
    elements.inputBox.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        updateStudyTime();
        elements.inputBox.blur();
      }
    });

    elements.inputBox.addEventListener('blur', updateStudyTime);

    document.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && elements.inputScreen.style.display !== 'none') {
        if (document.activeElement !== elements.inputBox && state.inputValue > 0) {
          startTimer();
        }
      }
    });

    elements.plus30.addEventListener('click', function() {
      state.inputValue += 30;
      elements.titleStudyTime.textContent = minutesToDisplay(state.inputValue);
    });

    elements.startButton.addEventListener('click', startTimer);

    elements.timeButton.addEventListener('mouseenter', function() {
      state.isHovering = true;
      elements.timeButton.textContent = 'Hide';
    });

    elements.timeButton.addEventListener('mouseleave', function() {
      state.isHovering = false;
      updateRealTimeClock();
    });

    elements.timeButton.addEventListener('click', function() {
      elements.timeButton.style.visibility = 'hidden';
    });

    elements.pauseButton.addEventListener('click', function() {
      if (elements.pauseButton.textContent === 'Start') {
        elements.pauseButton.style.opacity = '0';
        startCountdown();
        elements.pauseButton.textContent = 'Pause';
      } else if (elements.pauseButton.textContent === 'Pause') {
        clearInterval(state.countdownInterval);
        elements.pauseButton.textContent = 'Resume';
      } else {
        startCountdown();
        elements.pauseButton.textContent = 'Pause';
      }
    });

    elements.pauseButton.addEventListener('mouseenter', function() {
      if (elements.pauseButton.textContent === 'Pause') {
        elements.pauseButton.style.opacity = '1';
      }
    });

    elements.pauseButton.addEventListener('mouseleave', function() {
      if (elements.pauseButton.textContent === 'Pause') {
        elements.pauseButton.style.opacity = '0';
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        if (elements.canvas.style.display === 'block' && state.remainingSeconds === 0) {
          e.preventDefault();
          restartTimer();
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(console.error);
        } else {
          document.exitFullscreen();
        }
      }
    });

    window.addEventListener('resize', function() {
      if (elements.canvas.style.display !== 'block') return;

      const oldWidth = elements.canvas.width;
      const oldHeight = elements.canvas.height;

      elements.canvas.width = Math.min(window.innerWidth, CONFIG.CANVAS_MAX_WIDTH);
      elements.canvas.height = Math.min(window.innerHeight, CONFIG.CANVAS_MAX_HEIGHT);

      if (oldWidth !== elements.canvas.width || oldHeight !== elements.canvas.height) {
        ctx.drawImage(landscapeImage, 0, 0, elements.canvas.width, elements.canvas.height);
        state.imageData = ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);

        if (state.remainingSeconds > 0) {
          drawPixelated(calculateBlockSize());
        }
      }
    });

    landscapeImage.onload = handleImageLoad;
    landscapeImage.onerror = fallbackToLocalImage;
  }

  /* -------------------- INITIALIZATION -------------------- */

  function init() {
    initializeCanvas();
    initializeEventListeners();
    loadRandomLandscape();
    updateRealTimeClock();
    setInterval(updateRealTimeClock, 1000);
    elements.inputBox.focus();
  }

  window.addEventListener('load', init);

})();
