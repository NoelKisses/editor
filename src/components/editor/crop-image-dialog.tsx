"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

interface CropImageDialogProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imageObject: any;
}

const ASPECT_PRESETS = [
  { label: "Livre", value: null },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
];

type HandleType = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

interface CropRect { x: number; y: number; w: number; h: number }
interface DragStart { mx: number; my: number; x: number; y: number; w: number; h: number }

const PREVIEW_W = 640;
const PREVIEW_H = 400;

export function CropImageDialog({
  open,
  onClose,
  fabricCanvas,
  imageObject,
}: CropImageDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const cropRef = useRef<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const dragging = useRef<HandleType | null>(null);
  const dragStart = useRef<DragStart>({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });
  const scaleRef = useRef({ sx: 1, sy: 1, ox: 0, oy: 0 });

  const draw = useCallback(() => {
    const ctx = previewCtxRef.current;
    const img = imgRef.current;
    if (!ctx || !img) return;

    const { sx, sy, ox, oy } = scaleRef.current;
    const { x, y, w, h } = cropRef.current;

    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.drawImage(img, ox, oy, img.naturalWidth * sx, img.naturalHeight * sy);

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(ox, oy, img.naturalWidth * sx, img.naturalHeight * sy);

    const cx = ox + x * sx;
    const cy = oy + y * sy;
    const cw = w * sx;
    const ch = h * sy;
    ctx.clearRect(cx, cy, cw, ch);
    ctx.drawImage(img, x, y, w, h, cx, cy, cw, ch);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 0.8;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(cx + (cw * i) / 3, cy); ctx.lineTo(cx + (cw * i) / 3, cy + ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + (ch * i) / 3); ctx.lineTo(cx + cw, cy + (ch * i) / 3); ctx.stroke();
    }

    const hs = 8;
    ctx.fillStyle = "#fff";
    [
      [cx, cy], [cx + cw, cy], [cx, cy + ch], [cx + cw, cy + ch],
      [cx + cw / 2, cy], [cx + cw / 2, cy + ch],
      [cx, cy + ch / 2], [cx + cw, cy + ch / 2],
    ].forEach(([hx, hy]) => ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs));
  }, []);

  useEffect(() => {
    if (!open || !imageObject) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    previewCtxRef.current = canvas.getContext("2d");

    const src: string = imageObject._element?.src || imageObject.getSrc?.() || "";
    if (!src) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const s = Math.min(PREVIEW_W / iw, PREVIEW_H / ih) * 0.9;
      const ox = (PREVIEW_W - iw * s) / 2;
      const oy = (PREVIEW_H - ih * s) / 2;
      scaleRef.current = { sx: s, sy: s, ox, oy };
      cropRef.current = { x: 0, y: 0, w: iw, h: ih };
      draw();
    };
    img.src = src;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageObject]);

  useEffect(() => {
    if (!imgRef.current || aspectRatio === null) return;
    const img = imgRef.current;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    let cw: number, ch: number;
    if (aspectRatio > iw / ih) {
      cw = iw; ch = iw / aspectRatio;
    } else {
      ch = ih; cw = ih * aspectRatio;
    }
    cropRef.current = { x: (iw - cw) / 2, y: (ih - ch) / 2, w: cw, h: ch };
    draw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio]);

  const hitHandle = (mx: number, my: number): HandleType | null => {
    const { sx, sy, ox, oy } = scaleRef.current;
    const { x, y, w, h } = cropRef.current;
    const cx = ox + x * sx, cy = oy + y * sy;
    const cw = w * sx, ch = h * sy;
    const hs = 10;
    const near = (px: number, py: number) => Math.abs(mx - px) < hs && Math.abs(my - py) < hs;
    if (near(cx, cy)) return "nw";
    if (near(cx + cw, cy)) return "ne";
    if (near(cx, cy + ch)) return "sw";
    if (near(cx + cw, cy + ch)) return "se";
    if (near(cx + cw / 2, cy)) return "n";
    if (near(cx + cw / 2, cy + ch)) return "s";
    if (near(cx, cy + ch / 2)) return "w";
    if (near(cx + cw, cy + ch / 2)) return "e";
    if (mx > cx && mx < cx + cw && my > cy && my < cy + ch) return "move";
    return null;
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitHandle(mx, my);
    if (!hit) return;
    dragging.current = hit;
    const { x, y, w, h } = cropRef.current;
    dragStart.current = { mx, my, x, y, w, h };
  };

  const constrainCrop = (x: number, y: number, w: number, h: number): CropRect => {
    const img = imgRef.current!;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    w = Math.max(20, w); h = Math.max(20, h);
    x = Math.max(0, Math.min(x, iw - w));
    y = Math.max(0, Math.min(y, ih - h));
    w = Math.min(w, iw - x); h = Math.min(h, ih - y);
    return { x, y, w, h };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const hit = hitHandle(e.clientX - rect.left, e.clientY - rect.top);
      const cursors: Record<HandleType, string> = {
        nw: "nw-resize", ne: "ne-resize", sw: "sw-resize", se: "se-resize",
        n: "n-resize", s: "s-resize", e: "e-resize", w: "w-resize", move: "move",
      };
      canvasRef.current!.style.cursor = hit ? cursors[hit] : "default";
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { sx, sy } = scaleRef.current;
    const dx = (mx - dragStart.current.mx) / sx;
    const dy = (my - dragStart.current.my) / sy;
    const { x: ox, y: oy, w: ow, h: oh } = dragStart.current;

    let x = ox, y = oy, w = ow, h = oh;

    switch (dragging.current) {
      case "move": x = ox + dx; y = oy + dy; break;
      case "se":   w = ow + dx; h = aspectRatio ? w / aspectRatio : oh + dy; break;
      case "sw":   x = ox + dx; w = ow - dx; h = aspectRatio ? w / aspectRatio : oh + dy; break;
      case "ne":   y = oy + dy; w = ow + dx; h = aspectRatio ? w / aspectRatio : oh - dy; break;
      case "nw":   x = ox + dx; y = oy + dy; w = ow - dx; h = aspectRatio ? w / aspectRatio : oh - dy; break;
      case "e":    w = ow + dx; break;
      case "w":    x = ox + dx; w = ow - dx; break;
      case "s":    h = oh + dy; break;
      case "n":    y = oy + dy; h = oh - dy; break;
    }

    cropRef.current = constrainCrop(x, y, w, h);
    draw();
  };

  const onMouseUp = () => { dragging.current = null; };

  const handleConfirm = useCallback(() => {
    if (!fabricCanvas || !imageObject || !imgRef.current) return;
    const { x, y, w, h } = cropRef.current;
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.round(w);
    offscreen.height = Math.round(h);
    offscreen.getContext("2d")!.drawImage(imgRef.current, x, y, w, h, 0, 0, w, h);
    const croppedSrc = offscreen.toDataURL("image/png");

    import("fabric").then(({ fabric }) => {
      fabric.Image.fromURL(croppedSrc, (newImg) => {
        const origLeft: number = imageObject.left ?? 0;
        const origTop: number = imageObject.top ?? 0;
        const origScaleX: number = imageObject.scaleX ?? 1;
        const origScaleY: number = imageObject.scaleY ?? 1;
        const origWidth: number = imageObject.width ?? w;
        const origHeight: number = imageObject.height ?? h;

        newImg.set({
          left: origLeft,
          top: origTop,
          scaleX: (origWidth * origScaleX) / w,
          scaleY: (origHeight * origScaleY) / h,
          selectable: true,
          evented: true,
        });

        fabricCanvas.remove(imageObject);
        fabricCanvas.add(newImg);
        fabricCanvas.setActiveObject(newImg);
        fabricCanvas.requestRenderAll();
        toast.success("Imagem recortada com sucesso!");
        onClose();
      });
    });
  }, [fabricCanvas, imageObject, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[700px] bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">Recortar Imagem</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          {ASPECT_PRESETS.map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant={aspectRatio === p.value ? "default" : "outline"}
              className="text-xs h-7 px-2.5"
              onClick={() => setAspectRatio(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            className="rounded bg-zinc-800 max-w-full"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="gap-1.5">
            <X className="w-4 h-4" />
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-1.5">
            <Check className="w-4 h-4" />
            Aplicar Recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
