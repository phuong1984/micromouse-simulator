import { create } from 'zustand';

export type EditorTab = 'blockly' | 'monaco';

interface CodeEditorState {
  pythonCode: string;
  activeTab: EditorTab;
  workspaceXml: string | null;
  importWorkspaceXml: string | null;
  setPythonCode: (code: string) => void;
  setActiveTab: (tab: EditorTab) => void;
  setWorkspaceXml: (xml: string | null) => void;
  triggerImport: (xml: string) => void;
  clearImport: () => void;
}

export const useCodeEditorStore = create<CodeEditorState>((set) => ({
  pythonCode: '',
  activeTab: 'blockly',
  workspaceXml: null,
  importWorkspaceXml: null,
  setPythonCode: (code) => set({ pythonCode: code }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setWorkspaceXml: (xml) => set({ workspaceXml: xml }),
  triggerImport: (xml) => set({ importWorkspaceXml: xml }),
  clearImport: () => set({ importWorkspaceXml: null }),
}));
