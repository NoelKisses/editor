"use client";

import { useEffect, useRef, useState } from "react";
import { AlignVerticalJustifyCenter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextPoemLayoutPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type PoemStyle =
  | "simples"
  | "indentado"
  | "centralizado"
  | "espacado"
  | "decorado"
  | "numerado";

const DEFAULT_POEM =
  "Era uma vez\n  uma estrela\n    no céu noturno\n      brilhando intensa.";

const FONT_FAMILIES = [
  "Georgia",
  "Playfair Display",
  "Cormorant Garamond",
  "Crimson Text",
  "Arial",
];

const POEM_STYLES: { id: PoemStyle; label: string }[] = [
  { id: "simples", label: "Simples" },
  { id: "indentado", label: "Indentado" },
  { id: "centralizado", label: "Centralizado" },
  { id: "espacado", label: "Espaçado" },
  { id: "decorado", label: "Decorado" },
  { id: "numerado", label: "Verso Numerado" },
];

function countLeadingSpaces(line: string): number {
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === " ") {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function processLineForStyle(
  line: string,
  index: number,
  style: string,
): string {
  if (style === "numerado") {
    return `${index + 1}. ${line.trim()}`;
  }
  if (style === "indentado") {
    // Preserve trimmed text; spacing handled via x offset
    return line.replace(/^\s+/, "");
  }
  return line.trim();
}

function buildPoemLines(
  lines: string[],
  style: string,
  indent: number,
): Array<{ text: string; x: number; y: number }> {
  const result: Array<{ text: string; x: number; y: number }> = [];
  let y = 0;
  lines.forEach((rawLine, index) => {
    const leading = countLeadingSpaces(rawLine);
    const processed = processLineForStyle(rawLine, index, style);
    let x = 0;
    if (style === "indentado") {
      x = leading * indent;
    }
    result.push({ text: processed, x, y });
    y += 1; // sequencial — multiplicado por lineHeight ao montar
  });
  return result;
}

export function TextPoemLayoutPanel({ fabricCanvas }: TextPoemLayoutPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [text, setText] = useState<string>(DEFAULT_POEM);
  const [style, setStyle] = useState<PoemStyle>("simples");
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [indentWidth, setIndentWidth] = useState<number>(30);
  const [color, setColor] = useState<string>("#1a1a1a");
  const [fontSize, setFontSize] = useState<number>(22);
  const [fontFamily, setFontFamily] = useState<string>("Georgia");
  const [italic, setItalic] = useState<boolean>(false);
  const [boldFirst, setBoldFirst] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const rawLines = text.split("\n").filter((l) => l.length > 0);
    if (rawLines.length === 0) {
      toast.error("Texto vazio");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;

      const built = buildPoemLines(rawLines, style, indentWidth);
      const effectiveColor = style === "decorado" ? "#5b3a1e" : color;
      const lineSpacing =
        style === "espacado" ? fontSize * lineHeight * 1.5 : fontSize * lineHeight;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objects: any[] = [];

      // Measure max width for centralizado
      let maxWidth = 0;
      const measurements: number[] = built.map((entry) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tmp = new f.IText(entry.text, {
          fontSize,
          fontFamily,
          fontStyle: italic ? "italic" : "normal",
        });
        const w = tmp.width || 0;
        if (w > maxWidth) maxWidth = w;
        return w;
      });

      built.forEach((entry, index) => {
        let x = entry.x;
        if (style === "centralizado") {
          x = (maxWidth - measurements[index]) / 2;
        }
        const y = index * lineSpacing;
        const isFirst = index === 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lineObj = new f.IText(entry.text, {
          left: x,
          top: y,
          fontSize,
          fontFamily,
          fill: effectiveColor,
          fontStyle: italic ? "italic" : "normal",
          fontWeight: boldFirst && isFirst ? "bold" : "normal",
          originX: "left",
          originY: "top",
        });
        objects.push(lineObj);
      });

      if (style === "decorado") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const topQuote = new f.IText("“", {
          left: 0,
          top: -fontSize * 1.8,
          fontSize: fontSize * 3,
          fontFamily,
          fill: "#5b3a1e",
          originX: "left",
          originY: "top",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bottomQuote = new f.IText("”", {
          left: maxWidth - fontSize * 1.5,
          top: built.length * lineSpacing,
          fontSize: fontSize * 3,
          fontFamily,
          fill: "#5b3a1e",
          originX: "left",
          originY: "top",
        });
        objects.unshift(topQuote);
        objects.push(bottomQuote);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const group = new f.Group(objects, {
        left: 100,
        top: 100,
        data: { poemLayout: true },
      });

      queueMicrotask(() => {
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        toast.success("Poema inserido");
      });
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all = canvas.getObjects() as any[];
    const targets = all.filter((o) => o?.data?.poemLayout === true);
    if (targets.length === 0) {
      toast.info("Nenhum poema para remover");
      return;
    }
    targets.forEach((o) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${targets.length} poema(s) removido(s)`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <AlignVerticalJustifyCenter className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Layout de Poema / Verso</h3>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Texto do poema</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          placeholder="Digite seu poema (uma linha por verso)..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Estilo do poema</label>
        <div className="grid grid-cols-2 gap-2">
          {POEM_STYLES.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant={style === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStyle(s.id)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">
          Altura de linha: {lineHeight.toFixed(2)}
        </label>
        <input
          type="range"
          min={1.0}
          max={3.0}
          step={0.1}
          value={lineHeight}
          onChange={(e) => setLineHeight(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">
          Largura do indentamento: {indentWidth}px
        </label>
        <input
          type="range"
          min={10}
          max={60}
          step={1}
          value={indentWidth}
          onChange={(e) => setIndentWidth(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Cor</label>
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-full p-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">
          Tamanho da fonte: {fontSize}px
        </label>
        <input
          type="range"
          min={16}
          max={48}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Fonte</label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={italic}
          onChange={(e) => setItalic(e.target.checked)}
        />
        Itálico
      </label>

      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={boldFirst}
          onChange={(e) => setBoldFirst(e.target.checked)}
        />
        Primeira linha em negrito
      </label>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleInsert}>
          Inserir Poema
        </Button>
        <Button type="button" variant="outline" onClick={handleRemove}>
          Remover Poemas
        </Button>
      </div>
    </div>
  );
}
