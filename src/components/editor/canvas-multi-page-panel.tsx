"use client";

import { useCallback, useState } from "react";
import { Layers2, Plus, Trash2, ChevronUp, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";

interface CanvasMultiPagePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface Page {
  id: string;
  label: string;
  json: string;
  thumbnail: string;
}

function generateThumbnail(canvas: unknown): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = canvas as any;
    return c.toDataURL({ format: "png", multiplier: 0.15 });
  } catch {
    return "";
  }
}

export function CanvasMultiPagePanel({ fabricCanvas }: CanvasMultiPagePanelProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  const saveCurrentState = useCallback((): Page | null => {
    if (!fabricCanvas) return null;
    const json = JSON.stringify(fabricCanvas.toJSON());
    const thumbnail = generateThumbnail(fabricCanvas);
    return { id: "", label: "", json, thumbnail };
  }, [fabricCanvas]);

  const addPage = useCallback(() => {
    if (!fabricCanvas) return;

    // Save current state if we have a current page
    const state = saveCurrentState();
    if (!state) return;

    const now = Date.now();
    const newPageId = `page-${now}`;
    const pageNum = pages.length + 1;

    // Update current page in list
    if (currentPage) {
      setPages(prev => prev.map(p =>
        p.id === currentPage ? { ...p, json: state.json, thumbnail: state.thumbnail } : p
      ));
    } else if (pages.length === 0) {
      // First save — create page 1 with current state
      const page1: Page = { id: `page-${now - 1}`, label: "Página 1", json: state.json, thumbnail: state.thumbnail };
      setPages([page1, { id: newPageId, label: `Página ${pageNum}`, json: "[]", thumbnail: "" }]);
      setCurrentPage(newPageId);
      fabricCanvas.clear();
      fabricCanvas.requestRenderAll();
      toast.success("Página 2 adicionada");
      return;
    }

    const newPage: Page = { id: newPageId, label: `Página ${pageNum}`, json: "{}", thumbnail: "" };
    setPages(prev => [...prev, newPage]);
    setCurrentPage(newPageId);
    fabricCanvas.clear();
    fabricCanvas.requestRenderAll();
    toast.success(`Página ${pageNum} adicionada`);
  }, [fabricCanvas, pages.length, currentPage, saveCurrentState]);

  const switchPage = useCallback((page: Page) => {
    if (!fabricCanvas || page.id === currentPage) return;

    // Save current page state
    const state = saveCurrentState();
    if (state && currentPage) {
      setPages(prev => prev.map(p =>
        p.id === currentPage ? { ...p, json: state.json, thumbnail: state.thumbnail } : p
      ));
    }

    // Load target page
    try {
      const json = page.json && page.json !== "{}" && page.json !== "[]"
        ? JSON.parse(page.json)
        : null;

      if (json) {
        fabricCanvas.loadFromJSON(json, () => {
          fabricCanvas.requestRenderAll();
        });
      } else {
        fabricCanvas.clear();
        fabricCanvas.requestRenderAll();
      }
      setCurrentPage(page.id);
      toast.success(`Página "${page.label}" ativada`);
    } catch {
      toast.error("Erro ao carregar página");
    }
  }, [fabricCanvas, currentPage, saveCurrentState]);

  const deletePage = useCallback((id: string) => {
    if (pages.length <= 1) { toast.error("Não é possível remover a única página"); return; }
    const idx = pages.findIndex(p => p.id === id);
    const remaining = pages.filter(p => p.id !== id);
    setPages(remaining);

    if (currentPage === id) {
      const nextPage = remaining[Math.max(0, idx - 1)];
      switchPage(nextPage);
    }
    toast.success("Página removida");
  }, [pages, currentPage, switchPage]);

  const duplicatePage = useCallback((page: Page) => {
    const now = Date.now();
    const state = page.id === currentPage ? saveCurrentState() : null;
    const json = state?.json ?? page.json;
    const thumbnail = state?.thumbnail ?? page.thumbnail;
    const dup: Page = {
      id: `page-${now}`,
      label: `${page.label} (cópia)`,
      json,
      thumbnail,
    };
    const idx = pages.findIndex(p => p.id === page.id);
    setPages(prev => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    toast.success(`"${page.label}" duplicada`);
  }, [pages, currentPage, saveCurrentState]);

  const movePage = useCallback((id: string, dir: -1 | 1) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }, []);

  const initFirstPage = useCallback(() => {
    if (!fabricCanvas || pages.length > 0) return;
    const state = saveCurrentState();
    if (!state) return;
    const page: Page = { id: `page-${Date.now()}`, label: "Página 1", json: state.json, thumbnail: state.thumbnail };
    setPages([page]);
    setCurrentPage(page.id);
    toast.success("Página 1 inicializada com o estado atual");
  }, [fabricCanvas, pages.length, saveCurrentState]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Layers2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Múltiplas Páginas</span>
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Layers2 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Nenhuma página criada ainda</p>
          <button onClick={initFirstPage}
            className="flex items-center gap-1 py-1.5 px-3 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
            <Plus className="w-3 h-3" /> Inicializar Páginas
          </button>
        </div>
      ) : (
        <>
          {/* Pages list */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Páginas ({pages.length})
              </span>
              <button onClick={addPage}
                className="flex items-center gap-0.5 text-[8px] text-primary hover:underline">
                <Plus className="w-2.5 h-2.5" /> Nova
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {pages.map((page, idx) => (
                <div key={page.id}
                  className={`flex items-center gap-1.5 p-1.5 rounded border transition-colors cursor-pointer ${currentPage === page.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                  onClick={() => switchPage(page)}>
                  {/* Thumbnail */}
                  <div className="w-10 h-8 flex-shrink-0 rounded overflow-hidden border border-border bg-muted/20">
                    {page.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={page.thumbnail} alt={page.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[7px] text-muted-foreground">{idx + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`flex-1 text-[9px] truncate ${currentPage === page.id ? "text-primary font-medium" : ""}`}>
                    {page.label}
                  </span>

                  {/* Controls */}
                  <div className="flex items-center gap-0.5">
                    <button onClick={e => { e.stopPropagation(); movePage(page.id, -1); }}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-20">
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); movePage(page.id, 1); }}
                      disabled={idx === pages.length - 1}
                      className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-20">
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); duplicatePage(page); }}
                      className="text-muted-foreground hover:text-primary transition-colors">
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deletePage(page.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={addPage}
            className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
            <Plus className="w-3 h-3" /> Adicionar Página
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Cada página é um canvas independente — salvo em memória
          </p>
        </>
      )}
    </div>
  );
}
