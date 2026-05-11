import { create } from 'zustand';

export type EditorTab = 'blockly' | 'monaco';

interface CodeEditorState {
  pythonCode: string;
  activeTab: EditorTab;
  workspaceXml: string | null;
  setPythonCode: (code: string) => void;
  setActiveTab: (tab: EditorTab) => void;
  setWorkspaceXml: (xml: string | null) => void;
}

export const useCodeEditorStore = create<CodeEditorState>((set) => ({
  pythonCode: '',
  activeTab: 'blockly',
  workspaceXml: null,
  setPythonCode: (code) => set({ pythonCode: code }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setWorkspaceXml: (xml) => set({ workspaceXml: xml }),
}));
