"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Save, FolderOpen, Download, Upload, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AutosaveProjectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface SavedProject {
  id: string;
  name: string;
  savedAt: number;
  thumbnail: string;
  canvasJSON: string;
  canvasWidth: number;
  canvasHeight: number;
}

const STORAGE_KEY = "editor_saved_projects";
const AUTOSAVE_KEY = "editor_autosave";
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds

function loadProjects(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveProjects(projects: SavedProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 20)));
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "agora mesmo";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min atrás`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h atrás`;
  return new Date(ts).toLocaleDateString("pt-BR");
}

export function AutosaveProjectPanel({ fabricCanvas }: AutosaveProjectPanelProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [projectName, setProjectName] = useState("Meu Design");
  const [lastAutosave, setLastAutosave] = useState<number | null>(null);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setProjects(loadProjects());
      try {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setLastAutosave(parsed.savedAt ?? null);
        }
      } catch { /* ignore */ }
    });
  }, []);

  const captureSnapshot = useCallback((): { json: string; thumbnail: string; w: number; h: number } | null => {
    if (!fabricCanvas) return null;
    try {
      const json = JSON.stringify(fabricCanvas.toJSON(["data", "name"]));
      const thumbnail = fabricCanvas.toDataURL({ format: "jpeg", quality: 0.3, multiplier: 0.2 });
      const w = Math.round(fabricCanvas.getWidth() / fabricCanvas.getZoom());
      const h = Math.round(fabricCanvas.getHeight() / fabricCanvas.getZoom());
      return { json, thumbnail, w, h };
    } catch {
      return null;
    }
  }, [fabricCanvas]);

  const doAutosave = useCallback(() => {
    const snap = captureSnapshot();
    if (!snap) return;
    const ts = Date.now();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ canvasJSON: snap.json, savedAt: ts, canvasWidth: snap.w, canvasHeight: snap.h }));
    setLastAutosave(ts);
  }, [captureSnapshot]);

  // Setup autosave interval
  useEffect(() => {
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    if (!autosaveEnabled || !fabricCanvas) return;
    autosaveTimerRef.current = setInterval(doAutosave, AUTOSAVE_INTERVAL);
    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    };
  }, [autosaveEnabled, fabricCanvas, doAutosave]);

  const saveProject = useCallback(() => {
    const snap = captureSnapshot();
    if (!snap) { toast.error("Canvas vazio"); return; }
    const project: SavedProject = {
      id: `proj-${Date.now()}`,
      name: projectName.trim() || "Sem nome",
      savedAt: Date.now(),
      thumbnail: snap.thumbnail,
      canvasJSON: snap.json,
      canvasWidth: snap.w,
      canvasHeight: snap.h,
    };
    const updated = [project, ...loadProjects().filter(p => p.name !== project.name)];
    saveProjects(updated);
    setProjects(updated);
    toast.success(`"${project.name}" salvo`);
  }, [captureSnapshot, projectName]);

  const loadProject = useCallback((project: SavedProject) => {
    if (!fabricCanvas) return;
    fabricCanvas.loadFromJSON(JSON.parse(project.canvasJSON), () => {
      fabricCanvas.requestRenderAll();
      toast.success(`"${project.name}" carregado`);
    });
  }, [fabricCanvas]);

  const deleteProject = useCallback((id: string) => {
    const updated = loadProjects().filter(p => p.id !== id);
    saveProjects(updated);
    setProjects(updated);
    toast.success("Projeto removido");
  }, []);

  const exportJSON = useCallback(() => {
    const snap = captureSnapshot();
    if (!snap) { toast.error("Canvas vazio"); return; }
    const blob = new Blob([snap.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.trim() || "design"}.editor.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Projeto exportado como JSON");
  }, [captureSnapshot, projectName]);

  const importJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.editor.json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !fabricCanvas) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          fabricCanvas.loadFromJSON(json, () => {
            fabricCanvas.requestRenderAll();
            toast.success(`"${file.name}" importado`);
          });
        } catch {
          toast.error("Arquivo inválido");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [fabricCanvas]);

  const restoreAutosave = useCallback(() => {
    if (!fabricCanvas) return;
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) { toast.error("Nenhum autosave encontrado"); return; }
      const parsed = JSON.parse(saved);
      fabricCanvas.loadFromJSON(parsed.canvasJSON, () => {
        fabricCanvas.requestRenderAll();
        toast.success("Autosave restaurado");
      });
    } catch {
      toast.error("Erro ao restaurar autosave");
    }
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Save className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Salvar Projeto</span>
      </div>

      {/* Project name */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nome do projeto</span>
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="Meu Design..."
          className="text-[11px] bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary/50"
        />
      </div>

      {/* Save + Import/Export */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={saveProject}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Salvar
        </button>
        <button
          onClick={importJSON}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Importar
        </button>
        <button
          onClick={exportJSON}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Exportar JSON
        </button>
        <button
          onClick={restoreAutosave}
          disabled={!lastAutosave}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors disabled:opacity-40"
        >
          <Clock className="w-3.5 h-3.5" /> Restaurar
        </button>
      </div>

      {/* Autosave indicator */}
      <div className="flex items-center justify-between p-2 rounded border border-border">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">AutoSave (30s)</span>
          {lastAutosave && (
            <span className="text-[9px] text-muted-foreground/60">Último: {formatRelativeTime(lastAutosave)}</span>
          )}
        </div>
        <button
          onClick={() => setAutosaveEnabled(!autosaveEnabled)}
          className={`relative w-10 h-5 rounded-full transition-colors ${autosaveEnabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${autosaveEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Saved projects */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Projetos salvos ({projects.length})</span>
        </div>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <FolderOpen className="w-6 h-6 text-muted-foreground/30" />
            <p className="text-[10px] text-muted-foreground/60">Nenhum projeto salvo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-1.5 rounded border border-border hover:border-primary/30 transition-colors group">
                {p.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail} alt={p.name} className="w-12 h-8 object-cover rounded-sm border border-border/50 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-8 bg-muted rounded-sm flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium truncate">{p.name}</p>
                  <p className="text-[8px] text-muted-foreground">{formatRelativeTime(p.savedAt)} · {p.canvasWidth}×{p.canvasHeight}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => loadProject(p)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    title="Carregar"
                  >
                    <FolderOpen className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-red-400/40 hover:text-red-400 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
