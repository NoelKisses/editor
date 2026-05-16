"use client";

import { useEffect, useRef, useState } from "react";
import { Pilcrow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextAsymmetricLayoutPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type LayoutStyle =
  | "esquerda-top"
  | "diagonal"
  | "pilha-caotica"
  | "borda"
  | "centro-quebrado"
  | "escada";

interface LayoutEntry {
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

function jitter(amount: number): number {
  return (Math.random() - 0.5) * 2 * amount;
}

function buildEsquerdaTopLayout(
  canvasW: number,
  canvasH: number,
  mainText: string,
  subText: string,
  mainSize: number,
  subSize: number,
  mainColor: string,
  accentColor: string,
  randomFactor: number,
): LayoutEntry[] {
  return [
    {
      text: mainText,
      x: 40 + jitter(randomFactor),
      y: 40 + jitter(randomFactor),
      size: mainSize,
      color: mainColor,
      rotation: jitter(randomFactor / 10),
    },
    {
      text: subText,
      x: canvasW - 40 - subText.length * subSize * 0.55 + jitter(randomFactor),
      y: canvasH - 60 + jitter(randomFactor),
      size: subSize,
      color: accentColor,
      rotation: jitter(randomFactor / 10),
    },
  ];
}

function buildDiagonalLayout(
  canvasW: number,
  canvasH: number,
  mainText: string,
  subText: string,
  mainSize: number,
  subSize: number,
  mainColor: string,
  accentColor: string,
  randomFactor: number,
): LayoutEntry[] {
  const angle = -25 + jitter(randomFactor / 5);
  return [
    {
      text: mainText,
      x: canvasW * 0.1 + jitter(randomFactor),
      y: canvasH * 0.6 + jitter(randomFactor),
      size: mainSize,
      color: mainColor,
      rotation: angle,
    },
    {
      text: subText,
      x: canvasW * 0.55 + jitter(randomFactor),
      y: canvasH * 0.25 + jitter(randomFactor),
      size: subSize,
      color: accentColor,
      rotation: angle,
    },
  ];
}

function buildPilhaCaoticaLayout(
  canvasW: number,
  canvasH: number,
  mainText: string,
  subText: string,
  mainSize: number,
  subSize: number,
  mainColor: string,
  accentColor: string,
  randomFactor: number,
): LayoutEntry[] {
  const lines = [mainText, subText, mainText.split("").reverse().join(""), subText];
  const sizes = [mainSize, subSize, mainSize * 0.7, subSize * 1.2];
  const baseY = canvasH * 0.2;
  return lines.map((text, i) => ({
    text,
    x: 60 + jitter(randomFactor * 2),
    y: baseY + i * (mainSize * 0.8) + jitter(randomFactor),
    size: sizes[i] ?? mainSize,
    color: i % 2 === 0 ? mainColor : accentColor,
    rotation: jitter(randomFactor / 8),
  }));
}

function buildBordaLayout(
  canvasW: number,
  canvasH: number,
  mainText: string,
  subText: string,
  mainSize: number,
  subSize: number,
  mainColor: string,
  accentColor: string,
  randomFactor: number,
): LayoutEntry[] {
  return [
    {
      text: mainText,
      x: 20 + jitter(randomFactor),
      y: 20 + jitter(randomFactor),
      size: subSize,
      color: mainColor,
      rotation: 0,
    },
    {
      text: subText,
      x: canvasW - 20 - subText.length * subSize * 0.55 + jitter(randomFactor),
      y: 20 + jitter(randomFactor),
      size: subSize,
      color: accentColor,
      rotation: 0,
    },
    {
      text: mainText,
      x: 20 + jitter(randomFactor),
      y: canvasH - 40 + jitter(randomFactor),
      size: subSize,
      color: accentColor,
      rotation: 0,
    },
    {
      text: subText,
      x: canvasW * 0.5 - (subText.length * mainSize * 0.55) / 2 + jitter(randomFactor),
      y: canvasH * 0.5 - mainSize / 2 + jitter(randomFactor),
      size: mainSize,
      color: mainColor,
      rotation: jitter(randomFactor / 10),
    },
  ];
}

function buildCentroQuebradoLayout(
  canvasW: number,
  canvasH: number,
  mainText: string,
  subText: string,
  mainSize: number,
  subSize: number,
  mainColor: string,
  accentColor: string,
  randomFactor: number,
): LayoutEntry[] {
  const lines = mainText.split(" ").length > 1 ? mainText.split(" ") : [mainText, subText];
  const baseY = canvasH * 0.4;
  const centerX = canvasW * 0.5;
  return lines.map((text, i) => {
    const offset = (i % 2 === 0 ? -1 : 1) * (40 + Math.random() * randomFactor);
    return {
      text,
      x: centerX - text.length * mainSize * 0.27 + offset,
      y: baseY + i * mainSize * 0.9 + jitter(randomFactor / 2),
      size: mainSize,
      color: i === lines.length - 1 ? accentColor : mainColor,
      rotation: jitter(randomFactor / 15),
    };
  });
}

function buildEscadaLayout(
  canvasW: number,
  canvasH: number,
  mainText: string,
  subText: string,
  mainSize: number,
  subSize: number,
  mainColor: string,
  accentColor: string,
  randomFactor: number,
): LayoutEntry[] {
  const lines = [mainText, subText, mainText, subText];
  const stepX = canvasW * 0.15;
  const stepY = mainSize * 0.85;
  const startX = 40;
  const startY = 40;
  return lines.map((text, i) => ({
    text,
    x: startX + i * stepX + jitter(randomFactor / 2),
    y: startY + i * stepY + jitter(randomFactor / 2),
    size: i % 2 === 0 ? mainSize : subSize,
    color: i % 2 === 0 ? mainColor : accentColor,
    rotation: jitter(randomFactor / 15),
  }));
}

function buildLayout(
  style: LayoutStyle,
  canvasW: number,
  canvasH: number,
  mainText: string,
  subText: string,
  mainSize: number,
  subSize: number,
  mainColor: string,
  accentColor: string,
  randomFactor: number,
): LayoutEntry[] {
  const args = [
    canvasW,
    canvasH,
    mainText,
    subText,
    mainSize,
    subSize,
    mainColor,
    accentColor,
    randomFactor,
  ] as const;
  switch (style) {
    case "esquerda-top":
      return buildEsquerdaTopLayout(...args);
    case "diagonal":
      return buildDiagonalLayout(...args);
    case "pilha-caotica":
      return buildPilhaCaoticaLayout(...args);
    case "borda":
      return buildBordaLayout(...args);
    case "centro-quebrado":
      return buildCentroQuebradoLayout(...args);
    case "escada":
      return buildEscadaLayout(...args);
  }
}

const LAYOUT_OPTIONS: { id: LayoutStyle; label: string }[] = [
  { id: "esquerda-top", label: "Esquerda Top" },
  { id: "diagonal", label: "Diagonal" },
  { id: "pilha-caotica", label: "Pilha Caótica" },
  { id: "borda", label: "Borda" },
  { id: "centro-quebrado", label: "Centro Quebrado" },
  { id: "escada", label: "Escada" },
];

export function TextAsymmetricLayoutPanel({
  fabricCanvas,
}: TextAsymmetricLayoutPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [style, setStyle] = useState<LayoutStyle>("esquerda-top");
  const [mainText, setMainText] = useState("DESIGN");
  const [subText, setSubText] = useState("Editorial 2026");
  const [mainColor, setMainColor] = useState("#1a1a1a");
  const [accentColor, setAccentColor] = useState("#ef4444");
  const [mainSize, setMainSize] = useState(100);
  const [subSize, setSubSize] = useState(24);
  const [randomFactor, setRandomFactor] = useState(20);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const canvasW = canvas.getWidth();
      const canvasH = canvas.getHeight();
      const entries = buildLayout(
        style,
        canvasW,
        canvasH,
        mainText || "DESIGN",
        subText || "Editorial 2026",
        mainSize,
        subSize,
        mainColor,
        accentColor,
        randomFactor,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objects: any[] = entries.map((e) =>
        new f.IText(e.text, {
          left: e.x,
          top: e.y,
          fontSize: e.size,
          fill: e.color,
          angle: e.rotation,
          fontFamily: "Inter, sans-serif",
          fontWeight: "bold",
        }),
      );
      const group = new f.Group(objects, {
        left: 0,
        top: 0,
        data: { asymmetricLayout: true },
      });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      toast.success("Layout assimétrico criado");
    }).catch(() => {
      toast.error("Falha ao carregar fabric");
    });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targets = canvas.getObjects().filter((obj: any) => obj?.data?.asymmetricLayout === true);
    if (targets.length === 0) {
      toast.info("Nenhum layout para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targets.forEach((obj: any) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    toast.success(`${targets.length} layout(s) removido(s)`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Pilcrow className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Layout Tipográfico Assimétrico</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {LAYOUT_OPTIONS.map((opt) => (
          <Button
            key={opt.id}
            variant={style === opt.id ? "default" : "outline"}
            size="sm"
            onClick={() => setStyle(opt.id)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Texto principal</label>
        <Input
          value={mainText}
          onChange={(e) => setMainText(e.target.value)}
          placeholder="DESIGN"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Subtítulo</label>
        <Input
          value={subText}
          onChange={(e) => setSubText(e.target.value)}
          placeholder="Editorial 2026"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium">Cor principal</label>
          <input
            type="color"
            value={mainColor}
            onChange={(e) => setMainColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Cor de destaque</label>
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Tamanho principal: {mainSize}px
        </label>
        <input
          type="range"
          min={60}
          max={160}
          step={1}
          value={mainSize}
          onChange={(e) => setMainSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Tamanho subtítulo: {subSize}px
        </label>
        <input
          type="range"
          min={16}
          max={40}
          step={1}
          value={subSize}
          onChange={(e) => setSubSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Fator aleatório: {randomFactor}
        </label>
        <input
          type="range"
          min={0}
          max={50}
          step={1}
          value={randomFactor}
          onChange={(e) => setRandomFactor(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleGenerate} className="w-full">
          Gerar Layout
        </Button>
        <Button onClick={handleClear} variant="outline" className="w-full">
          Limpar Layouts
        </Button>
      </div>
    </div>
  );
}
