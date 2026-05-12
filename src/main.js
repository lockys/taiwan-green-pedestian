import './styles.css';

const GRID_SIZE = 16;
const FRAME_DELAY = 250;

const walkingFrameRows = [
  [
    '0000011000000000',
    '0000111100000000',
    '0000011000000000',
    '0000001100000000',
    '0000001111100000',
    '0000001111110000',
    '0000001110001000',
    '0000010111000000',
    '0000000011000000',
    '0000000111100000',
    '0000000110111000',
    '0000001100001100',
    '0000001000000100',
    '0000111000000100',
    '0000000000000000',
    '0000000000000000',
  ],
  [
    '0000001100000000',
    '0000011110000000',
    '0000001100000000',
    '0000000110000000',
    '0000000111100000',
    '0000000111110000',
    '0000000111001000',
    '0000001011101000',
    '0000000011100000',
    '0000000011100000',
    '0000000110110000',
    '0000000100011000',
    '0000000010001000',
    '0000001110011000',
    '0000000000000000',
    '0000000000000000',
  ],
  [
    '0000011000000000',
    '0000111100000000',
    '0000011000000000',
    '0000001100000000',
    '0000001111000000',
    '0000001111100000',
    '0000000110100000',
    '0000000111100000',
    '0000001011000000',
    '0000000111000000',
    '0000001101100000',
    '0000011000110000',
    '0000001100011000',
    '0000000100001000',
    '0000011100000000',
    '0000000000000000',
  ],
  [
    '0000001100000000',
    '0000011110000000',
    '0000001100000000',
    '0000000110000000',
    '0000000111000000',
    '0000000111100000',
    '0000000011110000',
    '0000000011010000',
    '0000000101100000',
    '0000000011100000',
    '0000000111110000',
    '0000000110011000',
    '0000000011001000',
    '0000000001011000',
    '0000000111010000',
    '0000000000000000',
  ],
  [
    '0000011000000000',
    '0000111100000000',
    '0000011000000000',
    '0000001100000000',
    '0000001110000000',
    '0000001110000000',
    '0000000111000000',
    '0000000111000000',
    '0000000011000000',
    '0000000111000000',
    '0000000111100000',
    '0000000011100000',
    '0000000011100000',
    '0000000000100000',
    '0000000011100000',
    '0000000000000000',
  ],
  [
    '0000001100000000',
    '0000011110000000',
    '0000001100000000',
    '0000000110000000',
    '0000000111100000',
    '0000000111110000',
    '0000001011010000',
    '0000000011110000',
    '0000000001100000',
    '0000000011100000',
    '0000000111100000',
    '0000000100110000',
    '0000000010011000',
    '0000011100000100',
    '0000000000011100',
    '0000000000000000',
  ],
  [
    '0000011000000000',
    '0000111100000000',
    '0000011000000000',
    '0000001100000000',
    '0000001111100000',
    '0000001111110000',
    '0000011110010000',
    '0000110111000000',
    '0000000011000000',
    '0000000111100000',
    '0000001100110000',
    '0000001100011000',
    '0000111000001100',
    '0000000000000100',
    '0000000000000000',
    '0000000000000000',
  ],
];

let walkingFrames = walkingFrameRows.map(rowsToMatrix);
let frameIndex = 0;
let selectedFrame = 0;
let animationTimer = null;
let animationRunning = false;
let currentPalette = 0;

const colorPalettes = [
  { name: '薄荷綠', on: '#c1f0e9', off: '#10221d', glow: 'rgba(193, 240, 233, 0.62)' },
  { name: '號誌綠', on: '#73ffbf', off: '#0b2117', glow: 'rgba(115, 255, 191, 0.64)' },
  { name: '青藍綠', on: '#7df8ff', off: '#0b2024', glow: 'rgba(125, 248, 255, 0.58)' },
  { name: '琥珀', on: '#ffe28a', off: '#241d0b', glow: 'rgba(255, 226, 138, 0.55)' },
];

