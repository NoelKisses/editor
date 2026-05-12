"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";

interface FramesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const FRAMES = [
  {
    id: "circle",
    label: "Círculo",
    svg: <svg viewBox="0 0 40 40" className="w-full h-full"><circle cx="20" cy="20" r="18" fill="currentColor" /></svg>,
    makeClip: async (fabric: typeof import("fabric")["fabric"], w: number, h: number) => {
      const r = Math.min(w, h) / 2;
      return new fabric.Circle({ radius: r, originX: "center", originY: "center" });
    },
  },
  {
    id: "rounded",
    label: "Arredondado",
    svg: <svg viewBox="0 0 40 30" className="w-full h-full"><rect x="2" y="2" width="36" height="26" rx="8" fill="currentColor" /></svg>,
    makeClip: async (fabric: typeof import("fabric")["fabric"], w: number, h: number) => {
      return new fabric.Rect({ width: w, height: h, rx: 20, ry: 20, originX: "center", originY: "center" });
    },
  },
  {
    id: "rect",
    label: "Retângulo",
    svg: <svg viewBox="0 0 40 30" className="w-full h-full"><rect x="2" y="2" width="36" height="26" fill="currentColor" /></svg>,
    makeClip: async (fabric: typeof import("fabric")["fabric"], w: number, h: number) => {
      return new fabric.Rect({ width: w, height: h, originX: "center", originY: "center" });
    },
  },
  {
    id: "triangle",
    label: "Triângulo",
    svg: <svg viewBox="0 0 40 40" className="w-full h-full"><polygon points="20,2 38,38 2,38" fill="currentColor" /></svg>,
    makeClip: async (fabric: typeof import("fabric")["fabric"], w: number, h: number) => {
      return new fabric.Triangle({ width: Math.min(w, h), height: Math.min(w, h), originX: "center", originY: "center" });
    },
  },
  {
    id: "diamond",
    label: "Diamante",
    svg: <svg viewBox="0 0 40 40" className="w-full h-full"><polygon points="20,2 38,20 20,38 2,20" fill="currentColor" /></svg>,
    makeClip: async (fabric: typeof import("fabric")["fabric"], w: number, h: number) => {
      const s = Math.min(w, h);
      const path = `M ${s / 2} 0 L ${s} ${s / 2} L ${s / 2} ${s} L 0 ${s / 2} Z`;
      return new fabric.Path(path, { originX: "center", originY: "center" });
    },
  },
  {
    id: "hexagon",
    label: "Hexágono",
    svg: <svg viewBox="0 0 40 40" className="w-full h-full"><polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="currentColor" /></svg>,
    makeClip: async (fabric: typeof import("fabric")["fabric"], w: number, h: number) => {
      const r = Math.min(w, h) / 2;
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 30);
        pts.push(`${r + r * Math.cos(a)},${r + r * Math.sin(a)}`);
      }
      return new fabric.Polygon(pts.map((p) => ({ x: parseFloat(p.split(",")[0]), y: parseFloat(p.split(",")[1]) })), {
        originX: "center",
        originY: "center",
      });
    },
  },
  {
    id: "star",
    label: "Estrela",
    svg: <svg viewBox="0 0 40 40" className="w-full h-full"><polygon points="20,2 24,15 38,15 27,24 31,38 20,30 9,38 13,24 2,15 16,15" fill="currentColor" /></svg>,
    makeClip: async (fabric: typeof import("fabric")["fabric"], w: number, h: number) => {
      const r = Math.min(w, h) / 2;
      const r2 = r * 0.45;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 180) * (36 * i - 90);
        const rad = i % 2 === 0 ? r : r2;
        pts.push({ x: r + rad * Math.cos(a), y: r + rad * Math.sin(a) });
      }
      return new fabric.Polygon(pts, { originX: "center", originY: "center" });
    },
  },
  {
    id: "heart",
    label: "Coração",
    svg: <svg viewBox="0 0 40 36" className="w-full h-full"><path d="M20 34 C20 34 4 22 4 13 C4 7.5 8 3 13.5 3 C16.5 3 19 4.5 20 6.5 C21 4.5 23.5 3 26.5 3 C32 3 36 7.5 36 13 C36 22 20 34 20 34Z" fill="currentColor" /></svg>,
    makeClip: async (fabric: typeof import("fabric")["fabric"], w: number, h: number) => {
      const s = Math.min(w, h);
      const scale = s / 40;
      const path = `M ${20 * scale} ${s * 0.85} C ${20 * scale} ${s * 0.85} ${4 * scale} ${22 * scale} ${4 * scale} ${13 * scale} C ${4 * scale} ${7.5 * scale} ${8 * scale} ${3 * scale} ${13.5 * scale} ${3 * scale} C ${16.5 * scale} ${3 * scale} ${19 * scale} ${4.5 * scale} ${20 * scale} ${6.5 * scale} C ${21 * scale} ${4.5 * scale} ${23.5 * scale} ${3 * scale} ${26.5 * scale} ${3 * scale} C ${32 * scale} ${3 * scale} ${36 * scale} ${7.5 * scale} ${36 * scale} ${13 * scale} C ${36 * scale} ${22 * scale} ${20 * scale} ${s * 0.85} ${20 * scale} ${s * 0.85} Z`;
      return new fabric.Path(path, { originX: "center", originY: "center" });
    },
  },
];

