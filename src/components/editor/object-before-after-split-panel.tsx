"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectBeforeAfterSplitPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type SplitMode = "vertical" | "horizontal" | "diagonal" | "circular";

function buildLabel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  text: string,
  left: number,
  top: number,
  color: string,
  bg: string,
) {
  return new f.IText(text, {
    left,
    top,
    fontSize: 28,
    fontWeight: "bold",
    fill: color,
    backgroundColor: bg,
    originX: "center",
    originY: "center",
    padding: 8,
    selectable: false,
    evented: false,
  });
}

function buildVerticalSplit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  posPct: number,
  leftLabel: string,
  rightLabel: string,
  labelColor: string,
  labelBg: string,
  dividerColor: string,
  dividerWidth: number,
  showLabels: boolean,
  showDivider: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const x = (w * posPct) / 100;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = [];
  if (showDivider) {
    const line = new f.Line([x, 0, x, h], {
      stroke: dividerColor,
      strokeWidth: dividerWidth,
      selectable: false,
      evented: false,
    });
    items.push(line);
  }
  if (showLabels) {
    items.push(buildLabel(f, leftLabel, x / 2, 40, labelColor, labelBg));
    items.push(
      buildLabel(f, rightLabel, x + (w - x) / 2, 40, labelColor, labelBg),
    );
  }
  return new f.Group(items, {
    selectable: false,
    evented: true,
    data: { beforeAfterSplit: true },
  });
}

function buildHorizontalSplit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  posPct: number,
  leftLabel: string,
  rightLabel: string,
  labelColor: string,
  labelBg: string,
  dividerColor: string,
  dividerWidth: number,
  showLabels: boolean,
  showDivider: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const y = (h * posPct) / 100;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = [];
  if (showDivider) {
    const line = new f.Line([0, y, w, y], {
      stroke: dividerColor,
      strokeWidth: dividerWidth,
      selectable: false,
      evented: false,
    });
    items.push(line);
  }
  if (showLabels) {
    items.push(buildLabel(f, leftLabel, w / 2, y / 2, labelColor, labelBg));
    items.push(
      buildLabel(f, rightLabel, w / 2, y + (h - y) / 2, labelColor, labelBg),
    );
  }
  return new f.Group(items, {
    selectable: false,
    evented: true,
    data: { beforeAfterSplit: true },
  });
}

function buildDiagonalSplit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  _posPct: number,
  leftLabel: string,
  rightLabel: string,
  labelColor: string,
  labelBg: string,
  dividerColor: string,
  dividerWidth: number,
  showLabels: boolean,
  showDivider: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = [];
  if (showDivider) {
    const line = new f.Line([0, 0, w, h], {
      stroke: dividerColor,
      strokeWidth: dividerWidth,
      selectable: false,
      evented: false,
    });
    items.push(line);
  }
  if (showLabels) {
    items.push(buildLabel(f, leftLabel, w * 0.25, h * 0.75, labelColor, labelBg));
    items.push(
      buildLabel(f, rightLabel, w * 0.75, h * 0.25, labelColor, labelBg),
    );
  }
  return new f.Group(items, {
    selectable: false,
    evented: true,
    data: { beforeAfterSplit: true },
  });
}

