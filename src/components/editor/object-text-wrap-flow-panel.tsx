"use client";

import { useEffect, useRef, useState } from "react";
import { Wind } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ObjectTextWrapFlowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type WrapStyle = "around" | "left" | "right";

interface ObstacleBbox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const DEFAULT_LOREM =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi consequatur";

function splitTextIntoLines(
  words: string[],
  approxCharsPerLine: number,
): string[] {
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current.length === 0 ? w : `${current} ${w}`;
    if (candidate.length > approxCharsPerLine && current.length > 0) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function computeLineSegments(
  yPos: number,
  obstacleBbox: ObstacleBbox | null,
  columnWidth: number,
  padding: number,
  wrapStyle: WrapStyle,
  startX: number,
): Array<{ x: number; w: number }> {
  if (!obstacleBbox) {
    return [{ x: startX, w: columnWidth }];
  }
  const obsTop = obstacleBbox.top - padding;
  const obsBottom = obstacleBbox.top + obstacleBbox.height + padding;
  const obsLeft = obstacleBbox.left - padding;
  const obsRight = obstacleBbox.left + obstacleBbox.width + padding;

  const intersects = yPos >= obsTop && yPos <= obsBottom;
  if (!intersects) {
    return [{ x: startX, w: columnWidth }];
  }

  const columnEnd = startX + columnWidth;

  if (wrapStyle === "left") {
    const w = Math.max(0, obsLeft - startX);
    return w > 20 ? [{ x: startX, w }] : [];
  }
  if (wrapStyle === "right") {
    const x = Math.max(startX, obsRight);
    const w = Math.max(0, columnEnd - x);
    return w > 20 ? [{ x, w }] : [];
  }
  // around (both sides)
  const segments: Array<{ x: number; w: number }> = [];
  const leftW = Math.max(0, obsLeft - startX);
  if (leftW > 20) segments.push({ x: startX, w: leftW });
  const rightX = Math.max(startX, obsRight);
  const rightW = Math.max(0, columnEnd - rightX);
  if (rightW > 20) segments.push({ x: rightX, w: rightW });
  return segments;
}

export function ObjectTextWrapFlowPanel({
  fabricCanvas,
}: ObjectTextWrapFlowPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [text, setText] = useState(DEFAULT_LOREM);
  const [wrapStyle, setWrapStyle] = useState<WrapStyle>("around");
  const [columnWidth, setColumnWidth] = useState(400);
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [padding, setPadding] = useState(15);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active) {
      toast.error("Selecione um objeto para servir como obstáculo");
      return;
    }

    const bounds = active.getBoundingRect
      ? active.getBoundingRect()
      : {
          left: active.left ?? 0,
          top: active.top ?? 0,
          width: (active.width ?? 0) * (active.scaleX ?? 1),
          height: (active.height ?? 0) * (active.scaleY ?? 1),
        };

    const obstacleBbox: ObstacleBbox = {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    };

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric ?? (m as any);
      const words = text.trim().split(/\s+/);
      const approxCharWidth = fontSize * 0.55;
      const lineHeightPx = fontSize * lineHeight;

      // Start text column to the left of obstacle, aligned with it vertically near top
      const startX = obstacleBbox.left - columnWidth / 2 + obstacleBbox.width / 2 - columnWidth / 2;
      const baseX = Math.max(20, startX);
      const baseY = Math.max(20, obstacleBbox.top - 40);

      // Pre-split entire text into "long" lines using full column width, then re-flow per line
      const approxCharsFullLine = Math.max(
        10,
        Math.floor(columnWidth / approxCharWidth),
      );
      const fullLines = splitTextIntoLines(words, approxCharsFullLine);

      // Re-flow word-by-word against segments
      const wordQueue = [...words];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lineObjects: any[] = [];
      let yPos = baseY;
      const maxLines = fullLines.length * 3 + 50;
      let safety = 0;

      while (wordQueue.length > 0 && safety < maxLines) {
        safety++;
        const segments = computeLineSegments(
          yPos,
          obstacleBbox,
          columnWidth,
          padding,
          wrapStyle,
          baseX,
        );

        if (segments.length === 0) {
          yPos += lineHeightPx;
          continue;
        }

        for (const seg of segments) {
          if (wordQueue.length === 0) break;
          const charsForSeg = Math.max(
            3,
            Math.floor(seg.w / approxCharWidth),
          );
          let lineStr = "";
          while (wordQueue.length > 0) {
            const next = wordQueue[0];
            const candidate =
              lineStr.length === 0 ? next : `${lineStr} ${next}`;
            if (candidate.length > charsForSeg && lineStr.length > 0) break;
            lineStr = candidate;
            wordQueue.shift();
          }
          if (lineStr.length === 0) continue;

          const iText = new f.IText(lineStr, {
            left: seg.x,
            top: yPos,
            fontSize,
            fill: textColor,
            fontFamily: "Arial",
            selectable: false,
            evented: false,
          });
          lineObjects.push(iText);
        }

        yPos += lineHeightPx;
      }

      if (lineObjects.length === 0) {
        toast.error("Nenhuma linha gerada");
        return;
      }

      const group = new f.Group(lineObjects, {
        data: { textWrap: true },
        selectable: true,
        evented: true,
      });

      canvas.add(group);
      canvas.requestRenderAll();
      toast.success(`Texto wrap gerado (${lineObjects.length} linhas)`);
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const objects = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) => o.data && o.data.textWrap === true,
    );
    if (toRemove.length === 0) {
      toast.info("Nenhum texto wrap encontrado");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} grupo(s) wrap removido(s)`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Wind className="h-5 w-5" />
        <h3 className="text-sm font-semibold">
          Texto Fluindo ao Redor (Wrap)
        </h3>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="wrap-text">
          Texto
        </label>
        <textarea
          id="wrap-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium">Estilo de Wrap</span>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={wrapStyle === "around" ? "default" : "outline"}
            size="sm"
            onClick={() => setWrapStyle("around")}
          >
            Ao Redor
          </Button>
          <Button
            variant={wrapStyle === "left" ? "default" : "outline"}
            size="sm"
            onClick={() => setWrapStyle("left")}
          >
            À Esquerda
          </Button>
          <Button
            variant={wrapStyle === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => setWrapStyle("right")}
          >
            À Direita
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="wrap-col-width">
          Largura da Coluna: {columnWidth}px
        </label>
        <input
          id="wrap-col-width"
          type="range"
          min={200}
          max={700}
          step={10}
          value={columnWidth}
          onChange={(e) => setColumnWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="wrap-font-size">
          Tamanho da Fonte: {fontSize}px
        </label>
        <input
          id="wrap-font-size"
          type="range"
          min={10}
          max={24}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="wrap-line-height">
          Altura da Linha: {lineHeight.toFixed(2)}
        </label>
        <input
          id="wrap-line-height"
          type="range"
          min={1.1}
          max={2.0}
          step={0.05}
          value={lineHeight}
          onChange={(e) => setLineHeight(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="wrap-text-color">
          Cor do Texto
        </label>
        <Input
          id="wrap-text-color"
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="wrap-padding">
          Padding ao Redor do Obstáculo: {padding}px
        </label>
        <input
          id="wrap-padding"
          type="range"
          min={5}
          max={40}
          step={1}
          value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleGenerate} size="sm">
          Gerar Texto Wrap
        </Button>
        <Button onClick={handleRemove} variant="outline" size="sm">
          Remover Wrap
        </Button>
      </div>
    </div>
  );
}
