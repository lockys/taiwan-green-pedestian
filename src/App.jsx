import { startTransition, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModernI18n } from '@modern-js/plugin-i18n/runtime';
import walkingFrameRows from './frame.json';
import './styles.css';

const GRID_SIZE = 16;
const FRAME_DELAY = 250;

const colorPalettes = [
  { id: 'mint', on: '#c1f0e9', off: '#10221d', glow: 'rgba(193, 240, 233, 0.62)' },
  { id: 'signal', on: '#73ffbf', off: '#0b2117', glow: 'rgba(115, 255, 191, 0.64)' },
  { id: 'cyan', on: '#7df8ff', off: '#0b2024', glow: 'rgba(125, 248, 255, 0.58)' },
  { id: 'amber', on: '#ffe28a', off: '#241d0b', glow: 'rgba(255, 226, 138, 0.55)' },
];

function rowsToMatrix(rows) {
  return rows.map(row => row.split('').map(value => (value === '1' ? 1 : 0)));
}

function frameToRows(frame) {
  return frame.map(row => row.join(''));
}

function blankFrame() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function cloneFrame(frame) {
  return frame.map(row => row.slice());
}

function parseMatrixText(value) {
  const rows = value.match(/[01]{16}/g) || [];
  if (rows.length !== GRID_SIZE) {
    console.warn('Matrix editor expected exactly 16 rows of 16 binary digits.');
    return null;
  }
  return rowsToMatrix(rows);
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

function copyText(value) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).catch(() => {});
  }
}

function LedMatrix({ frame, interactive = false, ariaLabel, onToggle, t }) {
  const className = interactive ? 'editor-grid' : 'led-grid';

  return (
    <div className={className} aria-label={ariaLabel} role={interactive ? undefined : 'img'}>
      {frame.flatMap((row, rowIndex) =>
        row.map((value, colIndex) =>
          interactive ? (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              className={`editor-cell${value === 1 ? ' is-on' : ''}`}
              aria-label={t('toggleCellAria', { row: rowIndex + 1, col: colIndex + 1 })}
              onClick={() => onToggle(rowIndex, colIndex)}
            />
          ) : (
            <span key={`${rowIndex}-${colIndex}`} className={`led${value === 1 ? ' is-on' : ''}`} />
          ),
        ),
      )}
    </div>
  );
}

function PreviewGrid({ frame, label, onClick }) {
  return (
    <button type="button" className="preview-grid" aria-label={label} onClick={onClick}>
      {frame.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => (
          <span key={`${rowIndex}-${colIndex}`} className={`preview-led${value === 1 ? ' is-on' : ''}`} />
        )),
      )}
    </button>
  );
}

