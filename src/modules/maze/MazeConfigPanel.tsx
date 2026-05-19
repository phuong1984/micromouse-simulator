import { useState, useCallback, useRef } from 'react';
import { useMazeStore } from './store';
import { generateMaze } from './generate';
import { NumberField } from '../../shared/components/NumberField';
import { downloadJson, readFileAsText } from '../../shared/utils/export-import';

const H: Record<string, string> = {
  rows: 'Number of rows in the maze grid. More rows create a larger, more complex maze with longer solving paths.',
  cols: 'Number of columns in the maze grid. Together with Rows, defines the overall maze dimensions and difficulty.',
};

export function MazeConfigPanel({ disabled }: { disabled?: boolean }) {
  const mazeGrid = useMazeStore((s) => s.mazeGrid);
  const savedPresets = useMazeStore((s) => s.savedPresets);
  const editMode = useMazeStore((s) => s.editMode);
  const setRows = useMazeStore((s) => s.setRows);
  const setCols = useMazeStore((s) => s.setCols);
  const setEditMode = useMazeStore((s) => s.setEditMode);
  const setGoalType = useMazeStore((s) => s.setGoalType);
  const undo = useMazeStore((s) => s.undo);
  const redo = useMazeStore((s) => s.redo);
  const loadPreset = useMazeStore((s) => s.loadPreset);
  const savePreset = useMazeStore((s) => s.savePreset);
  const deletePreset = useMazeStore((s) => s.deletePreset);
  const genMaze = useMazeStore((s) => s.generateMaze);
  const exportMaze = useMazeStore((s) => s.exportMaze);
  const importMaze = useMazeStore((s) => s.importMaze);
  const resetToDefault = useMazeStore((s) => s.resetToDefault);
  const storeReachable = useMazeStore((s) => s.reachable);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const reachInfo = storeReachable();

  const canBeCenter = (mazeGrid.rows % 2 === 0) && (mazeGrid.cols % 2 === 0) && (mazeGrid.rows >= 16) && (mazeGrid.cols >= 16);

  const handlePresetSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    if (!id) return;
    if (id.startsWith('gen-')) {
      const parts = id.split('-');
      const rows = parseInt(parts[1]);
      const cols = parseInt(parts[2]);
      const diff = parts[3] as 'easy' | 'medium' | 'hard';
      // Standardize: generateMaze will now use internal logic for start/goal based on dimensions
      loadPreset(generateMaze(rows, cols, diff, 0, mazeGrid));
    } else if (id === 'default') {
      resetToDefault();
    } else {
      const preset = savedPresets.find((p) => p.id === id);
      if (preset) loadPreset(preset.maze);
    }
    setSelectedPresetId('');
  }, [savedPresets, loadPreset, resetToDefault]);

  const handleExport = useCallback(() => {
    downloadJson(exportMaze(), `maze-${Date.now()}.json`);
  }, [exportMaze]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const ok = importMaze(text);
      if (!ok) alert('Invalid maze JSON file');
    } catch {
      alert('Invalid JSON file');
    }
    e.target.value = '';
  }, [importMaze]);

  return (
    <div className="config-panel-scroll">
      <div className="config-section">
        <NumberField label="Rows" help={H.rows} value={mazeGrid.rows} onChange={setRows} min={3} max={20} disabled={disabled} integer inputClassName="config-input config-input-sm" />
        <NumberField label="Cols" help={H.cols} value={mazeGrid.cols} onChange={setCols} min={3} max={20} disabled={disabled} integer inputClassName="config-input config-input-sm" />
      </div>

      <div className="config-section">
        <label className="config-label-row">
          <span className="config-label">Start</span>
          <span className="text-xs text-gray-400">
            row {mazeGrid.start.row} col {mazeGrid.start.col}
          </span>
        </label>
        <div className="flex justify-between items-center mt-1">
          <label className="config-label">Goal</label>
          <span className="text-xs text-gray-400">
            {mazeGrid.goalType === 'center2x2' 
              ? `Center 2×2` 
              : `row ${mazeGrid.goal.row} col ${mazeGrid.goal.col}`}
          </span>
        </div>
        <div className="flex gap-1 mt-1">
          <button
            className={`config-mode-btn flex-1 ${mazeGrid.goalType !== 'center2x2' ? 'active' : ''}`}
            onClick={() => setGoalType('manual')}
            disabled={disabled}
          >
            Manual
          </button>
          <button
            className={`config-mode-btn flex-1 ${mazeGrid.goalType === 'center2x2' ? 'active' : ''}`}
            onClick={() => setGoalType('center2x2')}
            disabled={disabled || !canBeCenter}
            title={!canBeCenter ? 'Requires even dimensions ≥ 16x16' : ''}
          >
            Center 2×2
          </button>
        </div>
      </div>

      <div className="config-section">
        <label className="text-xs text-gray-400 block mb-1">Edit Mode</label>
        <div className="flex gap-1">
          <button
            className={`config-mode-btn ${editMode === 'wall' ? 'active' : ''}`}
            onClick={() => setEditMode('wall')}
            disabled={disabled}
          >
            Wall
          </button>
          <button
            className={`config-mode-btn ${editMode === 'start' ? 'active' : ''}`}
            onClick={() => setEditMode('start')}
            disabled={disabled}
          >
            Start
          </button>
          <button
            className={`config-mode-btn ${editMode === 'goal' ? 'active' : ''}`}
            onClick={() => setEditMode('goal')}
            disabled={disabled || mazeGrid.goalType === 'center2x2'}
          >
            Goal
          </button>
        </div>
      </div>

      <div className="config-section">
        <div className="flex gap-1">
          <button onClick={undo} disabled={disabled} className="btn-add btn-add-sm">↩ Undo</button>
          <button onClick={redo} disabled={disabled} className="btn-add btn-add-sm">↪ Redo</button>
        </div>
      </div>

      <div className="config-section">
        <span className="text-xs text-gray-400 block mb-1">Presets</span>
        <div className="flex gap-1">
          <button onClick={resetToDefault} className="btn-add btn-add-sm" disabled={disabled}>
            Default
          </button>
          <select
            className="config-input config-input-sm flex-1"
            value={selectedPresetId}
            disabled={disabled}
            onChange={handlePresetSelect}
          >
            <option value="">Load preset...</option>
            <optgroup label="Generated">
              <option value="gen-5-5-easy">5×5 Easy</option>
              <option value="gen-5-5-medium">5×5 Medium</option>
              <option value="gen-5-5-hard">5×5 Hard</option>
              <option value="gen-8-8-easy">8×8 Easy</option>
              <option value="gen-8-8-medium">8×8 Medium</option>
              <option value="gen-8-8-hard">8×8 Hard</option>
              <option value="gen-16-16-easy">16×16 Easy</option>
              <option value="gen-16-16-medium">16×16 Medium</option>
              <option value="gen-16-16-hard">16×16 Hard</option>
            </optgroup>
            {savedPresets.length > 0 && (
              <optgroup label="Saved">
                {savedPresets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          {selectedPresetId && savedPresets.find(p => p.id === selectedPresetId) && (
            <button
              onClick={() => { deletePreset(selectedPresetId); setSelectedPresetId(''); }}
              className="btn-remove btn-remove-sm"
              disabled={disabled}
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-1 mt-1">
          <input
            type="text"
            className="config-input config-input-sm flex-1"
            placeholder="Preset name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            disabled={disabled}
          />
          <button
            onClick={() => { if (presetName) { savePreset(presetName); setPresetName(''); } }}
            className="btn-add btn-add-sm"
            disabled={disabled || !presetName.trim()}
          >
            Save
          </button>
        </div>
      </div>

      <div className="config-section">
        <span className="text-xs text-gray-400 block mb-1">Auto Generate</span>
        <div className="flex gap-1 mb-1">
          <button onClick={() => genMaze('easy')} className="btn-add btn-add-sm flex-1" disabled={disabled}>Easy</button>
          <button onClick={() => genMaze('medium')} className="btn-add btn-add-sm flex-1" disabled={disabled}>Medium</button>
          <button onClick={() => genMaze('hard')} className="btn-add btn-add-sm flex-1" disabled={disabled}>Hard</button>
        </div>
      </div>

      <div className="config-section">
        <span className="text-xs text-gray-400 block mb-1">Export / Import</span>
        <div className="flex gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-add btn-add-sm flex-1"
            disabled={disabled}
          >
            Import
          </button>
          <button onClick={handleExport} className="btn-add btn-add-sm flex-1" disabled={disabled}>
            Export
          </button>
        </div>
      </div>

      <div className="config-section">
        {reachInfo.reachable ? (
          <span className="text-green-400 text-xs">✅ Reachable ({reachInfo.steps} steps)</span>
        ) : (
          <span className="text-red-400 text-xs">❌ Goal unreachable</span>
        )}
      </div>
    </div>
  );
}
