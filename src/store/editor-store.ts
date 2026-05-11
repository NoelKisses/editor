"use client";

import { create } from "zustand";
import { Template, CanvasElement, EditorState, ExportOptions } from "@/types/editor";

interface EditorStore extends EditorState {
  setTemplate: (template: Template) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElementUp: (id: string) => void;
  moveElementDown: (id: string) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
  setAiSuggestions: (suggestions: string[]) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  clearCanvas: () => void;
  exportOptions: ExportOptions;
  setExportOptions: (options: Partial<ExportOptions>) => void;
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: "png",
  quality: 95,
  scale: 1,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  template: null,
  elements: [],
  selectedElementId: null,
  history: [[]],
  historyIndex: 0,
  zoom: 1,
  isAnalyzing: false,
  aiSuggestions: [],
  exportOptions: DEFAULT_EXPORT_OPTIONS,

  setTemplate: (template) => {
    set({ template, elements: [], selectedElementId: null, history: [[]], historyIndex: 0 });
  },

  addElement: (element) => {
    const { elements, history, historyIndex } = get();
    const newElements = [...elements, element];
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    set({ elements: newElements, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  updateElement: (id, updates) => {
    const { elements, history, historyIndex } = get();
    const newElements = elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    set({ elements: newElements, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  removeElement: (id) => {
    const { elements, history, historyIndex } = get();
    const newElements = elements.filter((el) => el.id !== id);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    set({
      elements: newElements,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedElementId: null,
    });
  },

  selectElement: (id) => set({ selectedElementId: id }),

  moveElementUp: (id) => {
    const { elements } = get();
    const idx = elements.findIndex((el) => el.id === id);
    if (idx === elements.length - 1) return;
    const newElements = [...elements];
    [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];
    set({ elements: newElements });
  },

  moveElementDown: (id) => {
    const { elements } = get();
    const idx = elements.findIndex((el) => el.id === id);
    if (idx === 0) return;
    const newElements = [...elements];
    [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];
    set({ elements: newElements });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex === 0) return;
    const newIndex = historyIndex - 1;
    set({ elements: history[newIndex], historyIndex: newIndex });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex === history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ elements: history[newIndex], historyIndex: newIndex });
  },

  setZoom: (zoom) => set({ zoom }),

  setAiSuggestions: (suggestions) => set({ aiSuggestions: suggestions }),

  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  clearCanvas: () =>
    set({ elements: [], selectedElementId: null, history: [[]], historyIndex: 0 }),

  setExportOptions: (options) =>
    set((state) => ({ exportOptions: { ...state.exportOptions, ...options } })),
}));
