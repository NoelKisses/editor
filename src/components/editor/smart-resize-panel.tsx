"use client";

import { useCallback, useState } from "react";
import { Maximize2, Check } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editor-store";

interface SmartResizePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const RESIZE_PRESETS = [
  { category: "YouTube", items: [
    { label: "Thumbnail", w: 1280, h: 720 },
    { label: "Banner", w: 2560, h: 1440 },
    { label: "Shorts", w: 1080, h: 1920 },
  ]},
  { category: "Instagram", items: [
    { label: "Quadrado", w: 1080, h: 1080 },
    { label: "Story", w: 1080, h: 1920 },
    { label: "Paisagem", w: 1080, h: 566 },
    { label: "Retrato", w: 1080, h: 1350 },
  ]},
  { category: "Twitter/X", items: [
    { label: "Post", w: 1200, h: 628 },
    { label: "Header", w: 1500, h: 500 },
  ]},
  { category: "Facebook", items: [
    { label: "Post", w: 1200, h: 630 },
    { label: "Story", w: 1080, h: 1920 },
    { label: "Capa", w: 851, h: 315 },
  ]},
  { category: "LinkedIn", items: [
    { label: "Post", w: 1200, h: 627 },
    { label: "Banner", w: 1584, h: 396 },
  ]},
  { category: "TikTok", items: [
    { label: "Vídeo", w: 1080, h: 1920 },
    { label: "Feed", w: 1080, h: 1080 },
  ]},
  { category: "Impressão", items: [
    { label: "A4", w: 2480, h: 3508 },
    { label: "A5", w: 1748, h: 2480 },
    { label: "Cartão", w: 1050, h: 600 },
    { label: "Poster A3", w: 3508, h: 4961 },
  ]},
  { category: "Apresentação", items: [
    { label: "16:9 HD", w: 1920, h: 1080 },
    { label: "4:3", w: 1024, h: 768 },
  ]},
];

export function SmartResizePanel({ fabricCanvas }: SmartResizePanelProps) {
  const { template, setTemplate } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customW, setCustomW] = useState(1280);
  const [customH, setCustomH] = useState(720);
  const [keepContent, setKeepContent] = useState(true);

  const currentW = template?.width ?? 0;
  const currentH = template?.height ?? 0;

  const applyResize = useCallback((newW: number, newH: number, label: string) => {
    if (!fabricCanvas || !template) return;

    const scaleX = newW / currentW;
    const scaleY = newH / currentH;
    const scale = Math.min(scaleX, scaleY);

    if (keepContent) {
      // Scale and reposition all objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvas.getObjects().forEach((obj: any) => {
        const cx = (obj.left ?? 0) + (obj.getScaledWidth?.() ?? 0) / 2;
        const cy = (obj.top ?? 0) + (obj.getScaledHeight?.() ?? 0) / 2;
        obj.set({
          left: cx * scaleX - (obj.getScaledWidth?.() ?? 0) * scale / 2 / (obj.scaleX ?? 1) * (obj.scaleX ?? 1),
          top: cy * scaleY - (obj.getScaledHeight?.() ?? 0) * scale / 2 / (obj.scaleY ?? 1) * (obj.scaleY ?? 1),
          scaleX: (obj.scaleX ?? 1) * scale,
          scaleY: (obj.scaleY ?? 1) * scale,
        });
        obj.setCoords?.();
      });
    }

    // Update canvas size
    fabricCanvas.setWidth(newW);
    fabricCanvas.setHeight(newH);
    fabricCanvas.setZoom(1);
    fabricCanvas.requestRenderAll();

    // Update store
    setTemplate({ ...template, width: newW, height: newH });
    toast.success(`Redimensionado para ${label} (${newW}×${newH}px)`);
  }, [fabricCanvas, template, currentW, currentH, keepContent, setTemplate]);

  const filteredPresets = selectedCategory
    ? RESIZE_PRESETS.filter((p) => p.category === selectedCategory)
    : RESIZE_PRESETS;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Maximize2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Smart Resize</span>
      </div>

      {/* Current size */}
      {template && (
        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
          <span className="text-[11px] text-muted-foreground">Tamanho atual</span>
          <span className="text-[11px] font-medium tabular-nums">{currentW}×{currentH}px</span>
        </div>
      )}

      {/* Keep content toggle */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <div>
          <p className="text-[11px] font-medium">Escalar Conteúdo</p>
          <p className="text-[9px] text-muted-foreground">Reposiciona elementos proporcionalmente</p>
        </div>
        <button
          onClick={() => setKeepContent((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${keepContent ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${keepContent ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Filtrar por Plataforma</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-[9px] px-2 py-1 rounded border transition-colors ${selectedCategory === null ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            Todos
          </button>
          {RESIZE_PRESETS.map((p) => (
            <button
              key={p.category}
              onClick={() => setSelectedCategory(selectedCategory === p.category ? null : p.category)}
              className={`text-[9px] px-2 py-1 rounded border transition-colors ${selectedCategory === p.category ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {p.category}
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-3">
        {filteredPresets.map((group) => (
          <div key={group.category} className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">{group.category}</span>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isCurrent = currentW === item.w && currentH === item.h;
                return (
                  <button
                    key={item.label}
                    onClick={() => applyResize(item.w, item.h, `${group.category} ${item.label}`)}
                    disabled={isCurrent || !template}
                    className={`flex items-center justify-between px-3 py-2 rounded border transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/5 text-primary cursor-default"
                        : "border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-2">
                      {isCurrent && <Check className="w-3 h-3 text-primary" />}
                      <div className="flex flex-col items-start">
                        <span className="text-[11px] font-medium">{item.label}</span>
                        <span className="text-[9px] text-muted-foreground tabular-nums">{item.w}×{item.h}px</span>
                      </div>
                    </div>
                    {/* Aspect ratio visual */}
                    <div className="flex items-center justify-center" style={{ width: 28, height: 20 }}>
                      {(() => {
                        const maxW = 26, maxH = 18;
                        const ratio = item.w / item.h;
                        let rw = maxW, rh = maxH;
                        if (ratio > maxW / maxH) rh = Math.round(maxW / ratio);
                        else rw = Math.round(maxH * ratio);
                        return (
                          <div
                            className="border rounded-sm opacity-50"
                            style={{
                              width: rw,
                              height: rh,
                              borderColor: isCurrent ? "rgb(99,102,241)" : "rgb(100,116,139)",
                              background: isCurrent ? "rgba(99,102,241,0.15)" : "rgba(100,116,139,0.1)",
                            }}
                          />
                        );
                      })()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom size */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho Personalizado</span>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[9px] text-muted-foreground">Largura</span>
            <input
              type="number"
              value={customW}
              min={100}
              max={8000}
              onChange={(e) => setCustomW(Number(e.target.value))}
              className="w-full text-[11px] bg-background border border-border rounded px-2 py-1.5 tabular-nums"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[9px] text-muted-foreground">Altura</span>
            <input
              type="number"
              value={customH}
              min={100}
              max={8000}
              onChange={(e) => setCustomH(Number(e.target.value))}
              className="w-full text-[11px] bg-background border border-border rounded px-2 py-1.5 tabular-nums"
            />
          </div>
        </div>
        <button
          onClick={() => applyResize(customW, customH, "Personalizado")}
          disabled={!template}
          className="flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
        >
          Aplicar {customW}×{customH}px
        </button>
      </div>
    </div>
  );
}
