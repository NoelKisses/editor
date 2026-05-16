"use client";

import { useEffect, useRef, useState } from "react";
import { Images } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasGalleryCollagePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type LayoutStyle =
  | "grid2x2"
  | "grid3x3"
  | "pinterest"
  | "polaroid"
  | "stripH"
  | "stripV";

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

function computeGridLayout(
  count: number,
  cols: number,
  w: number,
  h: number,
  gap: number,
): Cell[] {
  if (count <= 0) return [];
  const rows = Math.ceil(count / cols);
  const cellW = (w - gap * (cols + 1)) / cols;
  const cellH = (h - gap * (rows + 1)) / rows;
  const cells: Cell[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    cells.push({
      x: gap + c * (cellW + gap),
      y: gap + r * (cellH + gap),
      w: cellW,
      h: cellH,
    });
  }
  return cells;
}

function computeMasonryLayout(
  count: number,
  cols: number,
  w: number,
  h: number,
  gap: number,
): Cell[] {
  if (count <= 0) return [];
  const colW = (w - gap * (cols + 1)) / cols;
  const colHeights: number[] = Array(cols).fill(gap);
  const cells: Cell[] = [];
  for (let i = 0; i < count; i++) {
    // pick shortest column
    let shortest = 0;
    for (let c = 1; c < cols; c++) {
      if (colHeights[c] < colHeights[shortest]) shortest = c;
    }
    // varied heights for pinterest look
    const ratio = 0.7 + ((i * 37) % 60) / 100; // pseudo random 0.7..1.3
    const cellH = colW * ratio;
    cells.push({
      x: gap + shortest * (colW + gap),
      y: colHeights[shortest],
      w: colW,
      h: cellH,
    });
    colHeights[shortest] += cellH + gap;
  }
  // scale vertically to fit canvas if overflowing
  const maxBottom = Math.max(...colHeights);
  if (maxBottom > h) {
    const scale = h / maxBottom;
    cells.forEach((cell) => {
      cell.y *= scale;
      cell.h *= scale;
    });
  }
  return cells;
}

function computePolaroidLayout(count: number, w: number, h: number): Cell[] {
  if (count <= 0) return [];
  const cells: Cell[] = [];
  const size = Math.min(w, h) * 0.35;
  const centerX = w / 2;
  const centerY = h / 2;
  const spread = Math.min(w, h) * 0.25;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = spread * (0.4 + ((i * 53) % 60) / 100);
    const x = centerX + Math.cos(angle) * radius - size / 2;
    const y = centerY + Math.sin(angle) * radius - size / 2;
    const rotation = (((i * 47) % 30) - 15);
    cells.push({ x, y, w: size, h: size, rotation });
  }
  return cells;
}

function getLayoutCells(
  style: LayoutStyle,
  count: number,
  w: number,
  h: number,
  gap: number,
): Cell[] {
  switch (style) {
    case "grid2x2":
      return computeGridLayout(Math.min(count, 4), 2, w, h, gap);
    case "grid3x3":
      return computeGridLayout(Math.min(count, 9), 3, w, h, gap);
    case "pinterest":
      return computeMasonryLayout(count, 3, w, h, gap);
    case "polaroid":
      return computePolaroidLayout(count, w, h);
    case "stripH":
      return computeGridLayout(count, count, w, h, gap);
    case "stripV":
      return computeGridLayout(count, 1, w, h, gap);
    default:
      return [];
  }
}

