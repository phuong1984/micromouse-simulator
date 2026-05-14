import Editor, { type OnMount } from '@monaco-editor/react';
import { useCodeEditorStore } from './store';
import { useThemeStore } from '../../shared/utils/theme-store';

export function MonacoEditor() {
  const pythonCode = useCodeEditorStore((s) => s.pythonCode);
  const setPythonCode = useCodeEditorStore((s) => s.setPythonCode);
  const activeTab = useCodeEditorStore((s) => s.activeTab);
  const theme = useThemeStore((s) => s.theme);
  const displayCode = pythonCode || '# Kéo thả blocks trong tab Blockly để generate code';

  const handleMount: OnMount = (editor) => {
    setTimeout(() => editor.getAction('editor.action.formatDocument')?.run(), 500);
  };

  return (
    <Editor
      height="100%"
      language="python"
      theme={theme === 'light' ? 'vs' : 'vs-dark'}
      value={displayCode}
      onChange={(value) => setPythonCode(value ?? '')}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        readOnly: activeTab === 'blockly',
      }}
    />
  );
}
