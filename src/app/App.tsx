import { useEffect, useRef, useState } from 'react';
import { SimulationRenderer } from '../modules/renderer';
import { cellToWorld } from '../shared/utils/maze';
import { playSound } from '../shared/utils/celebration-sound';
import { BlocklyEditor, MonacoEditor, CodeToolbar, useCodeEditorStore, updateSensorDropdowns, updateWheelDropdowns } from '../modules/code-editor';
import { useSimulationStore } from '../modules/simulation';
import { ConsolePanel, StatusBar, SensorPanel, MotorPanel, ReplayPlayer, useTelemetryStore } from '../modules/telemetry';
import { RobotConfig, RobotPreview, useRobotConfigStore } from '../modules/robot-config';
import { MazeEditor, useMazeStore } from '../modules/maze';
import { useMediaQuery } from '../shared/utils/media-query';
import { useHintSystem } from '../shared/utils/use-hint-system';
import { ShareDialog } from '../shared/components/ShareDialog';
import { TutorialOverlay } from '../shared/components/TutorialOverlay';
import { restoreFromHash } from '../shared/utils/share-url';
import { useThemeStore } from '../shared/utils/theme-store';
import { patchBlocklyTheme } from '../modules/code-editor/blockly-theme';
import './App.css';

type AppTab = 'config' | 'maze' | 'simulation';