function buildCircularSplit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  posPct: number,
  leftLabel: string,
  rightLabel: string,
  labelColor: string,
  labelBg: string,
  dividerColor: string,
  dividerWidth: number,
  showLabels: boolean,
  showDivider: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const radius = (Math.min(w, h) * posPct) / 200;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = [];
  if (showDivider) {
    const circle = new f.Circle({
      left: w / 2,
      top: h / 2,
      radius,
      fill: "transparent",
      stroke: dividerColor,
      strokeWidth: dividerWidth,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    items.push(circle);
  }
  if (showLabels) {
    items.push(buildLabel(f, rightLabel, w / 2, h / 2, labelColor, labelBg));
    items.push(buildLabel(f, leftLabel, w / 2, h - 40, labelColor, labelBg));
  }
  return new f.Group(items, {
    selectable: false,
    evented: true,
    data: { beforeAfterSplit: true },
  });
}

export function ObjectBeforeAfterSplitPanel({
  fabricCanvas,
}: ObjectBeforeAfterSplitPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [mode, setMode] = useState<SplitMode>("vertical");
  const [splitPos, setSplitPos] = useState(50);
  const [leftLabel, setLeftLabel] = useState("ANTES");
  const [rightLabel, setRightLabel] = useState("DEPOIS");
  const [labelColor, setLabelColor] = useState("#ffffff");
  const [labelBg, setLabelBg] = useState("rgba(0,0,0,0.6)");
  const [dividerColor, setDividerColor] = useState("#ffffff");
  const [dividerWidth, setDividerWidth] = useState(4);
  const [showLabels, setShowLabels] = useState(true);
  const [showDivider, setShowDivider] = useState(true);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleCreate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const w = canvas.getWidth();
      const h = canvas.getHeight();

      // Remove existing splits first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = canvas.getObjects().filter((o: any) => o.data?.beforeAfterSplit);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing.forEach((o: any) => canvas.remove(o));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let group: any;
      const args = [
        f,
        w,
        h,
        splitPos,
        leftLabel,
        rightLabel,
        labelColor,
        labelBg,
        dividerColor,
        dividerWidth,
        showLabels,
        showDivider,
      ] as const;

      if (mode === "vertical") {
        group = buildVerticalSplit(...args);
      } else if (mode === "horizontal") {
        group = buildHorizontalSplit(...args);
      } else if (mode === "diagonal") {
        group = buildDiagonalSplit(...args);
      } else {
        group = buildCircularSplit(...args);
      }

      canvas.add(group);
      canvas.renderAll();
      toast.success("Split criado");
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    import("fabric").then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const splits = canvas.getObjects().filter((o: any) => o.data?.beforeAfterSplit);
      if (splits.length === 0) {
        toast.info("Nenhum split para remover");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      splits.forEach((o: any) => canvas.remove(o));
      canvas.renderAll();
      toast.success("Split removido");
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Antes / Depois (Split)</h3>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium">Modo de Split</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "vertical" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("vertical")}
          >
            Vertical
          </Button>
          <Button
            type="button"
            variant={mode === "horizontal" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("horizontal")}
          >
            Horizontal
          </Button>
          <Button
            type="button"
            variant={mode === "diagonal" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("diagonal")}
          >
            Diagonal
          </Button>
          <Button
            type="button"
            variant={mode === "circular" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("circular")}
          >
            Circular
          </Button>
        </div>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">
          Posição do Split: {splitPos}%
        </span>
        <input
          type="range"
          min={10}
          max={90}
          value={splitPos}
          onChange={(e) => setSplitPos(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="mb-1 block text-xs font-medium">Label Esquerda</span>
          <Input
            value={leftLabel}
            onChange={(e) => setLeftLabel(e.target.value)}
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium">Label Direita</span>
          <Input
            value={rightLabel}
            onChange={(e) => setRightLabel(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="mb-1 block text-xs font-medium">Cor do Texto</span>
          <input
            type="color"
            value={labelColor}
            onChange={(e) => setLabelColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium">Fundo do Label</span>
          <Input
            value={labelBg}
            onChange={(e) => setLabelBg(e.target.value)}
            placeholder="rgba(0,0,0,0.6)"
          />
        </div>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">Cor do Divisor</span>
        <input
          type="color"
          value={dividerColor}
          onChange={(e) => setDividerColor(e.target.value)}
          className="h-9 w-full cursor-pointer rounded border"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">
          Largura do Divisor: {dividerWidth}px
        </span>
        <input
          type="range"
          min={2}
          max={10}
          value={dividerWidth}
          onChange={(e) => setDividerWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Mostrar Labels</span>
        <input
          type="checkbox"
          checked={showLabels}
          onChange={(e) => setShowLabels(e.target.checked)}
          className="h-4 w-4 cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Mostrar Divisor</span>
        <input
          type="checkbox"
          checked={showDivider}
          onChange={(e) => setShowDivider(e.target.checked)}
          className="h-4 w-4 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={handleCreate} className="w-full">
          Criar Split
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRemove}
          className="w-full"
        >
          Remover Split
        </Button>
      </div>
    </div>
  );
}
