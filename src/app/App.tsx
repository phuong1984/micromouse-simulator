import { useEffect, useRef } from 'react';
import { SimulationRenderer } from '../modules/renderer';
import { MAZE_5x5_SIMPLE } from '../shared/constants';
import { DEFAULT_ROBOT } from '../shared/constants';
import { cellToWorld } from '../shared/utils/maze';
import { BlocklyEditor, MonacoEditor, useCodeEditorStore } from '../modules/code-editor';
import { useSimulationStore } from '../modules/simulation';
import { ConsolePanel } from '../modules/telemetry';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTab = useCodeEditorStore((s) => s.activeTab);
  const setActiveTab = useCodeEditorStore((s) => s.setActiveTab);
  const simStatus = useSimulationStore((s) => s.status);
  const simStart = useSimulationStore((s) => s.start);
  const simStop = useSimulationStore((s) => s.stop);
  const simReset = useSimulationStore((s) => s.reset);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new SimulationRenderer();
    const grid = MAZE_5x5_SIMPLE;
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
        DEFAULT_ROBOT,
        { showSensorRays: false, showPathTrail: false, showCellNumbers: false }
      );
    });

    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      renderer.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="app-container">
      <aside className="config-panel p-4">
        <h2 className="text-white text-lg font-bold">Robot Config</h2>
      </aside>
      
      <main className="canvas-panel">
        <div ref={containerRef} className="pixi-container" />
      </main>
      
      <aside className="code-panel flex flex-col p-0">
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
    </div>
  );
}

export default App;