export function FramesPanel({ fabricCanvas }: FramesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFrameRef = useRef<(typeof FRAMES)[number] | null>(null);

  const applyFrame = useCallback(
    async (frame: (typeof FRAMES)[number], src: string) => {
      if (!fabricCanvas) return;
      const { fabric } = await import("fabric");

      fabric.Image.fromURL(src, async (img) => {
        const size = 220;
        const scaleX = size / (img.width || size);
        const scaleY = size / (img.height || size);
        const scale = Math.max(scaleX, scaleY);
        img.set({ scaleX: scale, scaleY: scale, originX: "center", originY: "center" });

        const clipShape = await frame.makeClip(fabric, size, size);
        img.clipPath = clipShape;

        img.set({ left: 150, top: 150, originX: "center", originY: "center" });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.requestRenderAll();
        toast.success(`Moldura "${frame.label}" aplicada`);
      });
    },
    [fabricCanvas]
  );

  const applyFrameToSelected = useCallback(
    async (frame: (typeof FRAMES)[number]) => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();

      if (obj && obj.type === "image") {
        const { fabric } = await import("fabric");
        const w: number = obj.getScaledWidth();
        const h: number = obj.getScaledHeight();
        const clipShape = await frame.makeClip(fabric, w, h);
        obj.clipPath = clipShape;
        fabricCanvas.requestRenderAll();
        toast.success(`Moldura "${frame.label}" aplicada`);
        return;
      }

      // No image selected — open file picker
      pendingFrameRef.current = frame;
      fileInputRef.current?.click();
    },
    [fabricCanvas]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const frame = pendingFrameRef.current;
      if (!file || !frame) return;

      const src = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });

      await applyFrame(frame, src);
      pendingFrameRef.current = null;
      e.target.value = "";
    },
    [applyFrame]
  );

  const removeFrame = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.clipPath = null;
    fabricCanvas.requestRenderAll();
    toast.success("Moldura removida");
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-3 pt-2 px-3 pb-3">
      <h3 className="text-sm font-semibold text-foreground">Molduras</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Clique numa moldura para aplicar à imagem selecionada, ou para escolher uma nova imagem.
      </p>

      <div className="grid grid-cols-4 gap-1.5">
        {FRAMES.map((frame) => (
          <button
            key={frame.id}
            onClick={() => applyFrameToSelected(frame)}
            className="flex flex-col items-center gap-1 p-2 rounded border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
            title={frame.label}
          >
            <div className="w-8 h-8">{frame.svg}</div>
            <span className="text-[9px]">{frame.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={removeFrame}
        className="text-xs text-muted-foreground hover:text-foreground text-center py-1 hover:bg-accent/40 rounded transition-colors"
      >
        Remover moldura
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