function App() {
  const [appTab, setAppTab] = useState<AppTab>('simulation');
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SimulationRenderer | null>(null);
  const activeTab = useCodeEditorStore((s) => s.activeTab);
  const setActiveTab = useCodeEditorStore((s) => s.setActiveTab);
  const simStatus = useSimulationStore((s) => s.status);
  const finishReason = useSimulationStore((s) => s.finishReason);
  const simStart = useSimulationStore((s) => s.start);
  const simStop = useSimulationStore((s) => s.stop);
  const simReset = useSimulationStore((s) => s.reset);
  const simState = useSimulationStore((s) => s.currentState);
  const replayState = useTelemetryStore((s) => s.replayState);
  const simSendMessage = useSimulationStore((s) => s.sendMessage);
  const robotSpec = useRobotConfigStore((s) => s.spec);
  const sensors = useRobotConfigStore((s) => s.spec.sensors);
  const wheels = useRobotConfigStore((s) => s.spec.wheels);
  const [showSensorRays, setShowSensorRays] = useState(false);
  const [showCellNumbers, setShowCellNumbers] = useState(false);
  const [simView, setSimView] = useState<'code' | 'sensor' | 'replay'>('code');
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const prevStatusRef = useRef(simStatus);
  const mazeGrid = useMazeStore((s) => s.mazeGrid);
  const mazeUndo = useMazeStore((s) => s.undo);
  const mazeRedo = useMazeStore((s) => s.redo);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('micromouse-tutorial-done') !== 'true';
  });
  const [toast, setToast] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    patchBlocklyTheme(theme);
  }, [theme]);

  useHintSystem(simState, simStatus, (msg) => {
    setHint(msg);
    setTimeout(() => setHint(null), 8000);
  });

  useEffect(() => {
    if (restoreFromHash()) {
      queueMicrotask(() => setToast('Đã load configuration từ URL'));
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  useEffect(() => {
    updateSensorDropdowns(sensors.map(s => s.id));
  }, [sensors]);

  useEffect(() => {
    updateWheelDropdowns(wheels.map(w => w.id));
  }, [wheels]);

  useEffect(() => {
    const pressed: Record<string, boolean> = {};
    const updateKeyboard = () => {
      simSendMessage({
        type: 'KEYBOARD',
        payload: {
          up: !!pressed['ArrowUp'],
          down: !!pressed['ArrowDown'],
          left: !!pressed['ArrowLeft'],
          right: !!pressed['ArrowRight'],
        },
      });
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        pressed[e.key] = true;
        updateKeyboard();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        pressed[e.key] = false;
        updateKeyboard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [simSendMessage]);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new SimulationRenderer();
    rendererRef.current = renderer;
    const grid = useMazeStore.getState().mazeGrid;
    const startPos = cellToWorld(grid, grid.start.row, grid.start.col);

    renderer.init(containerRef.current).then(() => {
      renderer.loadMaze(grid);
      renderer.updateFrame(
        {
          tick: 0,
          robot: { x: startPos.x, y: startPos.y, angle: 0, vx: 0, vy: 0, av: 0 },
          sensors: {},
          motorRPMs: [0, 0],
          isFinished: false,
          elapsedMs: 0,
          status: 'idle',
        },
        robotSpec,
        { showSensorRays, showPathTrail: false, showCellNumbers }
      );
    });

    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      rendererRef.current = null;
      renderer.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderState = replayState ?? simState;

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (renderState) {
      renderer.updateFrame(
        renderState,
        robotSpec,
        { showSensorRays, showPathTrail: false, showCellNumbers }
      );
    }
  }, [renderState, showSensorRays, showCellNumbers, robotSpec]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || simState) return;
    const startPos = cellToWorld(mazeGrid, mazeGrid.start.row, mazeGrid.start.col);
    renderer.updateFrame(
      {
        tick: 0,
        robot: { x: startPos.x, y: startPos.y, angle: 0, vx: 0, vy: 0, av: 0 },
        sensors: {},
        motorRPMs: [0, 0],
        isFinished: false,
        elapsedMs: 0,
        status: 'idle',
      },
      robotSpec,
      { showSensorRays, showPathTrail: false, showCellNumbers }
    );
  }, [robotSpec, simState, showSensorRays, showCellNumbers, mazeGrid]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.loadMaze(mazeGrid);
    const startPos = cellToWorld(mazeGrid, mazeGrid.start.row, mazeGrid.start.col);
    renderer.updateFrame(
      {
        tick: 0,
        robot: { x: startPos.x, y: startPos.y, angle: 0, vx: 0, vy: 0, av: 0 },
        sensors: {},
        motorRPMs: [0, 0],
        isFinished: false,
        elapsedMs: 0,
        status: 'idle',
      },
      robotSpec,
      { showSensorRays, showPathTrail: false, showCellNumbers }
    );
  }, [mazeGrid, robotSpec, showSensorRays, showCellNumbers]);

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (target.closest('.monaco-editor') || target.closest('.blocklySvg')) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (simStatus === 'running') simStop();
        else simStart();
        return;
      }

      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (simStatus !== 'idle') simReset();
        return;
      }

      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (simStatus === 'running') simStop();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (!e.shiftKey) { e.preventDefault(); mazeUndo(); }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault(); mazeRedo();
        return;
      }

      if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [simStatus, simStart, simStop, simReset, mazeUndo, mazeRedo]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (simStatus === 'finished' && prev !== 'finished') {
      if (finishReason === 'goal') {
        playSound('/finished.mp3');
        rendererRef.current?.celebrate();
      }
    }
    if (simStatus === 'error' && prev !== 'error') {
      playSound('/no.mp3');
    }
    prevStatusRef.current = simStatus;
  }, [simStatus, finishReason]);

  return (
    <div className="app-container">
      <nav className="app-tabs">
        <button
          className={`app-tab ${appTab === 'config' ? 'active' : ''}`}
          onClick={() => setAppTab('config')}
        >
          🔧 Robot Config
        </button>
        <button
          className={`app-tab ${appTab === 'maze' ? 'active' : ''}`}
          onClick={() => setAppTab('maze')}
        >
          🧩 Maze Editor
        </button>
        <button
          className={`app-tab ${appTab === 'simulation' ? 'active' : ''}`}
          onClick={() => setAppTab('simulation')}
        >
          ▶ Simulation
        </button>
        <div className="app-tabs-spacer" />
        <button
          className="share-tab-btn"
          onClick={() => setShowShareDialog(true)}
          title="Share configuration"
        >
          🔗 Share
        </button>
        <button
          className="share-tab-btn"
          onClick={() => setShowTutorial(true)}
          title="Help / Tutorial"
        >
          ❓
        </button>
        <button
          className="share-tab-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      <div className="app-content">
        <div className={`tab-panel ${appTab === 'simulation' ? 'active' : ''}`}>
          {isMobile && (
            <nav className="mobile-tabs">
              <button className={`mobile-tab ${simView === 'code' ? 'active' : ''}`} onClick={() => setSimView('code')}>Code</button>
              <button className={`mobile-tab ${simView === 'sensor' ? 'active' : ''}`} onClick={() => setSimView('sensor')}>Sensors</button>
              <button className={`mobile-tab ${simView === 'replay' ? 'active' : ''}`} onClick={() => setSimView('replay')}>Replay</button>
            </nav>
          )}
          <div className="simulation-layout">
            {(!isMobile || simView === 'code') && (
              <aside className="code-panel">
                <div className="code-tab-bar">
                  <button
                    className={`code-tab${activeTab === 'blockly' ? ' active' : ''}`}
                    id="tab-blockly"
                    onClick={() => setActiveTab('blockly')}
                  >
                    Blockly
                  </button>
                  <button
                    className={`code-tab${activeTab === 'monaco' ? ' active' : ''}`}
                    id="tab-monaco"
                    onClick={() => setActiveTab('monaco')}
                  >
                    MicroPython
                  </button>
                  <div className="code-tab-actions">
                    <CodeToolbar />
                    {simStatus === 'running' ? (
                      <button onClick={simStop} className="run-btn run-btn-stop">⏹</button>
                    ) : simStatus === 'finished' || simStatus === 'error' ? (
                      <button onClick={simReset} className="run-btn run-btn-reset">↺</button>
                    ) : (
                      <button onClick={simStart} className="run-btn run-btn-start">▶</button>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0" style={{ display: activeTab === 'blockly' ? 'flex' : 'none', flexDirection: 'column' }}>
                    <BlocklyEditor />
                  </div>
                  <div className="flex-1 min-h-0" style={{ display: activeTab === 'monaco' ? 'flex' : 'none' }}>
                    <MonacoEditor />
                  </div>
                </div>
                <div className="h-32 flex-shrink-0">
                  <ConsolePanel />
                </div>
              </aside>
            )}
            {(!isMobile || simView === 'sensor') && (
              <div className="sensor-column">
                <SensorPanel />
                <MotorPanel />
              </div>
            )}
            <main className="canvas-panel">
              <div className="canvas-toolbar">
                <StatusBar />
                <div className="canvas-toolbar-right">
                    <label className="sensor-toggle">
                      <input
                        type="checkbox"
                        checked={showSensorRays}
                        onChange={(e) => setShowSensorRays(e.target.checked)}
                      />
                      Rays
                    </label>
                    <label className="sensor-toggle">
                      <input
                        type="checkbox"
                        checked={showCellNumbers}
                        onChange={(e) => setShowCellNumbers(e.target.checked)}
                      />
                      Flood-fill
                    </label>
                </div>
              </div>
              <div ref={containerRef} className="pixi-container" />
            </main>
            {(!isMobile || simView === 'replay') && <ReplayPlayer />}
          </div>
        </div>
        <div className={`tab-panel ${appTab === 'maze' ? 'active' : ''}`}>
          <MazeEditor />
        </div>
        <div className={`tab-panel ${appTab === 'config' ? 'active' : ''}`}>
          <div className="config-layout">
            <RobotConfig />
            <RobotPreview />
          </div>
        </div>
      </div>

      {showShareDialog && <ShareDialog onClose={() => setShowShareDialog(false)} />}
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      {toast && <div className="toast">{toast}</div>}
      {hint && <div className="toast toast-hint">{hint}</div>}
    </div>
  );
}

export default App;
