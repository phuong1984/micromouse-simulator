import { useEffect, useRef } from 'react';
import { MazeRenderer } from './MazeRenderer';
import { MazeConfigPanel } from './MazeConfigPanel';
import { useMazeStore } from './store';

export function MazeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MazeRenderer | null>(null);
  const mazeGrid = useMazeStore((s) => s.mazeGrid);
  const mazeGridRef = useRef(mazeGrid);
  const toggleWall = useMazeStore((s) => s.toggleWall);
  const setStart = useMazeStore((s) => s.setStart);
  const setGoal = useMazeStore((s) => s.setGoal);
  const editMode = useMazeStore((s) => s.editMode);
  const undo = useMazeStore((s) => s.undo);
  const redo = useMazeStore((s) => s.redo);

  useEffect(() => {
    mazeGridRef.current = mazeGrid;
  }, [mazeGrid]);

  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new MazeRenderer({ toggleWall, setStart, setGoal });
    renderer.init(containerRef.current).then(() => {
      rendererRef.current = renderer;
      renderer.loadMaze(mazeGridRef.current);
    });

    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      rendererRef.current = null;
      renderer.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.loadMaze(mazeGrid);
    }
  }, [mazeGrid]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setEditMode(editMode);
    }
  }, [editMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="config-layout">
      <div className="config-left-panel">
        <MazeConfigPanel />
      </div>
      <div className="config-right-panel">
        <div ref={containerRef} className="pixi-container" />
      </div>
    </div>
  );
}
