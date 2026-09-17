const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score-display');
const waveDisplay = document.getElementById('wave-display');
const hiDisplay = document.getElementById('hi-display');
const livesDisplay = document.getElementById('lives-display');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnFire = document.getElementById('btn-fire');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

const state = {
  running: false,
  score: 0,
  lives: 3,
  wave: 1,
  highScore: Number(localStorage.getItem('galaxian-high-score') || 0),
  keys: { left: false, right: false },
  alienDirection: 1,
  waveElapsedFrames: 0,
  diveCooldown: 0,
  audioContext: null,
  formationPattern: null,
};

const player = {
  x: GAME_WIDTH / 2 - 20,
  y: GAME_HEIGHT - 40,
  width: 40,
  height: 18,
  speed: 4,
  cooldown: 0,
  invincible: 0,
};

const bullets = [];
const enemyBullets = [];
const aliens = [];
const stars = Array.from({ length: 70 }, () => ({
  x: Math.random() * GAME_WIDTH,
  y: Math.random() * GAME_HEIGHT,
  size: Math.random() < 0.8 ? 1 : 2,
  speed: 0.15 + Math.random() * 0.6,
  alpha: 0.25 + Math.random() * 0.65,
}));

function setupAudio() {
  if (!state.audioContext) {
    state.audioContext = new AudioContext();
  }
  state.audioContext.resume();
}

function playTone(frequency, duration, type = 'square', volume = 0.04) {
  if (!state.audioContext) return;

  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  const now = state.audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(state.audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function updateHUD() {
  scoreDisplay.textContent = 'SCORE: ' + String(state.score).padStart(4, '0');
  waveDisplay.textContent = 'WAVE: ' + state.wave;
  hiDisplay.textContent = 'HI: ' + String(state.highScore).padStart(4, '0');
  livesDisplay.textContent = '♥ ' + state.lives;
}

function setOverlayMessage(title, subtitle, text) {
  const titleEl = overlay.querySelector('h1');
  const subtitleEl = overlay.querySelector('h2');
  const textEl = overlay.querySelector('p');

  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;
  textEl.textContent = text;
}

function resetPlayer() {
  player.x = GAME_WIDTH / 2 - player.width / 2;
  player.y = GAME_HEIGHT - 40;
  player.cooldown = 0;
  player.invincible = 0;
}

function createAlienFormation() {
  aliens.length = 0;
  state.waveElapsedFrames = 0;

  const rows = 5;
  const cols = 8;
  const patterns = ['grid', 'hexagon', 'diamond', 'zigzag'];
  const availablePatterns = patterns.filter((pattern) => pattern !== state.formationPattern);
  state.formationPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const type = row === 0 ? 0 : row < 3 ? 1 : 2;
      let x = 50 + col * 42;
      let y = 60 + row * 32;

      if (state.formationPattern === 'hexagon') {
        x = 38 + col * 42 + (row % 2) * 21;
        y = 55 + row * 31;
      } else if (state.formationPattern === 'diamond') {
        x = 58 + col * 40;
        y = 55 + row * 28 + Math.abs(col - 3.5) * 3;
      } else if (state.formationPattern === 'zigzag') {
        x = 42 + col * 42;
        y = 50 + row * 29 + (col % 2) * 18;
      }

      aliens.push({
        x,
        y,
        width: 24,
        height: 18,
        alive: true,
        type,
        diving: false,
      });
    }
  }
}

function startGame() {
  state.running = true;
  state.score = 0;
  state.lives = 3;
  state.wave = 1;
  state.alienDirection = 1;
  state.diveCooldown = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  setupAudio();
  playTone(520, 0.12, 'square', 0.05);
  resetPlayer();
  createAlienFormation();
  overlay.classList.add('hidden');
  updateHUD();
}

function endGame() {
  state.running = false;
  state.highScore = Math.max(state.highScore, state.score);
  localStorage.setItem('galaxian-high-score', String(state.highScore));
  updateHUD();
  setOverlayMessage('GAME OVER', 'SCORE: ' + String(state.score).padStart(4, '0'), 'Tekan START untuk bermain lagi.');
  overlay.classList.remove('hidden');
  startBtn.textContent = 'PLAY AGAIN';
}

