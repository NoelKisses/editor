"use client";

import { useState, useCallback, useEffect } from "react";
import { StickyNote, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  text: string;
  color: string;
  createdAt: number;
  collapsed: boolean;
}

const STORAGE_KEY = "editor_canvas_notes";
const NOTE_COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c"];

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotes(notes: Note[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch { /* quota */ }
}

export function CanvasNotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState(NOTE_COLORS[0]);

  useEffect(() => {
    queueMicrotask(() => setNotes(loadNotes()));
  }, []);

  const addNote = useCallback(() => {
    if (!newText.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      text: newText.trim(),
      color: newColor,
      createdAt: Date.now(),
      collapsed: false,
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setNewText("");
    toast.success("Nota adicionada");
  }, [newText, newColor, notes]);

  const removeNote = useCallback((id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
  }, [notes]);

  const toggleCollapse = useCallback((id: string) => {
    const updated = notes.map((n) => n.id === id ? { ...n, collapsed: !n.collapsed } : n);
    setNotes(updated);
    saveNotes(updated);
  }, [notes]);

  const updateNote = useCallback((id: string, text: string) => {
    const updated = notes.map((n) => n.id === id ? { ...n, text } : n);
    setNotes(updated);
    saveNotes(updated);
  }, [notes]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Notas do Design</span>
        {notes.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">{notes.length} nota(s)</span>
        )}
      </div>

      {/* Add note */}
      <div className="flex flex-col gap-2 border border-border rounded-lg p-2.5" style={{ borderLeftColor: newColor, borderLeftWidth: 3 }}>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote(); }}
          placeholder="Adicionar nota... (Ctrl+Enter para salvar)"
          className="w-full text-xs bg-transparent text-foreground outline-none resize-none min-h-[60px] placeholder:text-muted-foreground/50"
          rows={3}
        />
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${newColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={addNote}
            disabled={!newText.trim()}
            className="ml-auto flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex flex-col gap-2">
        {notes.length === 0 && (
          <p className="text-[10px] text-muted-foreground/50 text-center py-3">
            Nenhuma nota ainda. Adicione observações sobre o design.
          </p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex flex-col gap-1 border border-border rounded-lg overflow-hidden"
            style={{ borderLeftColor: note.color, borderLeftWidth: 3 }}
          >
            <div
              className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-accent/20"
              onClick={() => toggleCollapse(note.id)}
            >
              <span
                className="text-[9px] text-muted-foreground"
                style={{ color: note.color }}
              >
                {new Date(note.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); removeNote(note.id); }}
                  className="text-muted-foreground/50 hover:text-destructive transition-colors p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                {note.collapsed ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            {!note.collapsed && (
              <textarea
                value={note.text}
                onChange={(e) => updateNote(note.id, e.target.value)}
                onBlur={() => saveNotes(notes)}
                className="px-2 pb-2 text-[11px] bg-transparent text-foreground outline-none resize-none min-h-[48px]"
                rows={3}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