export default function App() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useModernI18n();
  const [frames, setFrames] = useState(() => walkingFrameRows.map(rowsToMatrix));
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentPalette, setCurrentPalette] = useState(0);
  const [matrixText, setMatrixText] = useState('');

  const routePath = window.location.pathname.replace(/\/$/, '') || '/';
  const route = routePath.endsWith('/editor') ? '/editor' : '/';
  const isEditorRoute = route === '/editor';
  const isHomeRoute = route === '/';
  const basePath = isEditorRoute ? routePath.slice(0, -'/editor'.length) : routePath === '/' ? '' : routePath;
  const homeHref = `${basePath || ''}/`;
  const editorHref = `${basePath || ''}/editor`;

  const selectedPalette = colorPalettes[currentPalette];
  const selectedFrameData = frames[selectedFrame] || blankFrame();
  const visibleFrame = frames[frameIndex] || selectedFrameData;
  const allFramesText = useMemo(
    () => frames.map((frame, index) => `frame ${index + 1}:\n${frameToRows(frame).join('\n')}`).join('\n\n'),
    [frames],
  );

  useEffect(() => {
    validateFrames(frames);
  }, [frames]);

  useEffect(() => {
    setSelectedFrame(prev => Math.min(prev, frames.length - 1));
    setFrameIndex(prev => Math.min(prev, frames.length - 1));
  }, [frames.length]);

  useEffect(() => {
    setMatrixText(frameToRows(selectedFrameData).join('\n'));
  }, [selectedFrameData]);

  useEffect(() => {
    if (!isHomeRoute || !isAnimating || frames.length === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, FRAME_DELAY);

    return () => window.clearTimeout(timer);
  }, [frameIndex, frames.length, isAnimating, isHomeRoute]);

  const appStyle = {
    '--led-on': selectedPalette.on,
    '--led-off': selectedPalette.off,
    '--led-glow': selectedPalette.glow,
  };

  function updateFrames(updater) {
    startTransition(() => {
      setFrames(prev => updater(prev.map(cloneFrame)));
    });
  }

  function toggleEditorCell(row, col) {
    updateFrames(nextFrames => {
      const frame = nextFrames[selectedFrame];
      frame[row][col] = frame[row][col] === 1 ? 0 : 1;
      return nextFrames;
    });
  }

  function applyMatrixText() {
    const nextFrame = parseMatrixText(matrixText);
    if (!nextFrame || !validateFrame(nextFrame, 'editor')) {
      return;
    }

    updateFrames(nextFrames => {
      nextFrames[selectedFrame] = nextFrame;
      return nextFrames;
    });
  }

  function clearFrame() {
    updateFrames(nextFrames => {
      nextFrames[selectedFrame] = blankFrame();
      return nextFrames;
    });
  }

  function shiftSelectedFrame(rowDirection, colDirection) {
    updateFrames(nextFrames => {
      nextFrames[selectedFrame] = shiftFrame(nextFrames[selectedFrame], rowDirection, colDirection);
      return nextFrames;
    });
  }

  function addBlankFrame() {
    updateFrames(nextFrames => {
      nextFrames.splice(selectedFrame + 1, 0, blankFrame());
      return nextFrames;
    });
    setSelectedFrame(prev => prev + 1);
  }

  function duplicateFrame() {
    updateFrames(nextFrames => {
      nextFrames.splice(selectedFrame + 1, 0, cloneFrame(nextFrames[selectedFrame]));
      return nextFrames;
    });
    setSelectedFrame(prev => prev + 1);
  }

  function deleteFrame() {
    if (frames.length <= 1) {
      console.warn('At least one walking frame is required.');
      return;
    }

    updateFrames(nextFrames => {
      nextFrames.splice(selectedFrame, 1);
      return nextFrames;
    });
    setSelectedFrame(prev => Math.min(prev, frames.length - 2));
  }

  function moveFrame(fromIndex, direction) {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= frames.length) {
      return;
    }

    updateFrames(nextFrames => {
      const [frame] = nextFrames.splice(fromIndex, 1);
      nextFrames.splice(toIndex, 0, frame);
      return nextFrames;
    });
    setSelectedFrame(toIndex);
    setFrameIndex(prev => Math.min(prev, frames.length - 1));
  }

  return (
    <div className="app" style={appStyle}>
      <header className="app-header">
        <div>
          <h1 className="app-title">{isEditorRoute ? t('editorTitle') : t('playerTitle')}</h1>
        </div>
        <div className="header-actions">
          <nav className="top-menu" aria-label="Primary">
            <a className={`menu-link${isHomeRoute ? ' is-active' : ''}`} href={homeHref}>
              {t('navPlayer')}
            </a>
            <a className={`menu-link${isEditorRoute ? ' is-active' : ''}`} href={editorHref}>
              {t('navEditor')}
            </a>
          </nav>
        </div>
      </header>

      <div className={`workspace ${isEditorRoute ? 'workspace-editor' : 'workspace-player'}`}>
        {isEditorRoute ? (
          <section className="panel editor-panel" aria-label={t('editorAria')}>
            <div className="editor-header">
              <h2 className="editor-title">{t('editorHeading')}</h2>
              <div className="frame-tools">
                <label htmlFor="frame-select">{t('frameLabel')}</label>
                <select
                  id="frame-select"
                  className="frame-select"
                  value={selectedFrame}
                  onChange={event => setSelectedFrame(Number(event.target.value))}
                >
                  {frames.map((_, index) => (
                    <option key={index} value={index}>
                      {t('frameName', { number: index + 1 })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="editor-body">
              <div className="editor-section editor-matrix-section">
                <h3 className="section-title">{t('ledMatrixTitle')}</h3>
                <LedMatrix
                  frame={selectedFrameData}
                  interactive
                  ariaLabel={t('clickableMatrixAria')}
                  onToggle={toggleEditorCell}
                  t={t}
                />
              </div>

              <div className="editor-section editor-text-section">
                <h3 className="section-title">{t('matrixTextTitle')}</h3>
                <textarea
                  className="matrix-text"
                  spellCheck="false"
                  aria-label={t('matrixRowsAria')}
                  value={matrixText}
                  onChange={event => setMatrixText(event.target.value)}
                />
                <div className="editor-actions">
                  <button type="button" className="apply-matrix-button" onClick={applyMatrixText}>
                    {t('applyText')}
                  </button>
                  <button type="button" className="copy-matrix-button" onClick={() => copyText(matrixText)}>
                    {t('copyText')}
                  </button>
                  <button type="button" className="clear-frame-button" onClick={clearFrame}>
                    {t('clear')}
                  </button>
                  <button type="button" className="shift-left-button" onClick={() => shiftSelectedFrame(0, -1)}>
                    {t('shiftLeft')}
                  </button>
                  <button type="button" className="shift-right-button" onClick={() => shiftSelectedFrame(0, 1)}>
                    {t('shiftRight')}
                  </button>
                  <button type="button" className="shift-up-button" onClick={() => shiftSelectedFrame(-1, 0)}>
                    {t('shiftUp')}
                  </button>
                  <button type="button" className="shift-down-button" onClick={() => shiftSelectedFrame(1, 0)}>
                    {t('shiftDown')}
                  </button>
                  <button type="button" className="add-frame-button" onClick={addBlankFrame}>
                    {t('addBlank')}
                  </button>
                  <button type="button" className="duplicate-frame-button" onClick={duplicateFrame}>
                    {t('duplicateFrame')}
                  </button>
                  <button type="button" className="delete-frame-button" onClick={deleteFrame}>
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>

            <div className="all-frames">
              <div className="all-frames-header">
                <h2 className="all-frames-title">{t('allFrames')}</h2>
                <button type="button" className="copy-all-frames-button" onClick={() => copyText(allFramesText)}>
                  {t('copyAll')}
                </button>
              </div>
              <div className="frame-list" aria-label={t('allFramesAria')}>
                {frames.map((frame, index) => (
                  <article key={index} className={`frame-card${index === selectedFrame ? ' is-selected' : ''}`}>
                    <div className="frame-card-header">
                      <span>{t('frameName', { number: index + 1 })}</span>
                      <span>{index === selectedFrame ? t('selected') : ''}</span>
                    </div>
                    <PreviewGrid
                      frame={frame}
                      label={t('selectFrameAria', { number: index + 1 })}
                      onClick={() => setSelectedFrame(index)}
                    />
                    <div className="frame-card-actions">
                      <button type="button" disabled={index === 0} onClick={() => moveFrame(index, -1)}>
                        {t('moveUp')}
                      </button>
                      <button type="button" disabled={index === frames.length - 1} onClick={() => moveFrame(index, 1)}>
                        {t('moveDown')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <textarea className="all-frames-text" readOnly spellCheck="false" aria-label={t('allFramesTextAria')} value={allFramesText} />
            </div>
          </section>
        ) : (
          <section className="panel player-panel" aria-label="LED animation player">
            <div className="matrix-panel">
              <LedMatrix frame={visibleFrame} ariaLabel={t('ledAria')} t={t} />
            </div>
            <div className="player-controls">
              <button type="button" className="play-toggle-button" aria-pressed={isAnimating} onClick={() => setIsAnimating(prev => !prev)}>
                {isAnimating ? t('stop') : t('play')}
              </button>
            </div>
            <div className="palette-panel" aria-label="LED color palette">
              <h2 className="section-title">{t('paletteTitle')}</h2>
              <div className="palette-list">
                {colorPalettes.map((palette, index) => (
                  <button
                    key={palette.id}
                    type="button"
                    className={`palette-button${index === currentPalette ? ' is-active' : ''}`}
                    onClick={() => setCurrentPalette(index)}
                  >
                    <span className="palette-swatch" style={{ '--swatch-color': palette.on }} />
                    {t(`palette.${palette.id}`)}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {isHomeRoute ? (
        <section className="panel about-panel" aria-label="About animated pedestrian signal">
          <h2 className="section-title">{t('aboutTitle')}</h2>
          <p>{t('aboutText')}</p>
          <a href="https://zh.wikipedia.org/zh-tw/%E5%8B%95%E7%95%AB%E5%BC%8F%E8%A1%8C%E4%BA%BA%E5%B0%88%E7%94%A8%E8%99%9F%E8%AA%8C" target="_blank" rel="noreferrer">
            {t('aboutLink')}
          </a>
        </section>
      ) : null}

      <footer className="app-footer">
        <div className="footer-controls">
          <label className="language-select-label" htmlFor="language-select">
            {t('languageLabel')}
          </label>
          <select
            id="language-select"
            className="language-select"
            aria-label={t('languageLabel')}
            value={language}
            onChange={event => {
              void changeLanguage(event.target.value);
            }}
          >
            <option value="zh">繁中</option>
            <option value="en">EN</option>
          </select>
        </div>
        <a
          className="github-link"
          href="https://github.com/lockys/taiwan-green-pedestian"
          target="_blank"
          rel="noreferrer"
        >
          {t('github')}
        </a>
      </footer>
    </div>
  );
}