export function CanvasGalleryCollagePanel({
  fabricCanvas,
}: CanvasGalleryCollagePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [style, setStyle] = useState<LayoutStyle>("grid2x2");
  const [gap, setGap] = useState<number>(12);
  const [borderWidth, setBorderWidth] = useState<number>(4);
  const [borderColor, setBorderColor] = useState<string>("#ffffff");
  const [cornerRadius, setCornerRadius] = useState<number>(0);
  const [randomRotation, setRandomRotation] = useState<boolean>(false);
  const [shadow, setShadow] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSelectedImages = (canvas: any): any[] => {
    const active = canvas.getActiveObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fromActive = active.filter((o: any) => o.type === "image");
    if (fromActive.length > 0) return fromActive;
    // fallback: all images in canvas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return canvas.getObjects().filter((o: any) => o.type === "image");
  };

  const applyCollage = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const images = getSelectedImages(canvas);
    if (images.length === 0) {
      toast.error("Selecione pelo menos uma imagem");
      return;
    }

    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const cells = getLayoutCells(style, images.length, w, h, gap);

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;

      images.forEach((img, i) => {
        if (i >= cells.length) return;
        const cell = cells[i];

        const imgW = img.width || 1;
        const imgH = img.height || 1;
        const scale = Math.min(cell.w / imgW, cell.h / imgH);

        img.set({
          left: cell.x + cell.w / 2,
          top: cell.y + cell.h / 2,
          originX: "center",
          originY: "center",
          scaleX: scale,
          scaleY: scale,
        });

        // rotation
        let rot = 0;
        if (style === "polaroid" && cell.rotation !== undefined) {
          rot = cell.rotation;
        } else if (randomRotation) {
          rot = Math.random() * 30 - 15;
        }
        img.set("angle", rot);

        // corner radius via clipPath
        if (cornerRadius > 0) {
          const clip = new f.Rect({
            width: imgW,
            height: imgH,
            rx: cornerRadius / scale,
            ry: cornerRadius / scale,
            originX: "center",
            originY: "center",
          });
          img.clipPath = clip;
        } else {
          img.clipPath = undefined;
        }

        // border
        if (borderWidth > 0) {
          img.set({
            stroke: borderColor,
            strokeWidth: borderWidth / scale,
            strokeUniform: false,
          });
        } else {
          img.set({ stroke: null, strokeWidth: 0 });
        }

        // shadow
        if (shadow) {
          img.set(
            "shadow",
            new f.Shadow({
              color: "rgba(0,0,0,0.4)",
              blur: 15,
              offsetX: 4,
              offsetY: 6,
            }),
          );
        } else {
          img.set("shadow", null);
        }

        // tag
        img.data = { ...(img.data || {}), collageImage: true };
        img.setCoords();
      });

      canvas.discardActiveObject();
      canvas.requestRenderAll();
      toast.success(`Colagem aplicada (${images.length} imagens)`);
    }).catch(() => {
      toast.error("Erro ao carregar fabric");
    });
  };

  const clearCollage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = canvas.getObjects().filter((o: any) => o.type === "image");
    let count = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images.forEach((img: any) => {
      if (img.data?.collageImage) {
        const newData = { ...img.data };
        delete newData.collageImage;
        img.data = newData;
        count++;
      }
    });
    canvas.requestRenderAll();
    toast.success(`${count} tags de colagem removidas`);
  };

  const resetPositions = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const images = getSelectedImages(canvas);
    if (images.length === 0) {
      toast.error("Nenhuma imagem para resetar");
      return;
    }
    const cx = canvas.getWidth() / 2;
    const cy = canvas.getHeight() / 2;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images.forEach((img: any) => {
      img.set({
        left: cx,
        top: cy,
        originX: "center",
        originY: "center",
        angle: 0,
      });
      img.setCoords();
    });
    canvas.requestRenderAll();
    toast.success("Posições resetadas");
  };

  const layouts: Array<{ id: LayoutStyle; label: string }> = [
    { id: "grid2x2", label: "Grade 2x2" },
    { id: "grid3x3", label: "Grade 3x3" },
    { id: "pinterest", label: "Pinterest" },
    { id: "polaroid", label: "Polaroid Pile" },
    { id: "stripH", label: "Faixa Horizontal" },
    { id: "stripV", label: "Faixa Vertical" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Images className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Galeria / Colagem Auto</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium">Layout</span>
        <div className="grid grid-cols-2 gap-2">
          {layouts.map((l) => (
            <Button
              key={l.id}
              type="button"
              size="sm"
              variant={style === l.id ? "default" : "outline"}
              onClick={() => setStyle(l.id)}
            >
              {l.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">Espaçamento: {gap}px</span>
        <input
          type="range"
          min={4}
          max={40}
          value={gap}
          onChange={(e) => setGap(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">
          Borda: {borderWidth}px
        </span>
        <input
          type="range"
          min={0}
          max={15}
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">Cor da borda</span>
        <Input
          type="color"
          value={borderColor}
          onChange={(e) => setBorderColor(e.target.value)}
          className="h-8 w-16 p-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">
          Raio dos cantos: {cornerRadius}px
        </span>
        <input
          type="range"
          min={0}
          max={24}
          value={cornerRadius}
          onChange={(e) => setCornerRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={randomRotation}
          onChange={(e) => setRandomRotation(e.target.checked)}
        />
        <span>Rotação aleatória (±15°)</span>
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={shadow}
          onChange={(e) => setShadow(e.target.checked)}
        />
        <span>Sombra</span>
      </label>

      <div className="flex flex-col gap-2">
        <Button type="button" size="sm" onClick={applyCollage}>
          Aplicar Colagem
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={clearCollage}
        >
          Limpar Colagem
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={resetPositions}
        >
          Resetar Posições
        </Button>
      </div>
    </div>
  );
}
