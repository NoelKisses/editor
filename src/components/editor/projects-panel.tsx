"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, Save, Trash2, FolderPlus, Clock } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { toast } from "sonner";

const STORAGE_KEY = "editor_projects";

interface SavedProject {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  thumbnail: string;
  canvasJson: string;
  savedAt: number;
}

function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: SavedProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

interface ProjectsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ProjectsPanel({ fabricCanvas }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [saveName, setSaveName] = useState("");
  const { template } = useEditorStore();

  useEffect(() => {
    const saved = loadProjects();
    queueMicrotask(() => setProjects(saved));
  }, []);

  const handleSave = useCallback(() => {
    if (!fabricCanvas || !template) {
      toast.error("Selecione um template e adicione elementos antes de salvar");
      return;
    }
    const name = saveName.trim() || `Projeto ${new Date().toLocaleDateString("pt-BR")}`;
    const thumbnail = fabricCanvas.toDataURL({
      format: "jpeg",
      quality: 0.5,
      multiplier: Math.min(200 / fabricCanvas.getWidth(), 112 / fabricCanvas.getHeight()),
    });
    const canvasJson = JSON.stringify(fabricCanvas.toJSON());

    const project: SavedProject = {
      id: `proj_${Date.now()}`,
      name,
      templateId: template.id,
      templateName: template.name,
      thumbnail,
      canvasJson,
      savedAt: Date.now(),
    };

    const updated = [project, ...loadProjects().filter((p) => p.id !== project.id)].slice(0, 20);
    saveProjects(updated);
    setProjects(updated);
    setSaveName("");
    toast.success(`Projeto "${name}" salvo!`);
  }, [fabricCanvas, template, saveName]);

  const handleLoad = useCallback(
    (project: SavedProject) => {
      if (!fabricCanvas) return;
      fabricCanvas.loadFromJSON(project.canvasJson, () => {
        fabricCanvas.requestRenderAll();
        toast.success(`Projeto "${project.name}" carregado!`);
      });
    },
    [fabricCanvas]
  );

  const handleDelete = useCallback((id: string, name: string) => {
    const updated = loadProjects().filter((p) => p.id !== id);
    saveProjects(updated);
    setProjects(updated);
    toast.success(`Projeto "${name}" removido`);
  }, []);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-3 pt-2 px-3 pb-3">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Projetos</h3>
      </div>

      {/* Save form */}
      <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-border bg-card/30">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Salvar Projeto Atual</span>
        <input
          type="text"
          placeholder="Nome do projeto (opcional)"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground w-full"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!fabricCanvas || !template}
          className="w-full gap-1.5 h-7 text-xs"
        >
          <Save className="w-3.5 h-3.5" />
          Salvar
        </Button>
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
          <FolderPlus className="w-8 h-8 opacity-20" />
          <p className="text-xs text-center">Nenhum projeto salvo ainda</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Projetos Salvos ({projects.length})
          </span>
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex gap-2 p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/30 transition-colors group"
            >
              {/* Thumbnail */}
              <div className="w-16 h-9 rounded overflow-hidden bg-zinc-800 flex-shrink-0 border border-border/50">
                {project.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.thumbnail}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground truncate">{project.name}</span>
                <span className="text-[9px] text-muted-foreground truncate">{project.templateName}</span>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(project.savedAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6"
                  onClick={() => handleLoad(project)}
                  title="Carregar projeto"
                >
                  <FolderOpen className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 hover:text-destructive"
                  onClick={() => handleDelete(project.id, project.name)}
                  title="Deletar projeto"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
