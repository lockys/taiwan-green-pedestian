import './styles.css';
import walkingFrameRows from './frame.json';

const GRID_SIZE = 16;
const FRAME_DELAY = 250;

let walkingFrames = walkingFrameRows.map(rowsToMatrix);
let frameIndex = 0;
let selectedFrame = 0;
let animationTimer = null;
let animationRunning = false;
let currentPalette = 0;

const colorPalettes = [
  { name: { en: 'Mint', zh: '薄荷綠' }, on: '#c1f0e9', off: '#10221d', glow: 'rgba(193, 240, 233, 0.62)' },
  { name: { en: 'Signal green', zh: '號誌綠' }, on: '#73ffbf', off: '#0b2117', glow: 'rgba(115, 255, 191, 0.64)' },
  { name: { en: 'Cyan green', zh: '青藍綠' }, on: '#7df8ff', off: '#0b2024', glow: 'rgba(125, 248, 255, 0.58)' },
  { name: { en: 'Amber', zh: '琥珀' }, on: '#ffe28a', off: '#241d0b', glow: 'rgba(255, 226, 138, 0.55)' },
];

const translations = {
  en: {
    playerTitle: 'Green Pedestrian LED Animation',
    editorTitle: 'Green Pedestrian LED Frame Editor',
    meta: '16x16 / {count} frames',
    navPlayer: 'Player',
    navEditor: 'Editor',
    languageLabel: 'Language',
    play: 'Play',
    restart: 'Restart',
    stop: 'Stop',
    paletteTitle: 'LED Color',
    ledAria: 'Animated green pedestrian LED matrix',
    editorHeading: 'Frame Matrix',
    frameLabel: 'Frame',
    ledMatrixTitle: 'LED Matrix',
    matrixTextTitle: 'Matrix Text',
    applyText: 'Apply Text',
    copyText: 'Copy Text',
    clear: 'Clear',
    shiftLeft: 'Left -1',
    shiftRight: 'Right +1',
    shiftUp: 'Up -1',
    shiftDown: 'Down +1',
    addBlank: 'Add Blank',
    duplicateFrame: 'Duplicate Frame',
    delete: 'Delete',
    allFrames: 'All Frames',
    copyAll: 'Copy All',
    frameName: 'Frame {number}',
    selected: 'selected',
    moveUp: 'Up',
    moveDown: 'Down',
    selectFrameAria: 'Select frame {number}',
    toggleCellAria: 'Toggle row {row}, column {col}',
    aboutTitle: 'About Xiaoluren',
    aboutText:
      'Xiaoluren is the walking figure used on many pedestrian signals in Taiwan. The figure is shown as a short sequence of LED frames, so this page keeps the same simple 16x16 dot-matrix style.',
    aboutLink: 'Reference: Animated pedestrian traffic signal',
  },
  zh: {
    playerTitle: '小綠人 LED 動畫',
    editorTitle: '小綠人 LED 影格編輯器',
    meta: '16x16 / {count} 個影格',
    navPlayer: '播放',
    navEditor: '編輯器',
    languageLabel: '語言',
    play: '播放',
    restart: '重新播放',
    stop: '停止',
    paletteTitle: 'LED 顏色',
    ledAria: '動畫式小綠人 LED 點陣',
    editorHeading: '影格矩陣',
    frameLabel: '影格',
    ledMatrixTitle: 'LED 點陣',
    matrixTextTitle: '矩陣文字',
    applyText: '套用文字',
    copyText: '複製文字',
    clear: '清空',
    shiftLeft: '左移 -1',
    shiftRight: '右移 +1',
    shiftUp: '上移 -1',
    shiftDown: '下移 +1',
    addBlank: '新增空白',
    duplicateFrame: '複製影格',
    delete: '刪除',
    allFrames: '全部影格',
    copyAll: '全部複製',
    frameName: '影格 {number}',
    selected: '已選取',
    moveUp: '上移',
    moveDown: '下移',
    selectFrameAria: '選取影格 {number}',
    toggleCellAria: '切換第 {row} 列第 {col} 欄',
    aboutTitle: '關於小綠人',
    aboutText:
      '小綠人是台灣路口常見的行人號誌。畫面由幾個 LED 影格連續切換，看起來像人在往前走；這裡用 16x16 點陣重做成簡化版本。',
    aboutLink: '參考：動畫式行人專用號誌',
  },
};