const app = document.querySelector('#app');
const routePath = window.location.pathname.replace(/\/$/, '') || '/';
const route = routePath.endsWith('/editor') ? '/editor' : '/';
const isEditorRoute = route === '/editor';
const isHomeRoute = route === '/';
const basePath = isEditorRoute ? routePath.slice(0, -'/editor'.length) : routePath === '/' ? '' : routePath;
const homeHref = `${basePath || ''}/`;
const editorHref = `${basePath || ''}/editor`;

const playerMarkup = `
  <section class="panel player-panel" aria-label="LED animation player">
    <div class="matrix-panel">
      <div class="led-grid" role="img" aria-label="動畫式小綠人 LED 點陣"></div>
    </div>
    <div class="player-controls">
      <button class="restart-button" type="button">重新播放</button>
      <button class="stop-button" type="button">停止</button>
    </div>
    <div class="palette-panel" aria-label="LED color palette">
      <h2 class="section-title">LED 色票</h2>
      <div class="palette-list">
        ${colorPalettes
          .map(
            (palette, index) => `
              <button class="palette-button${index === currentPalette ? ' is-active' : ''}" type="button" data-palette="${index}">
                <span class="palette-swatch" style="--swatch-color: ${palette.on}"></span>
                ${palette.name}
              </button>
            `,
          )
          .join('')}
      </div>
    </div>
  </section>
`;

const editorMarkup = `
  <section class="panel editor-panel" aria-label="16 by 16 matrix editor">
    <div class="editor-header">
      <h2 class="editor-title">影格矩陣</h2>
      <div class="frame-tools">
        <label for="frame-select">影格</label>
        <select id="frame-select" class="frame-select"></select>
      </div>
    </div>
    <div class="editor-body">
      <div class="editor-section editor-matrix-section">
        <h3 class="section-title">LED 點陣</h3>
        <div class="editor-grid" aria-label="Clickable frame matrix"></div>
      </div>
      <div class="editor-section editor-text-section">
        <h3 class="section-title">矩陣文字</h3>
        <textarea class="matrix-text" spellcheck="false" aria-label="Raw 16 by 16 matrix rows"></textarea>
        <div class="editor-actions">
          <button class="apply-matrix-button" type="button">套用文字</button>
          <button class="copy-matrix-button" type="button">複製文字</button>
          <button class="clear-frame-button" type="button">清空</button>
          <button class="shift-left-button" type="button">左移 -1</button>
          <button class="shift-right-button" type="button">右移 +1</button>
          <button class="add-frame-button" type="button">新增空白</button>
          <button class="duplicate-frame-button" type="button">複製影格</button>
          <button class="delete-frame-button" type="button">刪除</button>
        </div>
      </div>
    </div>
    <div class="all-frames">
      <div class="all-frames-header">
        <h2 class="all-frames-title">全部影格</h2>
        <button class="copy-all-frames-button" type="button">全部複製</button>
      </div>
      <div class="frame-list" aria-label="All walking frames"></div>
      <textarea class="all-frames-text" readonly spellcheck="false" aria-label="All frame matrices"></textarea>
    </div>
  </section>
`;

const aboutMarkup = `
  <section class="panel about-panel" aria-label="About animated pedestrian signal">
    <h2 class="section-title">關於小綠人</h2>
    <p>
      小綠人是台灣常見的動畫式行人專用號誌，以連續影格呈現行人行走，
      讓等待穿越馬路的人能直接判斷目前是通行狀態。本專案以 16x16 LED 點陣重建這種低解析度、逐格切換的視覺節奏。
    </p>
    <a href="https://zh.wikipedia.org/zh-tw/%E5%8B%95%E7%95%AB%E5%BC%8F%E8%A1%8C%E4%BA%BA%E5%B0%88%E7%94%A8%E8%99%9F%E8%AA%8C" target="_blank" rel="noreferrer">參考：動畫式行人專用號誌</a>
  </section>
`;

