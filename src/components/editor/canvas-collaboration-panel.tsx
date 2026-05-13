"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2, Check } from "lucide-react";

interface CanvasCollaborationPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  resolved: boolean;
  x: number;
  y: number;
  color: string;
}

const STORAGE_KEY = "editor_collaboration_comments";
const AUTHOR_KEY = "editor_collab_author";

const AUTHOR_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

function loadComments(): Comment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveComments(comments: Comment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch {
    // silent
  }
}

function getAuthorColor(author: string): string {
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length];
}

export function CanvasCollaborationPanel({ fabricCanvas }: CanvasCollaborationPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState("Usuário");
  const [newText, setNewText] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [pinMode, setPinMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setComments(loadComments());
      const saved = localStorage.getItem(AUTHOR_KEY);
      if (saved) setAuthorName(saved);
    });
  }, []);

  // Canvas click handler for pin mode
  useEffect(() => {
    if (!fabricCanvas || !pinMode) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMouseDown = (opt: any) => {
      const pointer = fabricCanvas.getPointer(opt.e);
      setPendingPin({ x: Math.round(pointer.x), y: Math.round(pointer.y) });
      setPinMode(false);
    };

    fabricCanvas.on("mouse:down", onMouseDown);
    return () => { fabricCanvas.off("mouse:down", onMouseDown); };
  }, [fabricCanvas, pinMode]);

  const addComment = useCallback(() => {
    if (!newText.trim()) return;

    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: authorName,
      text: newText.trim(),
      timestamp: Date.now(),
      resolved: false,
      x: pendingPin?.x ?? 0,
      y: pendingPin?.y ?? 0,
      color: getAuthorColor(authorName),
    };

    const updated = [comment, ...comments];
    setComments(updated);
    saveComments(updated);
    setNewText("");
    setPendingPin(null);
  }, [newText, authorName, comments, pendingPin]);

  const toggleResolved = useCallback((id: string) => {
    const updated = comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c);
    setComments(updated);
    saveComments(updated);
  }, [comments]);

  const removeComment = useCallback((id: string) => {
    const updated = comments.filter(c => c.id !== id);
    setComments(updated);
    saveComments(updated);
  }, [comments]);

  const clearAll = useCallback(() => {
    setComments([]);
    saveComments([]);
  }, []);

  const jumpToPin = useCallback((comment: Comment) => {
    if (!fabricCanvas || (!comment.x && !comment.y)) return;
    const vpt = fabricCanvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const zoom = fabricCanvas.getZoom?.() ?? 1;
    const newVpt = [...vpt];
    newVpt[4] = -comment.x * zoom + fabricCanvas.width / 2;
    newVpt[5] = -comment.y * zoom + fabricCanvas.height / 2;
    fabricCanvas.setViewportTransform(newVpt);
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const filtered = comments.filter(c => {
    if (filter === "open") return !c.resolved;
    if (filter === "resolved") return c.resolved;
    return true;
  });

  const saveAuthor = useCallback(() => {
    localStorage.setItem(AUTHOR_KEY, authorName);
  }, [authorName]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Colaboração</span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] text-white font-bold"
          style={{ backgroundColor: getAuthorColor(authorName) }}>
          {authorName.charAt(0).toUpperCase()}
        </div>
        <input type="text" value={authorName}
          onChange={e => setAuthorName(e.target.value)}
          onBlur={saveAuthor}
          placeholder="Seu nome"
          className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
      </div>

      {/* New comment */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Novo Comentário</span>

        {pendingPin && (
          <div className="flex items-center gap-1 text-[8px] text-primary bg-primary/10 px-2 py-1 rounded">
            <span>📍</span>
            <span>Pino em ({pendingPin.x}, {pendingPin.y})</span>
            <button onClick={() => setPendingPin(null)} className="ml-auto text-muted-foreground hover:text-destructive">×</button>
          </div>
        )}

        <textarea value={newText} onChange={e => setNewText(e.target.value)}
          placeholder="Escreva seu comentário…"
          rows={3}
          className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary resize-none" />

        <div className="grid grid-cols-2 gap-1">
          <button onClick={() => setPinMode(true)} disabled={pinMode}
            className="py-1 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40">
            {pinMode ? "Clique no canvas…" : "📍 Fixar no Canvas"}
          </button>
          <button onClick={addComment} disabled={!newText.trim()}
            className="flex items-center justify-center gap-0.5 py-1 rounded border border-primary text-primary text-[8px] hover:bg-primary/10 transition-colors disabled:opacity-40">
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-1 flex-1">
          {(["all", "open", "resolved"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`py-1 rounded border text-[7px] transition-colors ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {f === "all" ? "Todos" : f === "open" ? "Abertos" : "Resolvidos"}
            </button>
          ))}
        </div>
        {comments.length > 0 && (
          <button onClick={clearAll} className="ml-2 text-[7px] text-destructive hover:underline flex-shrink-0">Limpar</button>
        )}
      </div>

      {/* Comments list */}
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-3">Nenhum comentário</p>
        ) : (
          filtered.map(c => (
            <div key={c.id}
              className={`flex flex-col gap-1 p-2 rounded border transition-colors ${c.resolved ? "border-border opacity-60 bg-muted/5" : "border-border bg-card"}`}>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] text-white font-bold"
                  style={{ backgroundColor: c.color }}>
                  {c.author.charAt(0).toUpperCase()}
                </div>
                <span className="text-[8px] font-medium">{c.author}</span>
                {c.x > 0 && (
                  <button onClick={() => jumpToPin(c)}
                    className="text-[7px] text-primary hover:underline ml-auto">📍 ({c.x},{c.y})</button>
                )}
                <span className="text-[7px] text-muted-foreground ml-auto">
                  {new Date(c.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-[8px] text-foreground pl-5">{c.text}</p>
              <div className="flex items-center gap-1 pl-5">
                <button onClick={() => toggleResolved(c.id)}
                  className={`flex items-center gap-0.5 text-[7px] ${c.resolved ? "text-muted-foreground" : "text-green-500"} hover:underline`}>
                  <Check className="w-2.5 h-2.5" />
                  {c.resolved ? "Reabrir" : "Resolver"}
                </button>
                <button onClick={() => removeComment(c.id)}
                  className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        {comments.length} comentário{comments.length !== 1 ? "s" : ""} — salvo localmente
      </p>
    </div>
  );
}