const savedLanguage = window.localStorage.getItem('greenPedestrianLanguage');
const currentLanguage = savedLanguage === 'en' ? 'en' : 'zh';
const copy = translations[currentLanguage];

function t(key, values = {}) {
  return Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), copy[key]);
}

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
      <div class="led-grid" role="img" aria-label="${t('ledAria')}"></div>
    </div>
    <div class="player-controls">
      <button class="play-toggle-button" type="button">${t('stop')}</button>
    </div>
    <div class="palette-panel" aria-label="LED color palette">
      <h2 class="section-title">${t('paletteTitle')}</h2>
      <div class="palette-list">
        ${colorPalettes
          .map(
            (palette, index) => `
              <button class="palette-button${index === currentPalette ? ' is-active' : ''}" type="button" data-palette="${index}">
                <span class="palette-swatch" style="--swatch-color: ${palette.on}"></span>
                ${palette.name[currentLanguage]}
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
      <h2 class="editor-title">${t('editorHeading')}</h2>
      <div class="frame-tools">
        <label for="frame-select">${t('frameLabel')}</label>
        <select id="frame-select" class="frame-select"></select>
      </div>
    </div>
    <div class="editor-body">
      <div class="editor-section editor-matrix-section">
        <h3 class="section-title">${t('ledMatrixTitle')}</h3>
        <div class="editor-grid" aria-label="Clickable frame matrix"></div>
      </div>
      <div class="editor-section editor-text-section">
        <h3 class="section-title">${t('matrixTextTitle')}</h3>
        <textarea class="matrix-text" spellcheck="false" aria-label="Raw 16 by 16 matrix rows"></textarea>
        <div class="editor-actions">
          <button class="apply-matrix-button" type="button">${t('applyText')}</button>
          <button class="copy-matrix-button" type="button">${t('copyText')}</button>
          <button class="clear-frame-button" type="button">${t('clear')}</button>
          <button class="shift-left-button" type="button">${t('shiftLeft')}</button>
          <button class="shift-right-button" type="button">${t('shiftRight')}</button>
          <button class="shift-up-button" type="button">${t('shiftUp')}</button>
          <button class="shift-down-button" type="button">${t('shiftDown')}</button>
          <button class="add-frame-button" type="button">${t('addBlank')}</button>
          <button class="duplicate-frame-button" type="button">${t('duplicateFrame')}</button>
          <button class="delete-frame-button" type="button">${t('delete')}</button>
        </div>
      </div>
    </div>
    <div class="all-frames">
      <div class="all-frames-header">
        <h2 class="all-frames-title">${t('allFrames')}</h2>
        <button class="copy-all-frames-button" type="button">${t('copyAll')}</button>
      </div>
      <div class="frame-list" aria-label="All walking frames"></div>
      <textarea class="all-frames-text" readonly spellcheck="false" aria-label="All frame matrices"></textarea>
    </div>
  </section>
`;

const aboutMarkup = `
  <section class="panel about-panel" aria-label="About animated pedestrian signal">
    <h2 class="section-title">${t('aboutTitle')}</h2>
    <p>
      ${t('aboutText')}
    </p>
    <a href="https://zh.wikipedia.org/zh-tw/%E5%8B%95%E7%95%AB%E5%BC%8F%E8%A1%8C%E4%BA%BA%E5%B0%88%E7%94%A8%E8%99%9F%E8%AA%8C" target="_blank" rel="noreferrer">${t('aboutLink')}</a>
  </section>
`;

app.innerHTML = `
  <div class="app">
    <header class="app-header">
      <div>
        <h1 class="app-title">${isEditorRoute ? t('editorTitle') : t('playerTitle')}</h1>
        <div class="app-meta">${t('meta', { count: walkingFrames.length })}</div>
      </div>
      <div class="header-actions">
        <nav class="top-menu" aria-label="Primary">
          <a class="menu-link${isHomeRoute ? ' is-active' : ''}" href="${homeHref}">${t('navPlayer')}</a>
          <a class="menu-link${isEditorRoute ? ' is-active' : ''}" href="${editorHref}">${t('navEditor')}</a>
        </nav>
        <div class="language-switch" aria-label="${t('languageLabel')}">
          <button class="language-button${currentLanguage === 'zh' ? ' is-active' : ''}" type="button" data-language="zh">繁中</button>
          <button class="language-button${currentLanguage === 'en' ? ' is-active' : ''}" type="button" data-language="en">EN</button>
        </div>
      </div>
    </header>
    <div class="workspace ${isEditorRoute ? 'workspace-editor' : 'workspace-player'}">
      ${isEditorRoute ? editorMarkup : playerMarkup}
    </div>
    ${isHomeRoute ? aboutMarkup : ''}
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
      cell.setAttribute('aria-label', t('toggleCellAria', { row: row + 1, col: col + 1 }));
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

function togglePlayback() {
  if (animationRunning) {
    stopAnimation();
    return;
  }
  startAnimation();
}

function rebuildFrameOptions() {
  if (!frameSelect) {
    appMeta.textContent = t('meta', { count: walkingFrames.length });
    return;
  }
  frameSelect.textContent = '';
  walkingFrames.forEach((_, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = t('frameName', { number: index + 1 });
    frameSelect.append(option);
  });
  selectedFrame = Math.min(selectedFrame, walkingFrames.length - 1);
  frameSelect.value = String(selectedFrame);
  appMeta.textContent = t('meta', { count: walkingFrames.length });
}

function updatePlaybackButtons() {
  const playToggleButton = document.querySelector('.play-toggle-button');
  if (playToggleButton) {
    playToggleButton.textContent = animationRunning ? t('stop') : t('play');
    playToggleButton.setAttribute('aria-pressed', String(animationRunning));
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

function shiftFrame(frame, rowDirection, colDirection) {
  const nextFrame = blankFrame();
  frame.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const nextRow = rowIndex + rowDirection;
      const nextCol = colIndex + colDirection;
      if (value === 1 && nextRow >= 0 && nextRow < GRID_SIZE && nextCol >= 0 && nextCol < GRID_SIZE) {
        nextFrame[nextRow][nextCol] = 1;
      }
    });
  });
  return nextFrame;
}

function shiftSelectedFrame(rowDirection, colDirection) {
  walkingFrames[selectedFrame] = shiftFrame(walkingFrames[selectedFrame], rowDirection, colDirection);
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
    header.innerHTML = `<span>${t('frameName', { number: index + 1 })}</span><span>${index === selectedFrame ? t('selected') : ''}</span>`;

    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'preview-grid';
    preview.setAttribute('aria-label', t('selectFrameAria', { number: index + 1 }));
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
    upButton.textContent = t('moveUp');
    upButton.disabled = index === 0;
    upButton.addEventListener('click', () => moveFrame(index, -1));
    const downButton = document.createElement('button');
    downButton.type = 'button';
    downButton.textContent = t('moveDown');
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

document.querySelector('.play-toggle-button')?.addEventListener('click', togglePlayback);
document.querySelectorAll('.palette-button').forEach((button) => {
  button.addEventListener('click', () => applyPalette(Number(button.dataset.palette)));
});
document.querySelectorAll('.language-button').forEach((button) => {
  button.addEventListener('click', () => {
    window.localStorage.setItem('greenPedestrianLanguage', button.dataset.language);
    window.location.reload();
  });
});
document.querySelector('.apply-matrix-button')?.addEventListener('click', applyMatrixText);
document.querySelector('.copy-matrix-button')?.addEventListener('click', () => copyTextFrom(matrixText));
document.querySelector('.copy-all-frames-button')?.addEventListener('click', () => copyTextFrom(allFramesText));
document.querySelector('.clear-frame-button')?.addEventListener('click', clearFrame);
document.querySelector('.shift-left-button')?.addEventListener('click', () => shiftSelectedFrame(0, -1));
document.querySelector('.shift-right-button')?.addEventListener('click', () => shiftSelectedFrame(0, 1));
document.querySelector('.shift-up-button')?.addEventListener('click', () => shiftSelectedFrame(-1, 0));
document.querySelector('.shift-down-button')?.addEventListener('click', () => shiftSelectedFrame(1, 0));
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