app.innerHTML = `
  <div class="app">
    <header class="app-header">
      <div>
        <h1 class="app-title">${isEditorRoute ? '小綠人 LED 影格編輯器' : '小綠人 LED 動畫'}</h1>
        <div class="app-meta">16x16 / ${walkingFrames.length} 個影格</div>
      </div>
      <nav class="top-menu" aria-label="Primary">
        <a class="menu-link${isHomeRoute ? ' is-active' : ''}" href="${homeHref}">播放</a>
        <a class="menu-link${isEditorRoute ? ' is-active' : ''}" href="${editorHref}">編輯器</a>
      </nav>
    </header>
    <div class="workspace ${isEditorRoute ? 'workspace-editor' : 'workspace-player'}">
      ${isEditorRoute ? editorMarkup : playerMarkup}
    </div>
    ${aboutMarkup}
  </div>
`;

const ledGrid = document.querySelector('.led-grid');
const editorGrid = document.querySelector('.editor-grid');
const frameSelect = document.querySelector('.frame-select');
const matrixText = document.querySelector('.matrix-text');
const frameList = document.querySelector('.frame-list');
const allFramesText = document.querySelector('.all-frames-text');
const appMeta = document.querySelector('.app-meta');
const ledCells = [];
const editorCells = [];

function rowsToMatrix(rows) {
  return rows.map((row) => row.split('').map((value) => (value === '1' ? 1 : 0)));
}

function frameToRows(frame) {
  return frame.map((row) => row.join(''));
}

function createLedGrid() {
  if (!ledGrid) {
    return;
  }
  ledGrid.textContent = '';
  ledCells.length = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = document.createElement('span');
      cell.className = 'led';
      ledGrid.append(cell);
      ledCells.push(cell);
    }
  }
}

function createEditorGrid() {
  if (!editorGrid) {
    return;
  }
  editorGrid.textContent = '';
  editorCells.length = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'editor-cell';
      cell.setAttribute('aria-label', `Toggle row ${row + 1}, column ${col + 1}`);
      cell.addEventListener('click', () => toggleEditorCell(row, col));
      editorGrid.append(cell);
      editorCells.push(cell);
    }
  }
}

function setLed(row, col, value) {
  const cell = ledCells[row * GRID_SIZE + col];
  if (cell) {
    cell.classList.toggle('is-on', value === 1);
  }
}

function renderFrame(frame) {
  if (!validateFrame(frame, 'render')) {
    return;
  }
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      setLed(row, col, frame[row][col]);
    }
  }
}

function renderEditorFrame(frame) {
  if (!editorGrid) {
    return;
  }
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = editorCells[row * GRID_SIZE + col];
      cell.classList.toggle('is-on', frame[row][col] === 1);
    }
  }
}

function startAnimation() {
  if (!ledGrid || !validateFrames(walkingFrames) || animationRunning) {
    return;
  }
  animationRunning = true;
  updatePlaybackButtons();

  function tick() {
    if (!animationRunning) {
      return;
    }
    if (frameIndex >= walkingFrames.length) {
      frameIndex = 0;
    }
    renderFrame(walkingFrames[frameIndex]);
    frameIndex = (frameIndex + 1) % walkingFrames.length;
    animationTimer = window.setTimeout(tick, FRAME_DELAY);
  }

  tick();
}

function stopAnimation() {
  animationRunning = false;
  if (animationTimer !== null) {
    window.clearTimeout(animationTimer);
    animationTimer = null;
  }
  updatePlaybackButtons();
}

function restartPlayback() {
  stopAnimation();
  frameIndex = 0;
  startAnimation();
}

function rebuildFrameOptions() {
  if (!frameSelect) {
    appMeta.textContent = `16x16 / ${walkingFrames.length} 個影格`;
    return;
  }
  frameSelect.textContent = '';
  walkingFrames.forEach((_, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `影格 ${index + 1}`;
    frameSelect.append(option);
  });
  selectedFrame = Math.min(selectedFrame, walkingFrames.length - 1);
  frameSelect.value = String(selectedFrame);
  appMeta.textContent = `16x16 / ${walkingFrames.length} 個影格`;
}

