"use client";

import { useCallback, useRef, useState } from "react";
import { QrCode, Plus } from "lucide-react";
import { toast } from "sonner";

interface QRCodePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const PRESETS = [
  { label: "URL", placeholder: "https://exemplo.com" },
  { label: "WhatsApp", placeholder: "https://wa.me/5511999999999" },
  { label: "Email", placeholder: "mailto:contato@email.com" },
  { label: "Texto", placeholder: "Qualquer texto aqui..." },
];

export function QRCodePanel({ fabricCanvas }: QRCodePanelProps) {
  const [text, setText] = useState("");
  const [size, setSize] = useState(200);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const generatePreview = useCallback(async (value: string) => {
    if (!value.trim() || !previewRef.current) return;
    const QRCode = (await import("qrcode")).default;
    await QRCode.toCanvas(previewRef.current, value, {
      width: 160,
      color: { dark: fgColor, light: bgColor },
      margin: 1,
    });
  }, [fgColor, bgColor]);

  const addToCanvas = useCallback(async () => {
    if (!fabricCanvas || !text.trim()) {
      toast.error("Digite o conteúdo do QR Code");
      return;
    }
    setLoading(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const offscreen = document.createElement("canvas");
      await QRCode.toCanvas(offscreen, text.trim(), {
        width: size,
        color: { dark: fgColor, light: bgColor },
        margin: 2,
      });
      const dataURL = offscreen.toDataURL("image/png");

      const fabric = await import("fabric").then((m) => m.fabric);
      fabric.Image.fromURL(dataURL, (img) => {
        if (!img) { toast.error("Erro ao criar QR Code"); return; }
        img.set({ left: 60, top: 60, selectable: true });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.requestRenderAll();
        toast.success("QR Code adicionado ao canvas");
      });
    } catch {
      toast.error("Erro ao gerar QR Code");
    } finally {
      setLoading(false);
    }
  }, [fabricCanvas, text, size, fgColor, bgColor]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <QrCode className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">QR Code</span>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setText(p.placeholder)}
            className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:border-primary/50 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Content input */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Conteúdo</label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            generatePreview(e.target.value);
          }}
          placeholder="URL, texto, link de WhatsApp..."
          rows={3}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 resize-none"
        />
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho</label>
          <span className="text-[10px] text-foreground tabular-nums">{size}px</span>
        </div>
        <input
          type="range"
          min={100}
          max={600}
          step={50}
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Colors */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor QR</label>
          <div className="flex items-center gap-1.5">
            <div className="relative w-7 h-7">
              <div className="w-7 h-7 rounded border border-border" style={{ backgroundColor: fgColor }} />
              <input type="color" value={fgColor} onChange={(e) => { setFgColor(e.target.value); generatePreview(text); }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{fgColor}</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fundo</label>
          <div className="flex items-center gap-1.5">
            <div className="relative w-7 h-7">
              <div className="w-7 h-7 rounded border border-border" style={{ backgroundColor: bgColor }} />
              <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); generatePreview(text); }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{bgColor}</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      {text.trim() && (
        <div className="flex justify-center">
          <canvas ref={previewRef} width={160} height={160} className="rounded border border-border" />
        </div>
      )}

      {/* Add button */}
      <button
        onClick={addToCanvas}
        disabled={loading || !text.trim()}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {loading ? "Gerando..." : "Adicionar ao Canvas"}
      </button>
    </div>
  );
}
