import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { pythonGenerator } from 'blockly/python';
import { registerRobotBlocks } from './robotBlocks';
import { ROBOT_TOOLBOX } from './toolbox';
import { MICROMOUSE_THEME } from './blockly-theme';
import { useCodeEditorStore } from './store';

const STORAGE_KEY = 'blockly-workspace-micromouse';

function wrapPythonCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return '';
  const indented = trimmed
    .split('\n')
    .map((line) => (line ? `    ${line}` : ''))
    .join('\n');
  return `async def solve():\n${indented}\n\nawait solve()`;
}

export function BlocklyEditor() {
  const divRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const setPythonCode = useCodeEditorStore((s) => s.setPythonCode);
  const setWorkspaceXml = useCodeEditorStore((s) => s.setWorkspaceXml);
  const importWorkspaceXml = useCodeEditorStore((s) => s.importWorkspaceXml);
  const clearImport = useCodeEditorStore((s) => s.clearImport);
  const activeTab = useCodeEditorStore((s) => s.activeTab);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncWorkspace = () => {
    const ws = workspaceRef.current;
    if (!ws) return;

    const rawCode = pythonGenerator.workspaceToCode(ws);
    const code = wrapPythonCode(rawCode);
    setPythonCode(code);

    const state = Blockly.serialization.workspaces.save(ws);
    const stateStr = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, stateStr);
    setWorkspaceXml(stateStr);
  };

  useEffect(() => {
    const container = divRef.current;
    if (!container) return;

    // Fix React StrictMode double-injection bug
    if (workspaceRef.current) return;
    if (container.children.length > 0) {
      container.innerHTML = '';
    }

    registerRobotBlocks();

    workspaceRef.current = Blockly.inject(container, {
      toolbox: ROBOT_TOOLBOX,
      theme: MICROMOUSE_THEME,
      renderer: 'zelos',
      grid: { spacing: 24, length: 2, colour: '#374151', snap: false },
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3 },
      trashcan: true,
      scrollbars: true,
    });

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState && savedState.trim().length > 0) {
      try {
        const state = JSON.parse(savedState);
        Blockly.serialization.workspaces.load(state, workspaceRef.current, { recordUndo: false });
      } catch {
        console.warn('Failed to load saved workspace state');
      }
    }

    // Sync on EVERY event, no filtering. This guarantees 100% sync.
    const changeListener = () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(syncWorkspace, 100);
    };
    workspaceRef.current.addChangeListener(changeListener);

    // Initial sync
    syncWorkspace();

    // Force toolbox width after Blockly fully lays out
    setTimeout(() => {
      const toolboxDiv = document.querySelector('.blocklyToolboxDiv') as HTMLElement | null;
      if (toolboxDiv) {
        toolboxDiv.style.setProperty('width', '60px', 'important');
        toolboxDiv.style.setProperty('min-width', '60px', 'important');
        toolboxDiv.style.setProperty('max-width', '60px', 'important');
      }
      if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
    }, 300);

    const observer = new ResizeObserver(() => {
      if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
    });
    observer.observe(container.parentElement || container);

    return () => {
      observer.disconnect();
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
      if (container) {
        container.innerHTML = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (workspaceRef.current) {
      if (activeTab === 'blockly') {
        Blockly.svgResize(workspaceRef.current);
      }
      // Force sync on any tab switch to guarantee Monaco has the absolute latest code
      syncWorkspace();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const ws = workspaceRef.current;
    const xml = importWorkspaceXml;
    if (!ws || !xml) return;
    try {
      const state = JSON.parse(xml);
      Blockly.serialization.workspaces.load(state, ws);
      syncWorkspace();
      clearImport();
    } catch (e) {
      console.warn('Failed to load imported workspace', e);
      clearImport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importWorkspaceXml]);

  return (
    <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
      <div ref={divRef} className="blockly-workspace" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    </div>
  );
}
