"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, ImagePlus, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CanvasDragDropUploadPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface UploadedItem {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
}

export function CanvasDragDropUploadPanel({ fabricCanvas, selectionVersion: _sv }: CanvasDragDropUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [inserting, setInserting] = useState<string | null>(null);
  const [autoInsert, setAutoInsert] = useState(true);
  const [maxDimension, setMaxDimension] = useState(600);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFilesRef = useRef<any>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // Global canvas drag-and-drop (files dropped anywhere on the window)
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.dataTransfer?.files.length) return;
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
      if (!files.length) return;
      const canvasEl = document.querySelector("canvas");
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;
      handleFilesRef.current?.(files, { x: dropX, y: dropY });
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const loadImageToCanvas = useCallback((
    url: string,
    name: string,
    position?: { x: number; y: number }
  ) => {
    const cv = canvasRef.current;
    if (!cv) return;

    setInserting(name);

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      f.Image.fromURL(url, (img: Record<string, unknown> & { scaleToWidth: (w: number) => void; scaleToHeight: (h: number) => void; set: (props: Record<string, unknown>) => void; setCoords: () => void; getScaledWidth: () => number; getScaledHeight: () => number }) => {
        const w = Number(img.width ?? 0);
        const h = Number(img.height ?? 0);
        const cw = cv.getWidth();
        const ch = cv.getHeight();

        if (w > maxDimension || h > maxDimension) {
          if (w > h) img.scaleToWidth(Math.min(maxDimension, cw * 0.8));
          else img.scaleToHeight(Math.min(maxDimension, ch * 0.8));
        }

        const scaledW = img.getScaledWidth();
        const scaledH = img.getScaledHeight();

        if (position) {
          img.set({ left: position.x - scaledW / 2, top: position.y - scaledH / 2 });
        } else {
          img.set({ left: (cw - scaledW) / 2, top: (ch - scaledH) / 2 });
        }

        img.setCoords();
        cv.add(img);
        cv.setActiveObject(img);
        cv.requestRenderAll();
        setInserting(null);
        toast.success(`"${name}" inserida no canvas`);
      }, { crossOrigin: "anonymous" });
    });
  }, [maxDimension]);

  const handleFiles = useCallback((files: File[], position?: { x: number; y: number }) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (!url) return;

        const img = new Image();
        img.onload = () => {
          const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const item: UploadedItem = { id, name: file.name, url, width: img.width, height: img.height };
          setItems(prev => [item, ...prev.slice(0, 19)]);

          if (autoInsert) {
            loadImageToCanvas(url, file.name, position);
          }
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  }, [autoInsert, loadImageToCanvas]);

  useEffect(() => {
    handleFilesRef.current = handleFiles;
  }, [handleFiles]);

  const onPanelDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onPanelDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onPanelDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    handleFiles(files);
  }, [handleFiles]);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith("image/"));
    handleFiles(files);
    if (e.target) e.target.value = "";
  }, [handleFiles]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const insertFromLibrary = useCallback((item: UploadedItem) => {
    loadImageToCanvas(item.url, item.name);
  }, [loadImageToCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Upload / Drag & Drop</span>
      </div>

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        onDragOver={onPanelDragOver}
        onDragLeave={onPanelDragLeave}
        onDrop={onPanelDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center gap-2 py-6 rounded border-2 border-dashed cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/10"}`}
      >
        <ImagePlus className="w-8 h-8 opacity-60" />
        <p className="text-[9px] text-center">
          {isDragging ? "Solte as imagens aqui" : "Arraste imagens aqui ou clique para selecionar"}
        </p>
        <p className="text-[7px] opacity-50">PNG, JPG, GIF, WebP, SVG</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileInput}
      />

      {/* Options */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={autoInsert} onChange={e => setAutoInsert(e.target.checked)}
            className="accent-primary w-3 h-3" />
          <span className="text-[8px] text-foreground/70">Inserir automaticamente no canvas</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Tamanho máx.</span>
          <input type="number" min={100} max={2000} step={100} value={maxDimension}
            onChange={e => setMaxDimension(Number(e.target.value))}
            className="w-20 bg-muted/50 border border-border rounded px-2 py-0.5 text-[9px] focus:outline-none focus:border-primary" />
          <span className="text-[8px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* Global drop hint */}
      <div className="p-2 rounded border border-primary/20 bg-primary/5">
        <p className="text-[8px] text-primary/80 text-center">
          Arraste imagens diretamente sobre o canvas para inserir na posição exata do cursor
        </p>
      </div>

      {/* Library */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Imagens recentes ({items.length})</span>
            <button onClick={() => setItems([])} className="text-[7px] text-muted-foreground hover:text-destructive">
              Limpar tudo
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
            {items.map(item => (
              <div key={item.id} className="relative group rounded overflow-hidden border border-border aspect-square bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.name}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => insertFromLibrary(item)} />
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
                {inserting === item.name && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <CheckCircle2 className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[7px] text-muted-foreground/50 text-center">Clique para reinserir no canvas</p>
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Arraste sobre o canvas → posiciona onde soltou
      </p>
    </div>
  );
}
