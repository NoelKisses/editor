"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextQuoteStylePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type QuoteStyle =
  | "classico"
  | "card"
  | "minimalista"
  | "vintage"
  | "moderno"
  | "inspiracao";

interface BuilderOptions {
  quoteText: string;
  author: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontSize: number;
  width: number;
  showLargeQuotes: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addLargeQuotesIfNeeded(f: any, objects: any[], opts: BuilderOptions, color: string) {
  if (!opts.showLargeQuotes) return;
  const openQuote = new f.IText('"', {
    left: 0,
    top: -opts.fontSize * 2.2,
    fontSize: opts.fontSize * 3,
    fontFamily: "Georgia, serif",
    fill: color,
    fontWeight: "bold",
    selectable: false,
  });
  const closeQuote = new f.IText('"', {
    left: opts.width - opts.fontSize * 2,
    top: opts.fontSize * 4,
    fontSize: opts.fontSize * 3,
    fontFamily: "Georgia, serif",
    fill: color,
    fontWeight: "bold",
    selectable: false,
  });
  objects.push(openQuote, closeQuote);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildClassico(f: any, opts: BuilderOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [];
  const quoteText = new f.IText(opts.quoteText, {
    left: 20,
    top: 40,
    fontSize: opts.fontSize,
    fontFamily: "Georgia, serif",
    fill: opts.textColor,
    width: opts.width - 40,
    textAlign: "center",
  });
  const author = new f.IText(opts.author, {
    left: 20,
    top: 40 + opts.fontSize * 3,
    fontSize: opts.fontSize * 0.7,
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fill: opts.accentColor,
    width: opts.width - 40,
    textAlign: "center",
  });
  addLargeQuotesIfNeeded(f, objects, opts, opts.accentColor);
  objects.push(quoteText, author);
  return new f.Group(objects, { data: { quoteCard: true } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCard(f: any, opts: BuilderOptions) {
  const height = opts.fontSize * 6;
  const bg = new f.Rect({
    left: 0,
    top: 0,
    width: opts.width,
    height,
    fill: opts.bgColor,
    stroke: opts.accentColor,
    strokeWidth: 2,
    rx: 12,
    ry: 12,
  });
  const quoteText = new f.IText(opts.quoteText, {
    left: 30,
    top: 30,
    fontSize: opts.fontSize,
    fontFamily: "Inter, sans-serif",
    fill: opts.textColor,
    width: opts.width - 60,
    textAlign: "left",
  });
  const author = new f.IText(opts.author, {
    left: 30,
    top: 30 + opts.fontSize * 3,
    fontSize: opts.fontSize * 0.65,
    fontFamily: "Inter, sans-serif",
    fill: opts.accentColor,
    width: opts.width - 60,
    textAlign: "left",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [bg, quoteText, author];
  addLargeQuotesIfNeeded(f, objects, opts, opts.accentColor);
  return new f.Group(objects, { data: { quoteCard: true } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMinimalista(f: any, opts: BuilderOptions) {
  const quoteText = new f.IText(opts.quoteText, {
    left: 0,
    top: 0,
    fontSize: opts.fontSize,
    fontFamily: "Helvetica, sans-serif",
    fill: opts.textColor,
    width: opts.width,
    textAlign: "center",
  });
  const author = new f.IText(opts.author, {
    left: 0,
    top: opts.fontSize * 3,
    fontSize: opts.fontSize * 0.6,
    fontFamily: "Helvetica, sans-serif",
    fill: opts.textColor,
    width: opts.width,
    textAlign: "center",
    opacity: 0.7,
  });
  return new f.Group([quoteText, author], { data: { quoteCard: true } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVintage(f: any, opts: BuilderOptions) {
  const height = opts.fontSize * 7;
  const sepiaBg = "#f4ecd8";
  const sepiaBorder = "#8b6f47";
  const sepiaText = "#3e2c1c";
  const bg = new f.Rect({
    left: 0,
    top: 0,
    width: opts.width,
    height,
    fill: sepiaBg,
    stroke: sepiaBorder,
    strokeWidth: 4,
  });
  const innerBorder = new f.Rect({
    left: 10,
    top: 10,
    width: opts.width - 20,
    height: height - 20,
    fill: "transparent",
    stroke: sepiaBorder,
    strokeWidth: 1,
  });
  const quoteText = new f.IText(opts.quoteText, {
    left: 40,
    top: 50,
    fontSize: opts.fontSize,
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fill: sepiaText,
    width: opts.width - 80,
    textAlign: "center",
  });
  const author = new f.IText(opts.author, {
    left: 40,
    top: 50 + opts.fontSize * 3.5,
    fontSize: opts.fontSize * 0.7,
    fontFamily: "Georgia, serif",
    fill: sepiaBorder,
    width: opts.width - 80,
    textAlign: "center",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [bg, innerBorder, quoteText, author];
  addLargeQuotesIfNeeded(f, objects, opts, sepiaBorder);
  return new f.Group(objects, { data: { quoteCard: true } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildModerno(f: any, opts: BuilderOptions) {
  const height = opts.fontSize * 6;
  const accentBar = new f.Rect({
    left: 0,
    top: 0,
    width: 8,
    height,
    fill: opts.accentColor,
  });
  const bg = new f.Rect({
    left: 8,
    top: 0,
    width: opts.width - 8,
    height,
    fill: opts.bgColor,
  });
  const quoteText = new f.IText(opts.quoteText, {
    left: 40,
    top: 30,
    fontSize: opts.fontSize,
    fontFamily: "Inter, sans-serif",
    fontWeight: "bold",
    fill: opts.textColor,
    width: opts.width - 70,
    textAlign: "left",
  });
  const author = new f.IText(opts.author, {
    left: 40,
    top: 30 + opts.fontSize * 3,
    fontSize: opts.fontSize * 0.65,
    fontFamily: "Inter, sans-serif",
    fill: opts.accentColor,
    width: opts.width - 70,
    textAlign: "left",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [bg, accentBar, quoteText, author];
  addLargeQuotesIfNeeded(f, objects, opts, opts.accentColor);
  return new f.Group(objects, { data: { quoteCard: true } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInspiracao(f: any, opts: BuilderOptions) {
  const height = opts.fontSize * 6;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gradient = new (f.Gradient as any)({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: opts.width, y2: height },
    colorStops: [
      { offset: 0, color: opts.accentColor },
      { offset: 1, color: opts.textColor },
    ],
  });
  const bg = new f.Rect({
    left: 0,
    top: 0,
    width: opts.width,
    height,
    fill: gradient,
    rx: 16,
    ry: 16,
  });
  const quoteText = new f.IText(opts.quoteText, {
    left: 30,
    top: 30,
    fontSize: opts.fontSize,
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    fill: "#ffffff",
    width: opts.width - 60,
    textAlign: "center",
  });
  const author = new f.IText(opts.author, {
    left: 30,
    top: 30 + opts.fontSize * 3,
    fontSize: opts.fontSize * 0.65,
    fontFamily: "Inter, sans-serif",
    fontStyle: "italic",
    fill: "#ffffffcc",
    width: opts.width - 60,
    textAlign: "center",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [bg, quoteText, author];
  addLargeQuotesIfNeeded(f, objects, opts, "#ffffff");
  return new f.Group(objects, { data: { quoteCard: true } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQuoteGroup(f: any, style: QuoteStyle, opts: BuilderOptions) {
  switch (style) {
    case "card":
      return buildCard(f, opts);
    case "minimalista":
      return buildMinimalista(f, opts);
    case "vintage":
      return buildVintage(f, opts);
    case "moderno":
      return buildModerno(f, opts);
    case "inspiracao":
      return buildInspiracao(f, opts);
    case "classico":
    default:
      return buildClassico(f, opts);
  }
}

const STYLE_OPTIONS: { id: QuoteStyle; label: string }[] = [
  { id: "classico", label: "Clássico" },
  { id: "card", label: "Card" },
  { id: "minimalista", label: "Minimalista" },
  { id: "vintage", label: "Vintage" },
  { id: "moderno", label: "Moderno" },
  { id: "inspiracao", label: "Inspiração" },
];

export function TextQuoteStylePanel({ fabricCanvas }: TextQuoteStylePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [quoteText, setQuoteText] = useState('"A vida é o que fazemos dela."');
  const [author, setAuthor] = useState("— Anônimo");
  const [selectedStyle, setSelectedStyle] = useState<QuoteStyle>("classico");
  const [bgColor, setBgColor] = useState("#f9fafb");
  const [textColor, setTextColor] = useState("#1f2937");
  const [accentColor, setAccentColor] = useState("#ef4444");
  const [fontSize, setFontSize] = useState(24);
  const [width, setWidth] = useState(500);
  const [showLargeQuotes, setShowLargeQuotes] = useState(true);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      try {
        const opts: BuilderOptions = {
          quoteText,
          author,
          bgColor,
          textColor,
          accentColor,
          fontSize,
          width,
          showLargeQuotes,
        };
        const group = buildQuoteGroup(f, selectedStyle, opts);
        const cw = canvas.getWidth ? canvas.getWidth() : 800;
        const ch = canvas.getHeight ? canvas.getHeight() : 600;
        group.set({
          left: cw / 2,
          top: ch / 2,
          originX: "center",
          originY: "center",
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        toast.success("Citação inserida");
      } catch (err) {
        toast.error(
          `Erro ao inserir citação: ${err instanceof Error ? err.message : "desconhecido"}`,
        );
      }
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objs = canvas.getObjects().filter((o: any) => o?.data?.quoteCard === true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      objs.forEach((o: any) => canvas.remove(o));
      canvas.requestRenderAll();
      toast.success(`${objs.length} citação(ões) removida(s)`);
    } catch (err) {
      toast.error(
        `Erro ao remover: ${err instanceof Error ? err.message : "desconhecido"}`,
      );
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Quote className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Cards de Citação</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="tqsp-quote">
          Texto da citação
        </label>
        <textarea
          id="tqsp-quote"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          value={quoteText}
          onChange={(e) => setQuoteText(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="tqsp-author">
          Autor
        </label>
        <Input
          id="tqsp-author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estilo</label>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant={selectedStyle === opt.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStyle(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="tqsp-bg">
            Fundo
          </label>
          <input
            id="tqsp-bg"
            type="color"
            className="h-9 w-full rounded-md border border-input"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="tqsp-text">
            Texto
          </label>
          <input
            id="tqsp-text"
            type="color"
            className="h-9 w-full rounded-md border border-input"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="tqsp-accent">
            Destaque
          </label>
          <input
            id="tqsp-accent"
            type="color"
            className="h-9 w-full rounded-md border border-input"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="tqsp-fs">
          Tamanho da fonte: {fontSize}px
        </label>
        <input
          id="tqsp-fs"
          type="range"
          min={16}
          max={48}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="tqsp-w">
          Largura: {width}px
        </label>
        <input
          id="tqsp-w"
          type="range"
          min={300}
          max={800}
          step={10}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="tqsp-large"
          type="checkbox"
          checked={showLargeQuotes}
          onChange={(e) => setShowLargeQuotes(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="tqsp-large" className="text-sm font-medium">
          Mostrar aspas grandes
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={handleInsert}>
          Inserir Citação
        </Button>
        <Button type="button" variant="outline" onClick={handleRemove}>
          Remover Citações
        </Button>
      </div>
    </div>
  );
}
