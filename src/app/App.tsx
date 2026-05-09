import { useEffect, useRef } from 'react';
import { SimulationRenderer } from '../modules/renderer';
import { MAZE_5x5_SIMPLE } from '../shared/constants';
import { DEFAULT_ROBOT } from '../shared/constants';
import { cellToWorld } from '../shared/utils/maze';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

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
      
      <aside className="code-panel p-4">
        <h2 className="text-white text-lg font-bold">Code Editor</h2>
      </aside>
    </div>
  );
}

export default App;