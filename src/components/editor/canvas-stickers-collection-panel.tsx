"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasStickersCollectionPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type StickerType =
  | "heart"
  | "star"
  | "crown"
  | "diamond"
  | "lightning"
  | "sun"
  | "moon"
  | "cloud"
  | "leaf"
  | "palm"
  | "house"
  | "rocket";

interface StickerDef {
  type: StickerType;
  label: string;
  defaultColor: string;
  emoji: string;
}

const STICKER_DEFS: StickerDef[] = [
  { type: "heart", label: "Coração", defaultColor: "#ef4444", emoji: "♥" },
  { type: "star", label: "Estrela", defaultColor: "#facc15", emoji: "★" },
  { type: "crown", label: "Coroa", defaultColor: "#eab308", emoji: "♛" },
  { type: "diamond", label: "Diamante", defaultColor: "#22d3ee", emoji: "◆" },
  { type: "lightning", label: "Raio", defaultColor: "#fbbf24", emoji: "⚡" },
  { type: "sun", label: "Sol", defaultColor: "#f97316", emoji: "☀" },
  { type: "moon", label: "Lua", defaultColor: "#e2e8f0", emoji: "☾" },
  { type: "cloud", label: "Nuvem", defaultColor: "#f8fafc", emoji: "☁" },
  { type: "leaf", label: "Folha", defaultColor: "#22c55e", emoji: "🍃" },
  { type: "palm", label: "Coqueiro", defaultColor: "#16a34a", emoji: "🌴" },
  { type: "house", label: "Casa", defaultColor: "#a16207", emoji: "🏠" },
  { type: "rocket", label: "Foguete", defaultColor: "#ef4444", emoji: "🚀" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyStickerMeta(obj: any, type: StickerType) {
  obj.data = { sticker: true, type };
  obj.set({ originX: "center", originY: "center" });
  return obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHeartSticker(f: any, x: number, y: number, size: number, color: string) {
  const heartPath =
    "M 272.70141,238.71731 C 206.46141,238.71731 152.70146,292.4773 152.70146,358.71731 C 152.70146,493.47282 288.63461,528.80461 381.26391,662.02535 C 468.83815,529.62199 609.82641,489.17075 609.82641,358.71731 C 609.82641,292.47731 556.06641,238.7173 489.82641,238.71731 C 441.77641,238.71731 400.42641,267.08746 381.26391,307.90856 C 362.10141,267.08745 320.75141,238.7173 272.70141,238.71731 z";
  const path = new f.Path(heartPath, {
    fill: color,
    stroke: color,
    strokeWidth: 1,
    left: x,
    top: y,
  });
  const bound = path.getBoundingRect ? path.getBoundingRect() : { width: 460, height: 430 };
  const scale = size / Math.max(bound.width || 460, bound.height || 430);
  path.scale(scale);
  return applyStickerMeta(path, "heart");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStarSticker(f: any, x: number, y: number, size: number, color: string) {
  const points: { x: number; y: number }[] = [];
  const outer = size / 2;
  const inner = outer * 0.4;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    points.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
  }
  const poly = new f.Polygon(points, {
    left: x,
    top: y,
    fill: color,
    stroke: "#00000022",
    strokeWidth: 1,
  });
  return applyStickerMeta(poly, "star");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCrownSticker(f: any, x: number, y: number, size: number, color: string) {
  const w = size;
  const h = size * 0.7;
  const points = [
    { x: -w / 2, y: h / 2 },
    { x: -w / 2, y: -h / 4 },
    { x: -w / 4, y: h / 6 },
    { x: 0, y: -h / 2 },
    { x: w / 4, y: h / 6 },
    { x: w / 2, y: -h / 4 },
    { x: w / 2, y: h / 2 },
  ];
  const poly = new f.Polygon(points, {
    left: x,
    top: y,
    fill: color,
    stroke: "#92400e",
    strokeWidth: 2,
  });
  return applyStickerMeta(poly, "crown");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDiamondSticker(f: any, x: number, y: number, size: number, color: string) {
  const s = size / 2;
  const points = [
    { x: 0, y: -s },
    { x: s * 0.7, y: -s * 0.3 },
    { x: s * 0.5, y: s },
    { x: -s * 0.5, y: s },
    { x: -s * 0.7, y: -s * 0.3 },
  ];
  const poly = new f.Polygon(points, {
    left: x,
    top: y,
    fill: color,
    stroke: "#0891b2",
    strokeWidth: 1.5,
  });
  return applyStickerMeta(poly, "diamond");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLightningSticker(f: any, x: number, y: number, size: number, color: string) {
  const s = size / 2;
  const points = [
    { x: -s * 0.3, y: -s },
    { x: s * 0.4, y: -s * 0.1 },
    { x: 0, y: -s * 0.1 },
    { x: s * 0.3, y: s },
    { x: -s * 0.4, y: s * 0.05 },
    { x: 0, y: s * 0.05 },
  ];
  const poly = new f.Polygon(points, {
    left: x,
    top: y,
    fill: color,
    stroke: "#b45309",
    strokeWidth: 1,
  });
  return applyStickerMeta(poly, "lightning");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSunSticker(f: any, x: number, y: number, size: number, color: string) {
  const r = size / 3;
  const objs = [];
  const center = new f.Circle({
    radius: r,
    fill: color,
    left: -r,
    top: -r,
  });
  objs.push(center);
  const rayCount = 8;
  const rayLen = size / 4;
  for (let i = 0; i < rayCount; i++) {
    const ang = (Math.PI * 2 * i) / rayCount;
    const rx = Math.cos(ang) * (r + rayLen / 2);
    const ry = Math.sin(ang) * (r + rayLen / 2);
    const ray = new f.Rect({
      width: rayLen,
      height: 4,
      fill: color,
      left: rx - rayLen / 2,
      top: ry - 2,
      angle: (ang * 180) / Math.PI,
      originX: "center",
      originY: "center",
    });
    objs.push(ray);
  }
  const group = new f.Group(objs, {
    left: x,
    top: y,
  });
  return applyStickerMeta(group, "sun");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMoonSticker(f: any, x: number, y: number, size: number, color: string) {
  const moonPath =
    "M 50 0 A 50 50 0 1 0 50 100 A 40 40 0 1 1 50 0 Z";
  const path = new f.Path(moonPath, {
    fill: color,
    stroke: "#94a3b8",
    strokeWidth: 1,
    left: x,
    top: y,
  });
  const scale = size / 100;
  path.scale(scale);
  return applyStickerMeta(path, "moon");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCloudSticker(f: any, x: number, y: number, size: number, color: string) {
  const r = size / 4;
  const objs = [
    new f.Circle({ radius: r, fill: color, left: -r * 2, top: -r * 0.2 }),
    new f.Circle({ radius: r * 1.2, fill: color, left: -r, top: -r }),
    new f.Circle({ radius: r * 1.1, fill: color, left: r * 0.3, top: -r * 0.8 }),
    new f.Circle({ radius: r, fill: color, left: r * 1.2, top: -r * 0.2 }),
    new f.Rect({ width: r * 4, height: r * 1.2, fill: color, left: -r * 2, top: -r * 0.2 }),
  ];
  const group = new f.Group(objs, {
    left: x,
    top: y,
  });
  return applyStickerMeta(group, "cloud");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLeafSticker(f: any, x: number, y: number, size: number, color: string) {
  const leafPath = "M 0 0 Q 50 -50 100 0 Q 50 50 0 0 Z";
  const path = new f.Path(leafPath, {
    fill: color,
    stroke: "#166534",
    strokeWidth: 1,
    left: x,
    top: y,
  });
  const scale = size / 100;
  path.scale(scale);
  return applyStickerMeta(path, "leaf");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPalmTreeSticker(f: any, x: number, y: number, size: number, color: string) {
  const trunkW = size * 0.12;
  const trunkH = size * 0.6;
  const trunk = new f.Rect({
    width: trunkW,
    height: trunkH,
    fill: "#78350f",
    left: -trunkW / 2,
    top: 0,
  });
  const leafLen = size * 0.45;
  const leafW = size * 0.15;
  const leaves = [];
  for (let i = 0; i < 5; i++) {
    const ang = -90 + (i - 2) * 35;
    const rad = (ang * Math.PI) / 180;
    const leaf = new f.Ellipse({
      rx: leafLen / 2,
      ry: leafW / 2,
      fill: color,
      left: Math.cos(rad) * leafLen * 0.4 - leafLen / 2,
      top: Math.sin(rad) * leafLen * 0.4 - leafW / 2,
      angle: ang,
      originX: "center",
      originY: "center",
    });
    leaves.push(leaf);
  }
  const group = new f.Group([trunk, ...leaves], {
    left: x,
    top: y,
  });
  return applyStickerMeta(group, "palm");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHouseSticker(f: any, x: number, y: number, size: number, color: string) {
  const s = size;
  const body = new f.Rect({
    width: s * 0.7,
    height: s * 0.5,
    fill: color,
    stroke: "#451a03",
    strokeWidth: 2,
    left: -s * 0.35,
    top: 0,
  });
  const roof = new f.Polygon(
    [
      { x: -s * 0.4, y: 0 },
      { x: 0, y: -s * 0.35 },
      { x: s * 0.4, y: 0 },
    ],
    {
      fill: "#b91c1c",
      stroke: "#7f1d1d",
      strokeWidth: 2,
      left: -s * 0.4,
      top: -s * 0.35,
    },
  );
  const door = new f.Rect({
    width: s * 0.15,
    height: s * 0.25,
    fill: "#451a03",
    left: -s * 0.075,
    top: s * 0.25,
  });
  const group = new f.Group([body, roof, door], {
    left: x,
    top: y,
  });
  return applyStickerMeta(group, "house");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRocketSticker(f: any, x: number, y: number, size: number, color: string) {
  const s = size;
  const body = new f.Rect({
    width: s * 0.3,
    height: s * 0.55,
    fill: "#e5e7eb",
    stroke: "#475569",
    strokeWidth: 2,
    left: -s * 0.15,
    top: -s * 0.15,
  });
  const nose = new f.Polygon(
    [
      { x: -s * 0.15, y: 0 },
      { x: 0, y: -s * 0.3 },
      { x: s * 0.15, y: 0 },
    ],
    {
      fill: color,
      stroke: "#7f1d1d",
      strokeWidth: 1,
      left: -s * 0.15,
      top: -s * 0.45,
    },
  );
  const finL = new f.Polygon(
    [
      { x: 0, y: 0 },
      { x: -s * 0.15, y: s * 0.15 },
      { x: 0, y: s * 0.15 },
    ],
    {
      fill: color,
      left: -s * 0.3,
      top: s * 0.25,
    },
  );
  const finR = new f.Polygon(
    [
      { x: 0, y: 0 },
      { x: s * 0.15, y: s * 0.15 },
      { x: 0, y: s * 0.15 },
    ],
    {
      fill: color,
      left: s * 0.15,
      top: s * 0.25,
    },
  );
  const window = new f.Circle({
    radius: s * 0.07,
    fill: "#38bdf8",
    stroke: "#0c4a6e",
    strokeWidth: 1,
    left: -s * 0.07,
    top: -s * 0.05,
  });
  const flame = new f.Polygon(
    [
      { x: -s * 0.1, y: 0 },
      { x: 0, y: s * 0.2 },
      { x: s * 0.1, y: 0 },
    ],
    {
      fill: "#fbbf24",
      left: -s * 0.1,
      top: s * 0.4,
    },
  );
  const group = new f.Group([flame, body, nose, finL, finR, window], {
    left: x,
    top: y,
  });
  return applyStickerMeta(group, "rocket");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSticker(f: any, type: StickerType, x: number, y: number, size: number, color: string) {
  switch (type) {
    case "heart":
      return buildHeartSticker(f, x, y, size, color);
    case "star":
      return buildStarSticker(f, x, y, size, color);
    case "crown":
      return buildCrownSticker(f, x, y, size, color);
    case "diamond":
      return buildDiamondSticker(f, x, y, size, color);
    case "lightning":
      return buildLightningSticker(f, x, y, size, color);
    case "sun":
      return buildSunSticker(f, x, y, size, color);
    case "moon":
      return buildMoonSticker(f, x, y, size, color);
    case "cloud":
      return buildCloudSticker(f, x, y, size, color);
    case "leaf":
      return buildLeafSticker(f, x, y, size, color);
    case "palm":
      return buildPalmTreeSticker(f, x, y, size, color);
    case "house":
      return buildHouseSticker(f, x, y, size, color);
    case "rocket":
      return buildRocketSticker(f, x, y, size, color);
  }
}

export function CanvasStickersCollectionPanel({ fabricCanvas }: CanvasStickersCollectionPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [size, setSize] = useState(80);
  const [color, setColor] = useState("#ef4444");
  const [overrideColor, setOverrideColor] = useState(false);
  const [wobble, setWobble] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rafMapRef = useRef<Map<any, number>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseAngleMapRef = useRef<Map<any, number>>(new Map());

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    return () => {
      rafMapRef.current.forEach((id) => cancelAnimationFrame(id));
      rafMapRef.current.clear();
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startWobble = (obj: any) => {
    const baseAngle = obj.angle || 0;
    baseAngleMapRef.current.set(obj, baseAngle);
    // eslint-disable-next-line react-hooks/purity
    const offset = Math.random() * Math.PI * 2;
    const animate = () => {
      if (!canvasRef.current) return;
      const now = performance.now();
      obj.angle = baseAngle + Math.sin(now * 0.005 + offset) * 5;
      obj.setCoords();
      canvasRef.current.requestRenderAll();
      const id = requestAnimationFrame(animate);
      rafMapRef.current.set(obj, id);
    };
    const id = requestAnimationFrame(animate);
    rafMapRef.current.set(obj, id);
  };

  const insertSticker = (def: StickerDef) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const finalColor = overrideColor ? color : def.defaultColor;
      const cx = (canvas.getWidth?.() || 800) / 2;
      const cy = (canvas.getHeight?.() || 600) / 2;
      const obj = buildSticker(f, def.type, cx, cy, size, finalColor);
      if (!obj) return;
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      if (wobble) {
        startWobble(obj);
      }
      queueMicrotask(() => {
        toast.success(`Sticker ${def.label} inserido`);
      });
    });
  };

  const clearStickers = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = canvas.getObjects().filter((o: any) => o.data?.sticker === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((o: any) => {
      const rafId = rafMapRef.current.get(o);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafMapRef.current.delete(o);
      }
      baseAngleMapRef.current.delete(o);
      canvas.remove(o);
    });
    canvas.requestRenderAll();
    toast.success(`${objs.length} sticker(s) removido(s)`);
  };

  const stopAnimations = () => {
    const canvas = canvasRef.current;
    rafMapRef.current.forEach((id, obj) => {
      cancelAnimationFrame(id);
      const base = baseAngleMapRef.current.get(obj) ?? 0;
      obj.angle = base;
      obj.setCoords?.();
    });
    rafMapRef.current.clear();
    baseAngleMapRef.current.clear();
    canvas?.requestRenderAll();
    toast.success("Animações paradas");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Smile className="h-5 w-5 text-pink-500" />
        <h3 className="text-sm font-semibold">Coleção de Stickers Animados</h3>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Tamanho: {size}px
        </label>
        <input
          type="range"
          min={40}
          max={200}
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={overrideColor}
            onChange={(e) => setOverrideColor(e.target.checked)}
          />
          Sobrescrever cor padrão
        </label>
        {overrideColor && (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 cursor-pointer p-1"
            />
            <Input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 flex-1"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={wobble}
            onChange={(e) => setWobble(e.target.checked)}
          />
          Animar com oscilação (wobble)
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Clique para inserir
        </label>
        <div className="grid grid-cols-3 gap-2">
          {STICKER_DEFS.map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => insertSticker(def)}
              className="flex flex-col items-center justify-center gap-1 rounded-md border border-border bg-card p-2 text-xs transition-colors hover:border-primary hover:bg-accent"
              style={{ borderColor: overrideColor ? color : def.defaultColor }}
            >
              <span
                className="text-2xl"
                style={{ color: overrideColor ? color : def.defaultColor }}
              >
                {def.emoji}
              </span>
              <span className="text-[10px] font-medium text-foreground">
                {def.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={stopAnimations}
          className="w-full"
        >
          Parar Animações
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={clearStickers}
          className="w-full"
        >
          Limpar Stickers
        </Button>
      </div>
    </div>
  );
}
