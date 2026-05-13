"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Upload, Link, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ImagePlaceholderPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const STOCK_PLACEHOLDERS = [
  { label: "Paisagem", url: "https://picsum.photos/seed/landscape/800/450" },
  { label: "Retrato", url: "https://picsum.photos/seed/portrait/450/800" },
  { label: "Quadrado", url: "https://picsum.photos/seed/square/600/600" },
  { label: "Banner", url: "https://picsum.photos/seed/banner/1200/300" },
];

export function ImagePlaceholderPanel({ fabricCanvas, selectionVersion }: ImagePlaceholderPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      const obj = fabricCanvas.getActiveObject();
      setHasImage(obj?.type === "image");
    });
  }, [fabricCanvas, selectionVersion]);

  const replaceImage = useCallback((src: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj || obj.type !== "image") { toast.error("Selecione uma imagem"); return; }
    setLoading(true);
    const prevW = obj.width * obj.scaleX;
    const prevH = obj.height * obj.scaleY;
    const prevLeft = obj.left;
    const prevTop = obj.top;

    import("fabric").then((m) => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fabric.Image as any).fromURL(src, (img: any) => {
        if (!img) { toast.error("Não foi possível carregar a imagem"); setLoading(false); return; }
        img.set({
          left: prevLeft,
          top: prevTop,
          scaleX: prevW / img.width,
          scaleY: prevH / img.height,
        });
        fabricCanvas.remove(obj);
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.requestRenderAll();
        setLoading(false);
        toast.success("Imagem substituída");
      }, { crossOrigin: "anonymous" });
    });
  }, [fabricCanvas]);

  const handleUrl = useCallback(() => {
    const url = urlInput.trim();
    if (!url) { toast.error("Insira uma URL válida"); return; }
    replaceImage(url);
    setUrlInput("");
  }, [urlInput, replaceImage]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (src) replaceImage(src);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [replaceImage]);

  const addPlaceholder = useCallback((url: string) => {
    if (!fabricCanvas) return;
    setLoading(true);
    import("fabric").then((m) => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fabric.Image as any).fromURL(url, (img: any) => {
        if (!img) { setLoading(false); return; }
        const cw = fabricCanvas.width ?? 800;
        const ch = fabricCanvas.height ?? 600;
        const scale = Math.min((cw * 0.6) / img.width, (ch * 0.6) / img.height);
        img.set({
          left: cw / 2,
          top: ch / 2,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.requestRenderAll();
        setLoading(false);
        toast.success("Placeholder adicionado");
      }, { crossOrigin: "anonymous" });
    });
  }, [fabricCanvas]);

  const removeSelected = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    fabricCanvas.remove(obj);
    fabricCanvas.requestRenderAll();
    setHasImage(false);
    toast.success("Imagem removida");
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <ImagePlus className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Placeholder de Imagem</span>
      </div>

      {/* Replace selected image */}
      {hasImage && (
        <div className="flex flex-col gap-2 p-2 rounded border border-primary/30 bg-primary/5">
          <span className="text-[10px] text-primary font-medium">Substituir imagem selecionada</span>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
          >
            <Upload className="w-3 h-3" /> Enviar arquivo
          </button>

          <div className="flex gap-1">
            <input
              type="text"
              placeholder="URL da imagem..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleUrl(); }}
              className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleUrl}
              disabled={loading}
              className="px-2 py-1 rounded border border-primary text-primary text-[9px] hover:bg-primary/10 transition-colors disabled:opacity-40"
            >
              <Link className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={removeSelected}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded border border-destructive/30 text-destructive/70 text-[10px] hover:border-destructive hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Remover imagem
          </button>
        </div>
      )}

      {/* Stock placeholders */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Adicionar placeholder
        </span>
        <div className="grid grid-cols-2 gap-1">
          {STOCK_PLACEHOLDERS.map(p => (
            <button
              key={p.label}
              onClick={() => addPlaceholder(p.url)}
              disabled={loading}
              className="flex items-center justify-center gap-1 py-2 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
            >
              <ImagePlus className="w-3 h-3" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom placeholder */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">URL personalizada</span>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="https://..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleUrl(); }}
            className="flex-1 bg-muted/50 border border-border rounded px-2 py-1.5 text-[9px] focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleUrl}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1.5 rounded border border-primary text-primary text-[9px] hover:bg-primary/10 transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-2">
          <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          <span className="ml-2 text-[10px] text-muted-foreground">Carregando...</span>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Selecione uma imagem no canvas para substituí-la
      </p>
    </div>
  );
}
