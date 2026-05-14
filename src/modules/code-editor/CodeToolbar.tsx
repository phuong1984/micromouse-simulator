import { useRef, useState } from 'react';
import { useCodeEditorStore } from './store';
import { downloadJson, readFileAsText } from '../../shared/utils/export-import';
import { EXAMPLE_PROGRAMS } from '../../shared/constants/examples';

export function CodeToolbar() {
  const pythonCode = useCodeEditorStore((s) => s.pythonCode);
  const workspaceXml = useCodeEditorStore((s) => s.workspaceXml);
  const setPythonCode = useCodeEditorStore((s) => s.setPythonCode);
  const setActiveTab = useCodeEditorStore((s) => s.setActiveTab);
  const triggerImport = useCodeEditorStore((s) => s.triggerImport);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showExamples, setShowExamples] = useState(false);

  const handleExport = () => {
    const data: Record<string, string> = {};
    if (pythonCode) data.pythonCode = pythonCode;
    if (workspaceXml) data.workspaceXml = workspaceXml;
    if (!data.pythonCode && !data.workspaceXml) return;
    downloadJson(JSON.stringify(data, null, 2), 'micromouse-code.json');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const data = JSON.parse(text);
      if (data.pythonCode) setPythonCode(data.pythonCode);
      if (data.workspaceXml) triggerImport(data.workspaceXml);
    } catch {
      console.warn('Failed to import code file');
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const loadExample = (id: string) => {
    const ex = EXAMPLE_PROGRAMS.find((e) => e.id === id);
    if (!ex) return;
    setPythonCode(ex.code);
    setActiveTab('monaco');
    setShowExamples(false);
  };

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="code-toolbar-btn code-toolbar-examples"
          title="Load example program"
        >
          📚
        </button>
        {showExamples && (
          <>
            <div className="examples-overlay" onClick={() => setShowExamples(false)} />
            <div className="examples-dropdown">
              <div className="examples-dropdown-header">Example programs</div>
              {EXAMPLE_PROGRAMS.map((ex) => (
                <button
                  key={ex.id}
                  className="examples-dropdown-item"
                  onClick={() => loadExample(ex.id)}
                >
                  <div className="examples-dropdown-item-name">{ex.name}</div>
                  <div className="examples-dropdown-item-desc">{ex.description}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button onClick={handleExport} className="code-toolbar-btn" title="Export code (JSON)">⬇</button>
      <button onClick={() => inputRef.current?.click()} className="code-toolbar-btn" title="Import code (JSON)">📂</button>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
    </div>
  );
}
