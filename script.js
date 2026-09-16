/* ==================== STUDY TOUR - SCRIPT ==================== */

(function() {
  'use strict';

  /* -------------------- CONFIGURATION -------------------- */
  const CONFIG = {
    API_URL: 'https://landscape-data-pipeline.vercel.app/api/random',
    API_TIMEOUT: 5000,
    UTM_SOURCE: 'study_tour',
    CANVAS_MAX_WIDTH: 1920,
    CANVAS_MAX_HEIGHT: 1080,
    PIXEL_STAGES: 16,
    MAX_BLOCK_SIZE: 256,
    MIN_BLOCK_SIZE: 8,
    INITIAL_BLOCK_SIZE: 200,
    BLAST_DURATION: 3000,
    TRANSITION_ZONE: 150
  };

  const LOCAL_LANDSCAPES = [
    { path: 'backup-landscapes/lofoten_islands.jpg', caption: 'Lofoten Islands, Norway' },
    { path: 'backup-landscapes/benagil_cave.jpg', caption: 'Benagil Cave, Portugal' },
    { path: 'backup-landscapes/yellowstone.jpg', caption: 'Yellowstone, United States' },
    { path: 'backup-landscapes/great_wall_of_china.jpg', caption: 'Great Wall of China, China' },
    { path: 'backup-landscapes/ben_gioc.jpg', caption: 'Ban Gioc Waterfall, Vietnam' }
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

  /* -------------------- APPLICATION STATE -------------------- */

  const state = {
    inputValue: 0,
    remainingSeconds: 0,
    endTime: 0,
    lastStage: -1,
    countdownInterval: null,
    isHovering: false,
    isRunning: false,
    isRevealing: false,
    isRevealed: false,
    imageData: null,
    currentImageData: null,
    loadId: 0,
    overlayTimeouts: []
  };

  const landscapeImage = new Image();
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

  function withReferral(link) {
    try {
      const url = new URL(link);
      url.searchParams.set('utm_source', CONFIG.UTM_SOURCE);
      url.searchParams.set('utm_medium', 'referral');
      return url.toString();
    } catch (error) {
      return null;
    }
  }

  // The API serves 1080px-wide images; request a size that fills the canvas instead.
  function sizedImageUrl(imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.hostname === 'images.unsplash.com') {
        url.searchParams.set('w', String(CONFIG.CANVAS_MAX_WIDTH));
      }
      return url.toString();
    } catch (error) {
      return imageUrl;
    }
  }

  function scheduleOverlay(callback, delay) {
    state.overlayTimeouts.push(setTimeout(callback, delay));
  }

  /* -------------------- CANVAS & PIXEL FUNCTIONS -------------------- */

  function resizeCanvas() {
    elements.canvas.width = Math.min(window.innerWidth, CONFIG.CANVAS_MAX_WIDTH);
    elements.canvas.height = Math.min(window.innerHeight, CONFIG.CANVAS_MAX_HEIGHT);
    ctx.imageSmoothingQuality = 'high';
  }

  function isImageReady() {
    return landscapeImage.complete && landscapeImage.naturalWidth > 0;
  }

  // Draws the landscape scaled to cover the canvas without distorting its aspect ratio.
  function drawLandscape() {
    const { width, height } = elements.canvas;
    const scale = Math.max(width / landscapeImage.naturalWidth, height / landscapeImage.naturalHeight);
    const drawWidth = landscapeImage.naturalWidth * scale;
    const drawHeight = landscapeImage.naturalHeight * scale;
    ctx.drawImage(landscapeImage, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function captureImageData() {
    if (!isImageReady()) {
      state.imageData = null;
      return;
    }

    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    drawLandscape();
    try {
      state.imageData = ctx.getImageData(0, 0, elements.canvas.width, elements.canvas.height);
    } catch (error) {
      console.error('Unable to read landscape pixels:', error);
      state.imageData = null;
    }
  }

  function getAverageColor(startX, startY, blockWidth, blockHeight) {
    const { width, height } = elements.canvas;
    const data = state.imageData.data;
    let r = 0, g = 0, b = 0, count = 0;

    for (let y = startY; y < startY + blockHeight && y < height; y++) {
      for (let x = startX; x < startX + blockWidth && x < width; x++) {
        const index = (y * width + x) * 4;
        r += data[index];
        g += data[index + 1];
        b += data[index + 2];
        count++;
      }
    }

    return `rgb(${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)})`;
  }

  function drawPixelated(blockSize, context = ctx) {
    if (!state.imageData) return;

    context.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    for (let y = 0; y < elements.canvas.height; y += blockSize) {
      for (let x = 0; x < elements.canvas.width; x += blockSize) {
        context.fillStyle = getAverageColor(x, y, blockSize, blockSize);
        context.fillRect(x, y, blockSize, blockSize);
      }
    }
  }

  function redrawCanvas() {
    if (state.isRevealed) {
      ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
      drawLandscape();
    } else if (state.isRunning) {
      drawPixelated(calculateBlockSize());
    } else {
      drawPixelated(CONFIG.INITIAL_BLOCK_SIZE);
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
    const loadId = ++state.loadId;

    try {
      const response = await fetch(CONFIG.API_URL, { signal: AbortSignal.timeout(CONFIG.API_TIMEOUT) });
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      if (loadId !== state.loadId) return;

      if (data.success && data.data && data.data.imageUrl) {
        state.currentImageData = { ...data.data, isRemote: true };
        landscapeImage.src = sizedImageUrl(data.data.imageUrl);
      } else {
        throw new Error(data.error || 'API returned no image');
      }
    } catch (error) {
      if (loadId !== state.loadId) return;
      console.error('Failed to fetch from API:', error);
      fallbackToLocalImage();
    }
  }

  function fallbackToLocalImage() {
    const randomLandscape = LOCAL_LANDSCAPES[Math.floor(Math.random() * LOCAL_LANDSCAPES.length)];

    state.currentImageData = {
      imageUrl: randomLandscape.path,
      caption: randomLandscape.caption,
      photographer: { name: 'Unknown' },
      isRemote: false
    };

    landscapeImage.src = randomLandscape.path;
  }

  function handleImageLoad() {
    captureImageData();
    redrawCanvas();
  }

  function handleImageError() {
    if (state.currentImageData && state.currentImageData.isRemote) {
      console.error('Failed to load API image, using a local landscape instead.');
      fallbackToLocalImage();
    } else {
      console.error('Failed to load local landscape:', landscapeImage.src);
    }
  }

  /* -------------------- TIMER FUNCTIONS -------------------- */

  function setStudyMinutes(minutes) {
    state.inputValue = Math.max(0, minutes);
    const inputText = state.inputValue > 0 ? String(state.inputValue) : '';
    if (elements.inputBox.value !== inputText) {
      elements.inputBox.value = inputText;
    }
    elements.titleStudyTime.textContent = minutesToDisplay(state.inputValue);
  }

  function updateStudyTime() {
    setStudyMinutes(parseInt(elements.inputBox.value.trim()) || 0);
  }

  function startTimer() {
    if (state.inputValue <= 0 || state.isRunning) return;

    elements.inputBox.blur();
    elements.inputScreen.style.display = 'none';
    elements.clockScreen.style.display = 'flex';
    document.body.classList.add('session-active');
    elements.canvas.style.display = 'block';

    state.isRunning = true;
    state.remainingSeconds = state.inputValue * 60;
    state.lastStage = calculateStage();
    elements.clockStudyTime.textContent = secondsToTime(state.remainingSeconds);
    redrawCanvas();
  }

  function tick() {
    state.remainingSeconds = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));

    const newStage = calculateStage();
    if (newStage !== state.lastStage) {
      state.lastStage = newStage;
      drawPixelated(calculateBlockSize());
    }

    if (state.remainingSeconds <= 0) {
      stopCountdown();
      elements.clockStudyTime.textContent = '';
      elements.timeButton.style.display = 'none';
      elements.pauseButton.style.display = 'none';
      colorBlastReveal();
    } else {
      elements.clockStudyTime.textContent = secondsToTime(state.remainingSeconds);
    }
  }

  // Counts down against a fixed end time so the timer stays accurate in throttled background tabs.
  function startCountdown() {
    stopCountdown();
    state.endTime = Date.now() + state.remainingSeconds * 1000;
    state.countdownInterval = setInterval(tick, 250);
  }

  function stopCountdown() {
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
  }

  /* -------------------- REVEAL ANIMATION -------------------- */

  function colorBlastReveal() {
    state.isRevealing = true;
    elements.clockScreen.classList.add('revealed');

    if (!state.imageData) {
      finishReveal();
      return;
    }

    // Render the finest pixelation once instead of re-averaging every block on every frame.
    const pixelatedFrame = document.createElement('canvas');
    pixelatedFrame.width = elements.canvas.width;
    pixelatedFrame.height = elements.canvas.height;
    drawPixelated(CONFIG.MIN_BLOCK_SIZE, pixelatedFrame.getContext('2d'));

    const startTime = performance.now();

    function animateBlast(now) {
      const { width, height } = elements.canvas;
      const blastProgress = Math.min(1, (now - startTime) / CONFIG.BLAST_DURATION);
      const easedProgress = 1 - Math.pow(1 - blastProgress, 2);
      const wavePosition = easedProgress * (width + CONFIG.TRANSITION_ZONE);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(pixelatedFrame, 0, 0, width, height);

      if (wavePosition > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, wavePosition, height);
        ctx.clip();
        drawLandscape();
        ctx.restore();

        if (wavePosition < width + CONFIG.TRANSITION_ZONE) {
          const gradient = ctx.createLinearGradient(wavePosition - CONFIG.TRANSITION_ZONE, 0, wavePosition, 0);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
          ctx.fillStyle = gradient;
          ctx.fillRect(wavePosition - CONFIG.TRANSITION_ZONE, 0, CONFIG.TRANSITION_ZONE, height);
        }
      }

      if (blastProgress < 1 && state.isRevealing) {
        requestAnimationFrame(animateBlast);
      } else if (state.isRevealing) {
        finishReveal();
      }
    }

    requestAnimationFrame(animateBlast);
  }

  function finishReveal() {
    state.isRevealing = false;
    state.isRevealed = true;
    state.isRunning = false;
    redrawCanvas();
    showRevealOverlays();
  }

  /* -------------------- UI OVERLAYS -------------------- */

  function createOverlay(id) {
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    scheduleOverlay(() => overlay.classList.add('visible'), 100);
    return overlay;
  }

  function showRevealOverlays() {
    const hasCaption = showLocationCaption();
    showPhotoCredit();
    scheduleOverlay(showRestartPrompt, hasCaption ? 4000 : 2000);
  }

  function showLocationCaption() {
    if (!state.currentImageData || !state.currentImageData.caption) return false;

    const caption = createOverlay('locationCaption');
    caption.textContent = `📍 ${state.currentImageData.caption}`;

    scheduleOverlay(() => caption.classList.add('glow'), 1500);
    scheduleOverlay(() => caption.classList.remove('glow'), 2100);
    return true;
  }

  function showPhotoCredit() {
    const image = state.currentImageData;
    if (!image || !image.isRemote || !image.photographer || !image.photographer.name) return;

    const credit = createOverlay('photoCredit');
    credit.append('Photo by ', creditLink(image.photographer.name, image.photographer.profile), ' on ', creditLink('Unsplash', image.unsplashLink));
  }

  function creditLink(text, href) {
    const url = href && withReferral(href);
    if (!url) return text;

    const link = document.createElement('a');
    link.href = url;
    link.textContent = text;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function showRestartPrompt() {
    const prompt = createOverlay('restartPrompt');
    prompt.textContent = 'Press SPACE to restart';
    scheduleOverlay(() => prompt.classList.add('blinking'), 1600);
  }

  function removeOverlays() {
    state.overlayTimeouts.forEach(clearTimeout);
    state.overlayTimeouts = [];

    ['locationCaption', 'photoCredit', 'restartPrompt'].forEach(function(id) {
      const overlay = document.getElementById(id);
      if (overlay) overlay.remove();
    });
  }

  /* -------------------- RESTART -------------------- */

  function restartTimer() {
    removeOverlays();
    stopCountdown();

    elements.clockScreen.style.display = 'none';
    elements.clockScreen.classList.remove('revealed');
    elements.inputScreen.style.display = 'flex';
    elements.canvas.style.display = 'none';
    document.body.classList.remove('session-active');

    elements.timeButton.style.visibility = 'visible';
    elements.timeButton.style.display = 'block';
    elements.pauseButton.style.display = 'block';
    elements.pauseButton.textContent = 'Start';
    elements.pauseButton.style.opacity = '1';

    state.remainingSeconds = 0;
    state.lastStage = -1;
    state.isRunning = false;
    state.isRevealing = false;
    state.isRevealed = false;

    setStudyMinutes(0);
    loadRandomLandscape();
    elements.inputBox.focus();
  }

  /* -------------------- EVENT LISTENERS -------------------- */

  function initializeEventListeners() {
    elements.inputBox.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        updateStudyTime();
        startTimer();
      }
    });

    elements.inputBox.addEventListener('input', updateStudyTime);

    document.addEventListener('keydown', function(e) {
      const isTyping = document.activeElement === elements.inputBox;
      const isOnControl = isTyping || document.activeElement instanceof HTMLButtonElement;

      if (e.key === 'Enter' && !isOnControl && elements.inputScreen.style.display !== 'none') {
        startTimer();
      }

      if ((e.key === ' ' || e.key === 'Spacebar') && state.isRevealed) {
        e.preventDefault();
        restartTimer();
      }

      if ((e.key === 'f' || e.key === 'F') && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(console.error);
        } else {
          document.exitFullscreen();
        }
      }
    });

    elements.plus30.addEventListener('click', function() {
      if (state.isRunning) return;
      setStudyMinutes(state.inputValue + 30);
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
        stopCountdown();
        elements.pauseButton.textContent = 'Resume';
      } else {
        startCountdown();
        elements.pauseButton.textContent = 'Pause';
      }
      elements.pauseButton.blur();
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

    window.addEventListener('resize', function() {
      const oldWidth = elements.canvas.width;
      const oldHeight = elements.canvas.height;
      resizeCanvas();

      if (oldWidth !== elements.canvas.width || oldHeight !== elements.canvas.height) {
        captureImageData();
        if (!state.isRevealing) redrawCanvas();
      }
    });

    landscapeImage.addEventListener('load', handleImageLoad);
    landscapeImage.addEventListener('error', handleImageError);
  }

  /* -------------------- INITIALIZATION -------------------- */

  function init() {
    resizeCanvas();
    initializeEventListeners();
    loadRandomLandscape();
    updateRealTimeClock();
    setInterval(updateRealTimeClock, 1000);
    elements.inputBox.focus();
  }

  window.addEventListener('load', init);

})();
