import { useEffect, useRef, useState } from 'react';
import { SimulationRenderer } from '../modules/renderer';
import { cellToWorld } from '../shared/utils/maze';
import { playSound } from '../shared/utils/celebration-sound';
import { BlocklyEditor, MonacoEditor, useCodeEditorStore, updateSensorDropdowns, updateWheelDropdowns } from '../modules/code-editor';
import { useSimulationStore } from '../modules/simulation';
import { ConsolePanel, StatusBar, SensorPanel, ReplayPlayer, useTelemetryStore } from '../modules/telemetry';
import { RobotConfig, RobotPreview, useRobotConfigStore } from '../modules/robot-config';
import { MazeEditor, useMazeStore } from '../modules/maze';
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
  const prevStatusRef = useRef(simStatus);
  const mazeGrid = useMazeStore((s) => s.mazeGrid);

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
        { showSensorRays: false, showPathTrail: false, showCellNumbers: false }
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
        { showSensorRays, showPathTrail: false, showCellNumbers: false }
      );
    }
  }, [renderState, showSensorRays, robotSpec]);

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
      { showSensorRays, showPathTrail: false, showCellNumbers: false }
    );
  }, [robotSpec, simState, showSensorRays, mazeGrid]);

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
      { showSensorRays, showPathTrail: false, showCellNumbers: false }
    );
  }, [mazeGrid, robotSpec, showSensorRays]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (simStatus === 'finished' && prev !== 'finished') {
      if (finishReason === 'goal') {
        playSound('/finished.mp3');
        rendererRef.current?.celebrate();
      } else {
        playSound('/no.mp3');
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
      </nav>

      <div className="app-content">
        <div className={`tab-panel ${appTab === 'simulation' ? 'active' : ''}`}>
          <div className="simulation-layout">
            <aside className="code-panel">
              <div className="flex border-b border-gray-700">
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'blockly'
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                  }`}
                  id="tab-blockly"
                  onClick={() => setActiveTab('blockly')}
                >
                  Blockly
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                    activeTab === 'monaco'
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                      : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                  }`}
                  id="tab-monaco"
                  onClick={() => setActiveTab('monaco')}
                >
                  Python
                </button>
                <div className="flex items-center gap-1 px-2 border-l border-gray-700">
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
            <SensorPanel />
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
                    Show sensor rays
                  </label>
                </div>
              </div>
              <div ref={containerRef} className="pixi-container" />
            </main>
            <ReplayPlayer />
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
    </div>
  );
}

export default App;