function firePlayerBullet() {
  if (!state.running || player.cooldown > 0) {
    return;
  }

  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y - 10,
    width: 4,
    height: 10,
    speed: -8,
  });

  player.cooldown = 30;
  playTone(440, 0.06, 'square', 0.035);
}

function fireEnemyBullet(alien) {
  enemyBullets.push({
    x: alien.x + alien.width / 2 - 2,
    y: alien.y + alien.height,
    width: 4,
    height: 10,
    speed: 2.5 + (state.wave - 1) * 0.25,
  });
  playTone(120, 0.08, 'sawtooth', 0.018);
}

function addScore(points) {
  state.score += points;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('galaxian-high-score', String(state.highScore));
  }
  updateHUD();
}

function handlePlayerHit() {
  if (player.invincible > 0) return;

  state.lives -= 1;
  player.invincible = 100;
  playTone(85, 0.22, 'sawtooth', 0.06);
  updateHUD();

  if (state.lives <= 0) {
    endGame();
  }
}

function movePlayer() {
  if (state.keys.left) {
    player.x -= player.speed;
  }

  if (state.keys.right) {
    player.x += player.speed;
  }

  player.x = Math.max(0, Math.min(GAME_WIDTH - player.width, player.x));

  if (player.cooldown > 0) {
    player.cooldown -= 1;
  }

  if (player.invincible > 0) {
    player.invincible -= 1;
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.y += bullet.speed;

    if (bullet.y < -20 || bullet.y > GAME_HEIGHT + 20) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = enemyBullets[i];
    bullet.y += bullet.speed;

    if (bullet.y > GAME_HEIGHT + 20) {
      enemyBullets.splice(i, 1);
    }
  }
}

function updateAliens() {
  if (!aliens.some((alien) => alien.alive)) {
    state.wave += 1;
    createAlienFormation();
    state.alienDirection = 1;
    return;
  }

  let leftMost = Infinity;
  let rightMost = -Infinity;

  for (const alien of aliens) {
    if (!alien.alive || alien.diving) continue;
    leftMost = Math.min(leftMost, alien.x);
    rightMost = Math.max(rightMost, alien.x + alien.width);
  }

  const movementSpeed = 0.45 + state.wave * 0.1;

  if (leftMost <= 10 && state.alienDirection < 0) {
    state.alienDirection = 1;
    for (const alien of aliens) {
      if (alien.alive) alien.y += 16;
    }
  } else if (rightMost >= GAME_WIDTH - 10 && state.alienDirection > 0) {
    state.alienDirection = -1;
    for (const alien of aliens) {
      if (alien.alive) alien.y += 16;
    }
  }

  for (const alien of aliens) {
    if (alien.alive && !alien.diving) {
      alien.x += state.alienDirection * movementSpeed;
    }
  }

  const aliveAliens = aliens.filter((alien) => alien.alive);
  const diveStartFrames = Math.max(180, 600 - (state.wave - 1) * 120);
  if (state.waveElapsedFrames >= diveStartFrames && state.diveCooldown <= 0) {
    const candidates = aliveAliens.filter((alien) => !alien.diving);
    if (candidates.length > 0) {
      const diver = candidates[Math.floor(Math.random() * candidates.length)];
      diver.diving = true;
      state.diveCooldown = Math.max(50, 120 - state.wave * 8);
      playTone(220, 0.12, 'triangle', 0.035);
    }
  }

  if (state.diveCooldown > 0) {
    state.diveCooldown -= 1;
  }

  for (const alien of aliens) {
    if (!alien.alive || !alien.diving) continue;
    const targetX = player.x + player.width / 2 - alien.width / 2;
    alien.x += Math.max(-3, Math.min(3, targetX - alien.x));
    alien.y += 2 + state.wave * 0.2;
    if (alien.y > GAME_HEIGHT + 20) {
      alien.y = -alien.height - Math.random() * 80;
      alien.x = Math.random() * (GAME_WIDTH - alien.width);
      alien.diving = true;
    }
  }

  if (aliveAliens.length > 0 && Math.random() < 0.02 + state.wave * 0.003) {
    const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
    fireEnemyBullet(shooter);
  }

  if (aliveAliens.some((alien) => !alien.diving && alien.y + alien.height >= player.y)) {
    handlePlayerHit();
    if (!state.running) return;
    resetPlayer();
    createAlienFormation();
    state.alienDirection = 1;
  }
}