function updatePlaybackButtons() {
  const stopButton = document.querySelector('.stop-button');
  const restartButton = document.querySelector('.restart-button');
  if (stopButton) {
    stopButton.disabled = !animationRunning;
  }
  if (restartButton) {
    restartButton.textContent = animationRunning ? '重新播放' : '播放';
  }
}

function applyPalette(index) {
  const palette = colorPalettes[index];
  if (!palette) {
    return;
  }
  currentPalette = index;
  document.documentElement.style.setProperty('--led-on', palette.on);
  document.documentElement.style.setProperty('--led-glow', palette.glow);
  document.documentElement.style.setProperty('--led-off', palette.off);
  document.querySelectorAll('.palette-button').forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.palette) === index);
  });
}

function syncEditorFromFrame() {
  if (!editorGrid || !matrixText) {
    return;
  }
  const frame = walkingFrames[selectedFrame];
  renderEditorFrame(frame);
  matrixText.value = frameToRows(frame).join('\n');
  renderAllFrames();
}

function toggleEditorCell(row, col) {
  const frame = walkingFrames[selectedFrame];
  frame[row][col] = frame[row][col] === 1 ? 0 : 1;
  syncEditorFromFrame();
}

function parseMatrixText(value) {
  const rows = value.match(/[01]{16}/g) || [];
  if (rows.length !== GRID_SIZE) {
    console.warn('Matrix editor expected exactly 16 rows of 16 binary digits.');
    return null;
  }
  return rowsToMatrix(rows);
}

function applyMatrixText() {
  if (!matrixText) {
    return;
  }
  const nextFrame = parseMatrixText(matrixText.value);
  if (!nextFrame || !validateFrame(nextFrame, 'editor')) {
    return;
  }
  walkingFrames[selectedFrame] = nextFrame;
  syncEditorFromFrame();
}

function copyTextFrom(element) {
  if (!element) {
    return;
  }
  element.focus();
  element.select();
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(element.value).catch(() => {});
  }
}

function blankFrame() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function cloneFrame(frame) {
  return frame.map((row) => row.slice());
}

function clearFrame() {
  walkingFrames[selectedFrame] = blankFrame();
  syncEditorFromFrame();
}

function shiftFrame(frame, direction) {
  return frame.map((row) => {
    const nextRow = Array(GRID_SIZE).fill(0);
    row.forEach((value, col) => {
      const nextCol = col + direction;
      if (value === 1 && nextCol >= 0 && nextCol < GRID_SIZE) {
        nextRow[nextCol] = 1;
      }
    });
    return nextRow;
  });
}

function shiftSelectedFrame(direction) {
  walkingFrames[selectedFrame] = shiftFrame(walkingFrames[selectedFrame], direction);
  syncEditorFromFrame();
}

function addBlankFrame() {
  walkingFrames.splice(selectedFrame + 1, 0, blankFrame());
  selectedFrame += 1;
  rebuildFrameOptions();
  syncEditorFromFrame();
}

function duplicateFrame() {
  walkingFrames.splice(selectedFrame + 1, 0, cloneFrame(walkingFrames[selectedFrame]));
  selectedFrame += 1;
  rebuildFrameOptions();
  syncEditorFromFrame();
}

function deleteFrame() {
  if (walkingFrames.length <= 1) {
    console.warn('At least one walking frame is required.');
    return;
  }
  walkingFrames.splice(selectedFrame, 1);
  selectedFrame = Math.min(selectedFrame, walkingFrames.length - 1);
  rebuildFrameOptions();
  syncEditorFromFrame();
}

function moveFrame(fromIndex, direction) {
  const toIndex = fromIndex + direction;
  if (toIndex < 0 || toIndex >= walkingFrames.length) {
    return;
  }
  const [frame] = walkingFrames.splice(fromIndex, 1);
  walkingFrames.splice(toIndex, 0, frame);
  selectedFrame = toIndex;
  frameIndex = Math.min(frameIndex, walkingFrames.length - 1);
  rebuildFrameOptions();
  syncEditorFromFrame();
}

function selectFrame(index) {
  if (!frameSelect) {
    return;
  }
  selectedFrame = index;
  frameSelect.value = String(index);
  syncEditorFromFrame();
}

