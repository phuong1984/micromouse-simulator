import { useRef } from 'react';
import { useCodeEditorStore } from './store';
import { downloadJson, readFileAsText } from '../../shared/utils/export-import';

export function CodeToolbar() {
  const pythonCode = useCodeEditorStore((s) => s.pythonCode);
  const workspaceXml = useCodeEditorStore((s) => s.workspaceXml);
  const setPythonCode = useCodeEditorStore((s) => s.setPythonCode);
  const triggerImport = useCodeEditorStore((s) => s.triggerImport);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex items-center gap-1">
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