function checkCollisions() {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];

    for (const alien of aliens) {
      if (!alien.alive) continue;

      const hit =
        bullet.x < alien.x + alien.width &&
        bullet.x + bullet.width > alien.x &&
        bullet.y < alien.y + alien.height &&
        bullet.y + bullet.height > alien.y;

      if (hit) {
        alien.alive = false;
        alien.diving = false;
        bullets.splice(i, 1);
        addScore(10);
        playTone(180, 0.08, 'square', 0.045);
        break;
      }
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = enemyBullets[i];
    const hitPlayer =
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y;

    if (hitPlayer) {
      enemyBullets.splice(i, 1);
      handlePlayerHit();
      if (!state.running) return;
    }
  }

  for (const alien of aliens) {
    if (!alien.alive || !alien.diving) continue;
    const hitPlayer =
      alien.x < player.x + player.width &&
      alien.x + alien.width > player.x &&
      alien.y < player.y + player.height &&
      alien.y + alien.height > player.y;

    if (hitPlayer) {
      alien.diving = true;
      alien.y = -alien.height - Math.random() * 80;
      alien.x = Math.random() * (GAME_WIDTH - alien.width);
      handlePlayerHit();
      if (!state.running) return;
    }
  }
}

function drawBackground() {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  for (const star of stars) {
    star.y += star.speed;
    if (star.y > GAME_HEIGHT) {
      star.y = -star.size;
      star.x = Math.random() * GAME_WIDTH;
    }
    ctx.fillStyle = 'rgba(255,255,255,' + star.alpha + ')';
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible / 8) % 2 === 0) {
    return;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(player.x + 14, player.y, 12, 10);
  ctx.fillRect(player.x, player.y + 10, player.width, 8);

  ctx.fillStyle = '#00ffff';
  ctx.fillRect(player.x - 4, player.y + 12, 7, 4);
  ctx.fillRect(player.x + player.width - 3, player.y + 12, 7, 4);
}

function drawBullets() {
  for (const bullet of bullets) {
    ctx.fillStyle = '#ffffee';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }

  for (const bullet of enemyBullets) {
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function drawAliens() {
  const colors = ['#ff0055', '#00ffff', '#00ff00'];

  for (const alien of aliens) {
    if (!alien.alive) continue;
    ctx.fillStyle = colors[alien.type];
    if (alien.diving) {
      ctx.shadowColor = colors[alien.type];
      ctx.shadowBlur = 12;
    }
    ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000000';
    ctx.fillRect(alien.x + 5, alien.y + 5, 4, 4);
    ctx.fillRect(alien.x + alien.width - 9, alien.y + 5, 4, 4);
  }
}

function render() {
  drawBackground();
  drawAliens();
  drawBullets();
  drawPlayer();
}

function updateGame() {
  if (!state.running) return;

  state.waveElapsedFrames += 1;
  movePlayer();
  updateBullets();
  updateAliens();
  checkCollisions();
}

function gameLoop() {
  updateGame();
  render();
  requestAnimationFrame(gameLoop);
}

function setKeyState(key, pressed) {
  if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    state.keys.left = pressed;
  }

  if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    state.keys.right = pressed;
  }

  if (pressed && (key === ' ' || key === 'ArrowUp')) {
    firePlayerBullet();
  }
}

startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp', 'a', 'A', 'd', 'D'].includes(event.key)) {
    event.preventDefault();
  }
  setKeyState(event.key, true);
});

document.addEventListener('keyup', (event) => {
  setKeyState(event.key, false);
});

btnLeft.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  state.keys.left = true;
});

btnLeft.addEventListener('pointerup', () => {
  state.keys.left = false;
});

btnLeft.addEventListener('pointerleave', () => {
  state.keys.left = false;
});

btnRight.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  state.keys.right = true;
});

btnRight.addEventListener('pointerup', () => {
  state.keys.right = false;
});

btnRight.addEventListener('pointerleave', () => {
  state.keys.right = false;
});

btnFire.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  firePlayerBullet();
});

updateHUD();
setOverlayMessage('GALAXIAN', 'CLASSIC ARCADE', 'Tembak alien sebelum mereka mencapai Anda!');
createAlienFormation();
requestAnimationFrame(gameLoop);
