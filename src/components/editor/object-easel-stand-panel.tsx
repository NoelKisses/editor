"use client";

import { useEffect, useRef, useState } from "react";
import { Gem } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectEaselStandPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type StandStyle =
  | "pedestal-classico"
  | "plataforma-moderna"
  | "cavalete"
  | "coluna-romana"
  | "podio";

const STAND_STYLES: { id: StandStyle; label: string; description: string }[] = [
  { id: "pedestal-classico", label: "Pedestal Clássico", description: "Base retangular com coluna" },
  { id: "plataforma-moderna", label: "Plataforma Moderna", description: "Plataforma com sombra 3D" },
  { id: "cavalete", label: "Cavalete", description: "Estilo cavalete de artista" },
  { id: "coluna-romana", label: "Coluna Romana", description: "Coluna com capitel e base" },
  { id: "podio", label: "Pódio", description: "Pódio de 3 degraus" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeShadow(f: any, enabled: boolean): any {
  if (!enabled) return null;
  return new f.Shadow({
    color: "rgba(0,0,0,0.4)",
    blur: 12,
    offsetX: 0,
    offsetY: 8,
  });
}

function buildPedestalClassico(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  shadow: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const baseH = h * 0.25;
  const colW = w * 0.55;
  const colH = h * 0.6;
  const topH = h * 0.15;

  const base = new f.Rect({
    left: x,
    top: y + h - baseH,
    width: w,
    height: baseH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  const column = new f.Rect({
    left: x + (w - colW) / 2,
    top: y + topH,
    width: colW,
    height: colH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  const top = new f.Rect({
    left: x,
    top: y,
    width: w,
    height: topH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  const group = new f.Group([base, column, top], {
    left: x,
    top: y,
    originX: "left",
    originY: "top",
  });

  const sh = makeShadow(f, shadow);
  if (sh) group.set("shadow", sh);
  return group;
}

function buildPlataformaModerna(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  shadow: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const platH = h * 0.4;
  const shadowH = h * 0.15;

  const platShadow = new f.Rect({
    left: x + w * 0.05,
    top: y + h - shadowH,
    width: w * 0.9,
    height: shadowH,
    fill: "rgba(0,0,0,0.25)",
    originX: "left",
    originY: "top",
  });

  const platform = new f.Rect({
    left: x,
    top: y + h - platH - shadowH,
    width: w,
    height: platH,
    fill: color,
    originX: "left",
    originY: "top",
    rx: 4,
    ry: 4,
  });

  const group = new f.Group([platShadow, platform], {
    left: x,
    top: y,
    originX: "left",
    originY: "top",
  });

  const sh = makeShadow(f, shadow);
  if (sh) group.set("shadow", sh);
  return group;
}

function buildCavalete(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  shadow: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const legThickness = Math.max(6, w * 0.04);

  const leftLeg = new f.Polygon(
    [
      { x: x + w * 0.5 - legThickness / 2, y: y },
      { x: x + w * 0.5 + legThickness / 2, y: y },
      { x: x + legThickness, y: y + h },
      { x: x, y: y + h },
    ],
    { fill: color, originX: "left", originY: "top" },
  );

  const rightLeg = new f.Polygon(
    [
      { x: x + w * 0.5 - legThickness / 2, y: y },
      { x: x + w * 0.5 + legThickness / 2, y: y },
      { x: x + w, y: y + h },
      { x: x + w - legThickness, y: y + h },
    ],
    { fill: color, originX: "left", originY: "top" },
  );

  const crossBar = new f.Rect({
    left: x + w * 0.2,
    top: y + h * 0.6,
    width: w * 0.6,
    height: Math.max(4, h * 0.04),
    fill: color,
    originX: "left",
    originY: "top",
  });

  const group = new f.Group([leftLeg, rightLeg, crossBar], {
    left: x,
    top: y,
    originX: "left",
    originY: "top",
  });

  const sh = makeShadow(f, shadow);
  if (sh) group.set("shadow", sh);
  return group;
}

function buildColunaRomana(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  shadow: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const baseH = h * 0.15;
  const capitalH = h * 0.15;
  const shaftH = h - baseH - capitalH;
  const shaftW = w * 0.5;

  const base = new f.Rect({
    left: x,
    top: y + h - baseH,
    width: w,
    height: baseH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  const shaft = new f.Rect({
    left: x + (w - shaftW) / 2,
    top: y + capitalH,
    width: shaftW,
    height: shaftH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  const capital = new f.Rect({
    left: x + w * 0.05,
    top: y,
    width: w * 0.9,
    height: capitalH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  // decorative fluting line on shaft
  const flute = new f.Rect({
    left: x + w / 2 - 1,
    top: y + capitalH,
    width: 2,
    height: shaftH,
    fill: "rgba(0,0,0,0.15)",
    originX: "left",
    originY: "top",
  });

  const group = new f.Group([base, shaft, flute, capital], {
    left: x,
    top: y,
    originX: "left",
    originY: "top",
  });

  const sh = makeShadow(f, shadow);
  if (sh) group.set("shadow", sh);
  return group;
}

function buildPodio(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  shadow: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const tierH = h / 3;

  const tier3 = new f.Rect({
    left: x,
    top: y + tierH * 2,
    width: w,
    height: tierH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  const tier2 = new f.Rect({
    left: x + w * 0.1,
    top: y + tierH,
    width: w * 0.8,
    height: tierH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  const tier1 = new f.Rect({
    left: x + w * 0.2,
    top: y,
    width: w * 0.6,
    height: tierH,
    fill: color,
    originX: "left",
    originY: "top",
  });

  const group = new f.Group([tier3, tier2, tier1], {
    left: x,
    top: y,
    originX: "left",
    originY: "top",
  });

  const sh = makeShadow(f, shadow);
  if (sh) group.set("shadow", sh);
  return group;
}

function buildStand(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  style: StandStyle,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  shadow: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  switch (style) {
    case "pedestal-classico":
      return buildPedestalClassico(f, x, y, w, h, color, shadow);
    case "plataforma-moderna":
      return buildPlataformaModerna(f, x, y, w, h, color, shadow);
    case "cavalete":
      return buildCavalete(f, x, y, w, h, color, shadow);
    case "coluna-romana":
      return buildColunaRomana(f, x, y, w, h, color, shadow);
    case "podio":
      return buildPodio(f, x, y, w, h, color, shadow);
    default:
      return buildPedestalClassico(f, x, y, w, h, color, shadow);
  }
}

export function ObjectEaselStandPanel({ fabricCanvas }: ObjectEaselStandPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [style, setStyle] = useState<StandStyle>("pedestal-classico");
  const [color, setColor] = useState<string>("#444444");
  const [width, setWidth] = useState<number>(200);
  const [height, setHeight] = useState<number>(100);
  const [shadow, setShadow] = useState<boolean>(true);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
    if (!fabricCanvas) return;

    const updateSelection = () => {
      const obj = fabricCanvas.getActiveObject();
      queueMicrotask(() => setHasSelection(!!obj));
    };

    updateSelection();
    fabricCanvas.on("selection:created", updateSelection);
    fabricCanvas.on("selection:updated", updateSelection);
    fabricCanvas.on("selection:cleared", updateSelection);

    return () => {
      fabricCanvas.off("selection:created", updateSelection);
      fabricCanvas.off("selection:updated", updateSelection);
      fabricCanvas.off("selection:cleared", updateSelection);
    };
  }, [fabricCanvas]);

  const handleAddStand = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    const obj = canvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione um objeto primeiro");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric ?? (m as any);
      const bound = obj.getBoundingRect(true, true);
      const standX = bound.left + bound.width / 2 - width / 2;
      const standY = bound.top + bound.height;

      const stand = buildStand(f, style, standX, standY, width, height, color, shadow);
      stand.set({
        selectable: true,
        data: { easelStand: true, parentName: obj.name ?? null },
      });

      canvas.add(stand);

      // Place behind the selected object
      const objects = canvas.getObjects();
      const objIndex = objects.indexOf(obj);
      if (objIndex >= 0 && typeof canvas.moveTo === "function") {
        canvas.moveTo(stand, objIndex);
      } else if (typeof stand.sendToBack === "function") {
        stand.sendToBack();
      } else if (typeof canvas.sendToBack === "function") {
        canvas.sendToBack(stand);
      }

      canvas.requestRenderAll();
      toast.success("Suporte adicionado");
    }).catch((err) => {
      toast.error(`Erro ao carregar fabric: ${err?.message ?? "desconhecido"}`);
    });
  };

  const handleRemoveStands = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stands = canvas.getObjects().filter((o: any) => o?.data?.easelStand === true);
    if (stands.length === 0) {
      toast.info("Nenhum suporte para remover");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stands.forEach((s: any) => canvas.remove(s));
    canvas.requestRenderAll();
    toast.success(`${stands.length} suporte(s) removido(s)`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <Gem className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Suporte / Pedestal</h3>
      </div>

      {!hasSelection && (
        <div className="rounded-md bg-yellow-100 p-2 text-sm text-yellow-900">
          Selecione um objeto no canvas para adicionar um suporte.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Estilo</span>
        <div className="grid grid-cols-2 gap-2">
          {STAND_STYLES.map((s) => {
            const styleId = s.id;
            return (
              <button
                key={styleId}
                type="button"
                onClick={() => setStyle(styleId)}
                className={`rounded-md border p-2 text-left text-xs transition ${
                  style === styleId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="font-medium">{s.label}</div>
                <div className="text-[10px] text-gray-500">{s.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Cor</span>
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
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Largura</span>
          <span className="text-gray-500">{width}px</span>
        </div>
        <input
          type="range"
          min={50}
          max={400}
          step={1}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Altura</span>
          <span className="text-gray-500">{height}px</span>
        </div>
        <input
          type="range"
          min={50}
          max={300}
          step={1}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={shadow}
          onChange={(e) => setShadow(e.target.checked)}
          className="h-4 w-4"
        />
        <span>Adicionar sombra</span>
      </label>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={handleAddStand} disabled={!hasSelection}>
          Adicionar Suporte
        </Button>
        <Button type="button" variant="outline" onClick={handleRemoveStands}>
          Remover Suportes
        </Button>
      </div>
    </div>
  );
}