function renderAllFrames() {
  if (!frameList || !allFramesText) {
    return;
  }
  frameList.textContent = '';
  walkingFrames.forEach((frame, index) => {
    const card = document.createElement('article');
    card.className = `frame-card${index === selectedFrame ? ' is-selected' : ''}`;

    const header = document.createElement('div');
    header.className = 'frame-card-header';
    header.innerHTML = `<span>影格 ${index + 1}</span><span>${index === selectedFrame ? '已選取' : ''}</span>`;

    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'preview-grid';
    preview.setAttribute('aria-label', `Select frame ${index + 1}`);
    preview.addEventListener('click', () => selectFrame(index));
    frame.flat().forEach((value) => {
      const pixel = document.createElement('span');
      pixel.className = `preview-led${value === 1 ? ' is-on' : ''}`;
      preview.append(pixel);
    });

    const actions = document.createElement('div');
    actions.className = 'frame-card-actions';
    const upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.textContent = '上移';
    upButton.disabled = index === 0;
    upButton.addEventListener('click', () => moveFrame(index, -1));
    const downButton = document.createElement('button');
    downButton.type = 'button';
    downButton.textContent = '下移';
    downButton.disabled = index === walkingFrames.length - 1;
    downButton.addEventListener('click', () => moveFrame(index, 1));
    actions.append(upButton, downButton);

    card.append(header, preview, actions);
    frameList.append(card);
  });

  allFramesText.value = walkingFrames
    .map((frame, index) => `frame ${index + 1}:\n${frameToRows(frame).join('\n')}`)
    .join('\n\n');
}

function validateFrame(frame, frameIndexForMessage) {
  if (!Array.isArray(frame) || frame.length !== GRID_SIZE) {
    console.warn(`Frame ${frameIndexForMessage} must have exactly ${GRID_SIZE} rows.`);
    return false;
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    if (!Array.isArray(frame[row]) || frame[row].length !== GRID_SIZE) {
      console.warn(`Frame ${frameIndexForMessage}, row ${row + 1} must have exactly ${GRID_SIZE} columns.`);
      return false;
    }

    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (frame[row][col] !== 0 && frame[row][col] !== 1) {
        console.warn(`Frame ${frameIndexForMessage}, row ${row + 1}, column ${col + 1} must be 0 or 1.`);
        return false;
      }
    }
  }

  return true;
}

function validateFrames(frames) {
  if (!Array.isArray(frames) || frames.length === 0) {
    console.warn('walkingFrames must contain at least one frame.');
    return false;
  }
  return frames.every((frame, index) => validateFrame(frame, index + 1));
}

document.querySelector('.restart-button')?.addEventListener('click', restartPlayback);
document.querySelector('.stop-button')?.addEventListener('click', stopAnimation);
document.querySelectorAll('.palette-button').forEach((button) => {
  button.addEventListener('click', () => applyPalette(Number(button.dataset.palette)));
});
document.querySelector('.apply-matrix-button')?.addEventListener('click', applyMatrixText);
document.querySelector('.copy-matrix-button')?.addEventListener('click', () => copyTextFrom(matrixText));
document.querySelector('.copy-all-frames-button')?.addEventListener('click', () => copyTextFrom(allFramesText));
document.querySelector('.clear-frame-button')?.addEventListener('click', clearFrame);
document.querySelector('.shift-left-button')?.addEventListener('click', () => shiftSelectedFrame(-1));
document.querySelector('.shift-right-button')?.addEventListener('click', () => shiftSelectedFrame(1));
document.querySelector('.add-frame-button')?.addEventListener('click', addBlankFrame);
document.querySelector('.duplicate-frame-button')?.addEventListener('click', duplicateFrame);
document.querySelector('.delete-frame-button')?.addEventListener('click', deleteFrame);
frameSelect?.addEventListener('change', () => {
  selectedFrame = Number(frameSelect.value);
  syncEditorFromFrame();
});

createLedGrid();
createEditorGrid();
rebuildFrameOptions();
syncEditorFromFrame();
startAnimation();
