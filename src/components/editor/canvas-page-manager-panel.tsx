"use client";

import { useEffect, useRef, useState } from "react";
import { FileStack, Plus, Copy, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CanvasPageManagerPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface CanvasPage {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
  thumb: string;
}

function generatePageId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fallthrough
  }
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function snapshotCanvas(canvas: any): { json: any; thumb: string } {
  const json = canvas.toJSON();
  let thumb = "";
  try {
    thumb = canvas.toDataURL({ format: "png", multiplier: 0.15 });
  } catch {
    thumb = "";
  }
  return { json, thumb };
}

export function CanvasPageManagerPanel({ fabricCanvas }: CanvasPageManagerPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [pages, setPages] = useState<CanvasPage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleAddPage = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const { json, thumb } = snapshotCanvas(canvas);
    const id = generatePageId();
    const newPage: CanvasPage = {
      id,
      name: `Página ${pages.length + 1}`,
      json,
      thumb,
    };
    setPages((prev) => [...prev, newPage]);
    setActiveId(id);
    toast.success("Página adicionada");
  };

  const handleDuplicate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (!activeId) {
      toast.error("Nenhuma página ativa");
      return;
    }
    const current = pages.find((p) => p.id === activeId);
    if (!current) {
      toast.error("Página ativa não encontrada");
      return;
    }
    const id = generatePageId();
    const duplicated: CanvasPage = {
      id,
      name: `${current.name} (cópia)`,
      json: JSON.parse(JSON.stringify(current.json)),
      thumb: current.thumb,
    };
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === activeId);
      const next = [...prev];
      next.splice(idx + 1, 0, duplicated);
      return next;
    });
    setActiveId(id);
    toast.success("Página duplicada");
  };

  const handleSaveCurrent = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (!activeId) {
      toast.error("Nenhuma página ativa para salvar");
      return;
    }
    const { json, thumb } = snapshotCanvas(canvas);
    setPages((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, json, thumb } : p))
    );
    toast.success("Página atual salva");
  };

  const handleLoadPage = (id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const page = pages.find((p) => p.id === id);
    if (!page) {
      toast.error("Página não encontrada");
      return;
    }
    try {
      canvas.loadFromJSON(page.json, () => canvas.requestRenderAll());
      setActiveId(id);
      toast.success(`Página "${page.name}" carregada`);
    } catch {
      toast.error("Falha ao carregar página");
    }
  };

  const handleRename = (id: string, name: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handleDelete = (id: string) => {
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (activeId === id) {
        setActiveId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
    toast.success("Página removida");
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      toast.message("Clique novamente para confirmar a remoção de todas as páginas");
      return;
    }
    setPages([]);
    setActiveId(null);
    setConfirmClear(false);
    toast.success("Todas as páginas removidas");
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileStack className="h-4 w-4" />
          <span className="text-sm font-semibold">Gerenciador de Páginas</span>
        </div>
        <Badge variant="secondary">{pages.length}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="default" onClick={handleAddPage}>
          <Plus className="mr-1 h-3 w-3" />
          Adicionar Página
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDuplicate}
          disabled={!activeId}
        >
          <Copy className="mr-1 h-3 w-3" />
          Duplicar Atual
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSaveCurrent}
          disabled={!activeId}
        >
          <Save className="mr-1 h-3 w-3" />
          Salvar Atual
        </Button>
        <Button
          size="sm"
          variant={confirmClear ? "destructive" : "outline"}
          onClick={handleClearAll}
          disabled={pages.length === 0}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          {confirmClear ? "Confirmar" : "Limpar Tudo"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {pages.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            Nenhuma página criada. Use &quot;Adicionar Página&quot; para começar.
          </div>
        ) : (
          pages.map((page, index) => {
            const isActive = page.id === activeId;
            return (
              <div
                key={page.id}
                className={`flex items-center gap-2 rounded-md border p-2 transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleLoadPage(page.id)}
                  className="flex shrink-0 items-center justify-center overflow-hidden rounded border bg-background"
                  style={{ width: 48, height: 48 }}
                  aria-label={`Carregar ${page.name}`}
                >
                  {page.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={page.thumb}
                      alt={page.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      sem preview
                    </span>
                  )}
                </button>

                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      #{index + 1}
                    </span>
                    {isActive && (
                      <Badge variant="default" className="h-4 px-1 text-[9px]">
                        ativa
                      </Badge>
                    )}
                  </div>
                  <Input
                    value={page.name}
                    onChange={(e) => handleRename(page.id, e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleDelete(page.id)}
                  aria-label={`Remover ${page.name}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
