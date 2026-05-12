"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editor-store";

interface ResizeCanvasDialogProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const PRESETS = [
  { label: "YouTube Thumbnail", w: 1280, h: 720, icon: "▶" },
  { label: "Instagram Post", w: 1080, h: 1080, icon: "⬛" },
  { label: "Instagram Story", w: 1080, h: 1920, icon: "▮" },
  { label: "Twitter/X Post", w: 1200, h: 675, icon: "𝕏" },
  { label: "Facebook Post", w: 1200, h: 630, icon: "f" },
  { label: "LinkedIn Banner", w: 1584, h: 396, icon: "in" },
  { label: "Pinterest Pin", w: 1000, h: 1500, icon: "P" },
  { label: "Quadrado", w: 800, h: 800, icon: "□" },
  { label: "Paisagem 16:9", w: 1920, h: 1080, icon: "◻" },
  { label: "Retrato 9:16", w: 1080, h: 1920, icon: "▯" },
  { label: "A4 Horizontal", w: 1123, h: 794, icon: "A" },
  { label: "Personalizado", w: 0, h: 0, icon: "✎" },
];

type ScaleMode = "fit" | "fill" | "stretch" | "keep";

export function ResizeCanvasDialog({ open, onClose, fabricCanvas }: ResizeCanvasDialogProps) {
  const { template, setTemplate } = useEditorStore();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customW, setCustomW] = useState(String(template?.width ?? 1280));
  const [customH, setCustomH] = useState(String(template?.height ?? 720));
  const [scaleMode, setScaleMode] = useState<ScaleMode>("fit");

  const currentW = template?.width ?? 1280;
  const currentH = template?.height ?? 720;

  const getTargetSize = (): { w: number; h: number } => {
    if (selectedPreset === "Personalizado") {
      return { w: parseInt(customW) || currentW, h: parseInt(customH) || currentH };
    }
    const preset = PRESETS.find((p) => p.label === selectedPreset);
    if (preset && preset.w > 0) return { w: preset.w, h: preset.h };
    return { w: currentW, h: currentH };
  };

  const handleApply = useCallback(async () => {
    if (!fabricCanvas || !template) return;
    const { w: newW, h: newH } = getTargetSize();
    if (newW < 100 || newH < 100 || newW > 8000 || newH > 8000) {
      toast.error("Dimensões inválidas (100–8000px)");
      return;
    }

    const scaleX = newW / currentW;
    const scaleY = newH / currentH;

    // Reposition/rescale all objects
    fabricCanvas.getObjects().forEach((obj: {
      left?: number; top?: number;
      scaleX?: number; scaleY?: number;
      width?: number; height?: number;
      set: (props: Record<string, number>) => void;
    }) => {
      const ox = obj.left ?? 0;
      const oy = obj.top ?? 0;
      const osx = obj.scaleX ?? 1;
      const osy = obj.scaleY ?? 1;

      if (scaleMode === "fit") {
        const s = Math.min(scaleX, scaleY);
        const offsetX = (newW - currentW * s) / 2;
        const offsetY = (newH - currentH * s) / 2;
        obj.set({ left: ox * s + offsetX, top: oy * s + offsetY, scaleX: osx * s, scaleY: osy * s });
      } else if (scaleMode === "fill") {
        const s = Math.max(scaleX, scaleY);
        obj.set({ left: ox * s, top: oy * s, scaleX: osx * s, scaleY: osy * s });
      } else if (scaleMode === "stretch") {
        obj.set({ left: ox * scaleX, top: oy * scaleY, scaleX: osx * scaleX, scaleY: osy * scaleY });
      }
      // "keep" mode: objects stay at original position/scale
    });

    // Update canvas size
    fabricCanvas.setWidth(newW);
    fabricCanvas.setHeight(newH);
    fabricCanvas.setBackgroundColor(template.backgroundColor, () => {
      fabricCanvas.requestRenderAll();
    });

    // Update store template
    setTemplate({ ...template, width: newW, height: newH });
    toast.success(`Canvas redimensionado para ${newW}×${newH}px`);
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, template, selectedPreset, customW, customH, scaleMode]);

  const { w: previewW, h: previewH } = getTargetSize();
  const maxPreview = 120;
  const previewScale = Math.min(maxPreview / previewW, maxPreview / previewH, 1);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[600px] bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">Redimensionar Canvas</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          {/* Left: presets */}
          <div className="flex flex-col gap-1 w-48 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Formatos</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setSelectedPreset(p.label);
                  if (p.w > 0) { setCustomW(String(p.w)); setCustomH(String(p.h)); }
                }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                  selectedPreset === p.label
                    ? "bg-primary/20 border border-primary/50 text-white"
                    : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className="w-5 text-center text-[11px] opacity-70">{p.icon}</span>
                <span className="flex-1">{p.label}</span>
                {p.w > 0 && <span className="text-[9px] text-zinc-500">{p.w}×{p.h}</span>}
              </button>
            ))}
          </div>

          {/* Right: controls */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Custom dimensions */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Dimensões</span>
              <div className="flex gap-2 items-center">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] text-zinc-400">Largura (px)</label>
                  <input
                    type="number"
                    value={customW}
                    onChange={(e) => { setCustomW(e.target.value); setSelectedPreset("Personalizado"); }}
                    className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-600 rounded text-white focus:outline-none focus:border-primary/60"
                  />
                </div>
                <span className="text-zinc-500 mt-4">×</span>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] text-zinc-400">Altura (px)</label>
                  <input
                    type="number"
                    value={customH}
                    onChange={(e) => { setCustomH(e.target.value); setSelectedPreset("Personalizado"); }}
                    className="w-full px-2 py-1.5 text-xs bg-zinc-800 border border-zinc-600 rounded text-white focus:outline-none focus:border-primary/60"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-500">
                Atual: {currentW}×{currentH}px
              </p>
            </div>

            {/* Scale mode */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Como reposicionar os elementos</span>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { id: "fit", label: "Ajustar", desc: "Cabe tudo, com margens" },
                  { id: "fill", label: "Preencher", desc: "Preenche, pode cortar" },
                  { id: "stretch", label: "Esticar", desc: "Estica para o novo tamanho" },
                  { id: "keep", label: "Manter", desc: "Posição original" },
                ] as { id: ScaleMode; label: string; desc: string }[]).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setScaleMode(m.id)}
                    className={`flex flex-col px-2 py-2 rounded border text-left transition-colors ${
                      scaleMode === m.id
                        ? "border-primary/60 bg-primary/10 text-white"
                        : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-xs font-medium">{m.label}</span>
                    <span className="text-[10px] opacity-70">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {previewW > 0 && previewH > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">Preview</span>
                <div className="flex items-center justify-center h-28 bg-zinc-800 rounded border border-zinc-700">
                  <div
                    className="bg-zinc-600 border border-zinc-500 flex items-center justify-center text-[9px] text-zinc-400"
                    style={{
                      width: previewW * previewScale,
                      height: previewH * previewScale,
                    }}
                  >
                    {previewW}×{previewH}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="gap-1.5 text-zinc-300">
            <X className="w-4 h-4" />
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!selectedPreset && customW === String(currentW) && customH === String(currentH)} className="gap-1.5">
            <Check className="w-4 h-4" />
            Aplicar Redimensionamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
