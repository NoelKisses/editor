"use client";

import { useEffect, useRef, useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextTapeLabelPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type TapeStyle =
  | "fita-adesiva"
  | "etiqueta-escolar"
  | "etiqueta-preco"
  | "adesivo-redondo"
  | "selo-postal"
  | "fita-metrica";

const FONT_FAMILIES = [
  "Caveat",
  "Marker Felt",
  "Arial",
  "Permanent Marker",
  "Comic Sans MS",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFitaAdesiva(f: any, opts: BuilderOpts) {
  const { width, bgColor, textColor, fontSize, fontFamily, text } = opts;
  const height = Math.max(fontSize + 20, 50);
  const rect = new f.Rect({
    width,
    height,
    fill: bgColor,
    opacity: 0.55,
    originX: "center",
    originY: "center",
    rx: 2,
    ry: 2,
    stroke: "rgba(0,0,0,0.08)",
    strokeWidth: 1,
  });
  const label = new f.IText(text, {
    fontSize,
    fontFamily,
    fill: textColor,
    originX: "center",
    originY: "center",
    textAlign: "center",
  });
  return new f.Group([rect, label], {
    originX: "center",
    originY: "center",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEtiquetaEscolar(f: any, opts: BuilderOpts) {
  const { width, bgColor, textColor, fontSize, fontFamily, text } = opts;
  const height = Math.max(fontSize + 30, 60);
  const paper = new f.Rect({
    width,
    height,
    fill: bgColor,
    originX: "center",
    originY: "center",
    stroke: "#d4c98a",
    strokeWidth: 1,
  });
  const redMargin = new f.Rect({
    width: 2,
    height,
    fill: "#e53935",
    originX: "center",
    originY: "center",
    left: -width / 2 + 18,
  });
  const line = new f.Rect({
    width: width - 30,
    height: 1,
    fill: "#b0c4de",
    originX: "center",
    originY: "center",
    top: height / 2 - 6,
    left: 5,
  });
  const label = new f.IText(text, {
    fontSize,
    fontFamily,
    fill: textColor,
    originX: "center",
    originY: "center",
    textAlign: "center",
    left: 10,
  });
  return new f.Group([paper, redMargin, line, label], {
    originX: "center",
    originY: "center",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEtiquetaPreco(f: any, opts: BuilderOpts) {
  const { width, bgColor, textColor, fontSize, fontFamily, text } = opts;
  const height = Math.max(fontSize + 24, 56);
  const notchSize = height / 2;
  const points = [
    { x: notchSize, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: notchSize, y: height },
    { x: 0, y: height / 2 },
  ];
  const tag = new f.Polygon(points, {
    fill: bgColor,
    originX: "center",
    originY: "center",
    stroke: "rgba(0,0,0,0.15)",
    strokeWidth: 1,
  });
  const hole = new f.Circle({
    radius: 5,
    fill: "#ffffff",
    stroke: "rgba(0,0,0,0.3)",
    strokeWidth: 1,
    originX: "center",
    originY: "center",
    left: -width / 2 + notchSize + 4,
  });
  const label = new f.IText(text, {
    fontSize,
    fontFamily,
    fill: textColor,
    originX: "center",
    originY: "center",
    textAlign: "center",
    left: notchSize / 2,
  });
  return new f.Group([tag, hole, label], {
    originX: "center",
    originY: "center",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAdesivoRedondo(f: any, opts: BuilderOpts) {
  const { width, bgColor, textColor, fontSize, fontFamily, text } = opts;
  const radius = width / 2;
  const circle = new f.Circle({
    radius,
    fill: bgColor,
    originX: "center",
    originY: "center",
    stroke: "rgba(0,0,0,0.15)",
    strokeWidth: 2,
  });
  const inner = new f.Circle({
    radius: radius - 6,
    fill: "transparent",
    originX: "center",
    originY: "center",
    stroke: "rgba(255,255,255,0.6)",
    strokeWidth: 1,
    strokeDashArray: [4, 3],
  });
  const label = new f.IText(text, {
    fontSize,
    fontFamily,
    fill: textColor,
    originX: "center",
    originY: "center",
    textAlign: "center",
  });
  return new f.Group([circle, inner, label], {
    originX: "center",
    originY: "center",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSeloPostal(f: any, opts: BuilderOpts) {
  const { width, bgColor, textColor, fontSize, fontFamily, text } = opts;
  const height = Math.max(fontSize + 30, 70);
  const teeth = 16;
  const toothSize = 5;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < teeth; i++) {
    const x = (i / teeth) * width;
    points.push({ x, y: 0 });
    points.push({ x: x + width / teeth / 2, y: -toothSize });
  }
  points.push({ x: width, y: 0 });
  for (let i = 0; i < teeth; i++) {
    const y = (i / teeth) * height;
    points.push({ x: width, y });
    points.push({ x: width + toothSize, y: y + height / teeth / 2 });
  }
  points.push({ x: width, y: height });
  for (let i = teeth; i > 0; i--) {
    const x = (i / teeth) * width;
    points.push({ x, y: height });
    points.push({ x: x - width / teeth / 2, y: height + toothSize });
  }
  points.push({ x: 0, y: height });
  for (let i = teeth; i > 0; i--) {
    const y = (i / teeth) * height;
    points.push({ x: 0, y });
    points.push({ x: -toothSize, y: y - height / teeth / 2 });
  }
  const stamp = new f.Polygon(points, {
    fill: bgColor,
    originX: "center",
    originY: "center",
    stroke: "rgba(0,0,0,0.2)",
    strokeWidth: 1,
  });
  const innerBorder = new f.Rect({
    width: width - 16,
    height: height - 16,
    fill: "transparent",
    stroke: "rgba(0,0,0,0.25)",
    strokeWidth: 1,
    originX: "center",
    originY: "center",
  });
  const label = new f.IText(text, {
    fontSize,
    fontFamily,
    fill: textColor,
    originX: "center",
    originY: "center",
    textAlign: "center",
  });
  return new f.Group([stamp, innerBorder, label], {
    originX: "center",
    originY: "center",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFitaMetrica(f: any, opts: BuilderOpts) {
  const { width, bgColor, textColor, fontSize, fontFamily, text } = opts;
  const height = Math.max(fontSize + 14, 36);
  const strip = new f.Rect({
    width,
    height,
    fill: bgColor,
    originX: "center",
    originY: "center",
    stroke: "rgba(0,0,0,0.2)",
    strokeWidth: 1,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marks: any[] = [];
  const markCount = Math.floor(width / 10);
  for (let i = 0; i <= markCount; i++) {
    const isMajor = i % 5 === 0;
    const markHeight = isMajor ? 8 : 4;
    marks.push(
      new f.Rect({
        width: 1,
        height: markHeight,
        fill: "rgba(0,0,0,0.7)",
        originX: "center",
        originY: "top",
        left: -width / 2 + i * 10,
        top: -height / 2,
      })
    );
  }
  const label = new f.IText(text, {
    fontSize,
    fontFamily,
    fill: textColor,
    originX: "center",
    originY: "center",
    textAlign: "center",
    top: 2,
  });
  return new f.Group([strip, ...marks, label], {
    originX: "center",
    originY: "center",
  });
}

interface BuilderOpts {
  width: number;
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildShape(f: any, style: TapeStyle, opts: BuilderOpts) {
  switch (style) {
    case "fita-adesiva":
      return buildFitaAdesiva(f, opts);
    case "etiqueta-escolar":
      return buildEtiquetaEscolar(f, opts);
    case "etiqueta-preco":
      return buildEtiquetaPreco(f, opts);
    case "adesivo-redondo":
      return buildAdesivoRedondo(f, opts);
    case "selo-postal":
      return buildSeloPostal(f, opts);
    case "fita-metrica":
      return buildFitaMetrica(f, opts);
  }
}

const STYLE_OPTIONS: { id: TapeStyle; label: string }[] = [
  { id: "fita-adesiva", label: "Fita Adesiva" },
  { id: "etiqueta-escolar", label: "Etiqueta Escolar" },
  { id: "etiqueta-preco", label: "Etiqueta Preço" },
  { id: "adesivo-redondo", label: "Adesivo Redondo" },
  { id: "selo-postal", label: "Selo Postal" },
  { id: "fita-metrica", label: "Fita Métrica" },
];

export function TextTapeLabelPanel({ fabricCanvas }: TextTapeLabelPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [text, setText] = useState("IMPORTANTE");
  const [style, setStyle] = useState<TapeStyle>("fita-adesiva");
  const [bgColor, setBgColor] = useState("#fff9c4");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [fontSize, setFontSize] = useState(20);
  const [rotation, setRotation] = useState(-5);
  const [width, setWidth] = useState(250);
  const [shadow, setShadow] = useState(true);
  const [fontFamily, setFontFamily] = useState("Caveat");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (!text.trim()) {
      toast.error("Digite o texto da etiqueta");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const group = buildShape(f, style, {
        width,
        bgColor,
        textColor,
        fontSize,
        fontFamily,
        text,
      });

      group.set({
        angle: rotation,
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: "center",
        originY: "center",
        data: { tapeLabel: true },
      });

      if (shadow) {
        group.set(
          "shadow",
          new f.Shadow({
            color: "rgba(0,0,0,0.35)",
            blur: 8,
            offsetX: 3,
            offsetY: 4,
          })
        );
      }

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      toast.success("Etiqueta inserida");
    });
  };

  const handleRemoveAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = canvas.getObjects().filter((o: any) => o?.data?.tapeLabel === true);
    if (objs.length === 0) {
      toast.info("Nenhuma etiqueta encontrada");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${objs.length} etiqueta(s) removida(s)`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5" />
        <h3 className="text-base font-semibold">Etiqueta Adesiva / Fita</h3>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="tape-text">
          Texto
        </label>
        <Input
          id="tape-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="IMPORTANTE"
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Estilo</span>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant={style === opt.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStyle(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="tape-bg">
            Cor de Fundo
          </label>
          <input
            id="tape-bg"
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="tape-text-color">
            Cor do Texto
          </label>
          <input
            id="tape-text-color"
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="tape-font">
          Fonte
        </label>
        <select
          id="tape-font"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="h-9 w-full rounded border bg-background px-2 text-sm"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="flex justify-between text-xs font-medium" htmlFor="tape-size">
          <span>Tamanho da fonte</span>
          <span>{fontSize}px</span>
        </label>
        <input
          id="tape-size"
          type="range"
          min={12}
          max={48}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="flex justify-between text-xs font-medium" htmlFor="tape-rotation">
          <span>Rotação</span>
          <span>{rotation}°</span>
        </label>
        <input
          id="tape-rotation"
          type="range"
          min={-30}
          max={30}
          step={1}
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="flex justify-between text-xs font-medium" htmlFor="tape-width">
          <span>Largura</span>
          <span>{width}px</span>
        </label>
        <input
          id="tape-width"
          type="range"
          min={100}
          max={500}
          step={10}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={shadow}
          onChange={(e) => setShadow(e.target.checked)}
          className="h-4 w-4"
        />
        Sombra
      </label>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={handleInsert} className="w-full">
          Inserir Etiqueta
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRemoveAll}
          className="w-full"
        >
          Remover Etiquetas
        </Button>
      </div>
    </div>
  );
}
