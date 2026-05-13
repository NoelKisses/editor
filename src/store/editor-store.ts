"use client";

import { create } from "zustand";
import { Template, CanvasElement, EditorState, ExportOptions } from "@/types/editor";

interface Page {
  id: string;
  label: string;
  fabricJSON: string; // JSON.stringify of fabric canvas state
  thumbnail?: string; // data URL preview
}

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
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  // Multi-page
  pages: Page[];
  currentPageIndex: number;
  addPage: () => void;
  removePage: (index: number) => void;
  setCurrentPage: (index: number) => void;
  savePageState: (index: number, fabricJSON: string, thumbnail?: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  duplicatePage: (index: number) => void;
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
  snapToGrid: false,
  pages: [{ id: "page-1", label: "Página 1", fabricJSON: "" }],
  currentPageIndex: 0,

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

  setSnapToGrid: (snap) => set({ snapToGrid: snap }),

  addPage: () => {
    const { pages } = get();
    const newPage: Page = {
      id: `page-${Date.now()}`,
      label: `Página ${pages.length + 1}`,
      fabricJSON: "",
    };
    set({ pages: [...pages, newPage], currentPageIndex: pages.length });
  },

  removePage: (index) => {
    const { pages, currentPageIndex } = get();
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    const newIndex = Math.min(currentPageIndex, newPages.length - 1);
    set({ pages: newPages, currentPageIndex: newIndex });
  },

  setCurrentPage: (index) => set({ currentPageIndex: index }),

  savePageState: (index, fabricJSON, thumbnail) => {
    const { pages } = get();
    const newPages = pages.map((p, i) =>
      i === index ? { ...p, fabricJSON, thumbnail: thumbnail ?? p.thumbnail } : p
    );
    set({ pages: newPages });
  },

  reorderPages: (fromIndex, toIndex) => {
    const { pages } = get();
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    set({ pages: newPages, currentPageIndex: toIndex });
  },

  duplicatePage: (index) => {
    const { pages } = get();
    const source = pages[index];
    const newPage: Page = {
      id: `page-${Date.now()}`,
      label: `${source.label} (cópia)`,
      fabricJSON: source.fabricJSON,
      thumbnail: source.thumbnail,
    };
    const newPages = [...pages.slice(0, index + 1), newPage, ...pages.slice(index + 1)];
    set({ pages: newPages, currentPageIndex: index + 1 });
  },
}));
