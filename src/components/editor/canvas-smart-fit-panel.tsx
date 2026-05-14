"use client";

import { useCallback, useEffect, useState } from "react";
import { Maximize, AlignCenter, ShrinkIcon, Expand, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

interface CanvasSmartFitPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type FitMode = "contain" | "cover" | "fill" | "center" | "tile";
type AlignAnchor = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

const FIT_MODES: { value: FitMode; label: string; desc: string }[] = [
  { value: "contain", label: "Conter", desc: "Cabe inteiro mantendo proporção" },
  { value: "cover", label: "Cobrir", desc: "Preenche o canvas mantendo proporção" },
  { value: "fill", label: "Esticar", desc: "Preenche exatamente (distorce)" },
  { value: "center", label: "Centralizar", desc: "Centraliza sem redimensionar" },
  { value: "tile", label: "Ladrilhar", desc: "Repete o objeto em grade" },
];

const ANCHORS: { value: AlignAnchor; label: string }[] = [
  { value: "tl", label: "↖" }, { value: "tc", label: "↑" }, { value: "tr", label: "↗" },
  { value: "ml", label: "←" }, { value: "mc", label: "⊙" }, { value: "mr", label: "→" },
  { value: "bl", label: "↙" }, { value: "bc", label: "↓" }, { value: "br", label: "↘" },
];

function getAnchorOffset(anchor: AlignAnchor, cw: number, ch: number, ow: number, oh: number) {
  const map: Record<AlignAnchor, { x: number; y: number }> = {
    tl: { x: 0, y: 0 },
    tc: { x: (cw - ow) / 2, y: 0 },
    tr: { x: cw - ow, y: 0 },
    ml: { x: 0, y: (ch - oh) / 2 },
    mc: { x: (cw - ow) / 2, y: (ch - oh) / 2 },
    mr: { x: cw - ow, y: (ch - oh) / 2 },
    bl: { x: 0, y: ch - oh },
    bc: { x: (cw - ow) / 2, y: ch - oh },
    br: { x: cw - ow, y: ch - oh },
  };
  return map[anchor];
}

export function CanvasSmartFitPanel({ fabricCanvas, selectionVersion }: CanvasSmartFitPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>("contain");
  const [anchor, setAnchor] = useState<AlignAnchor>("mc");
  const [tileColumns, setTileColumns] = useState(3);
  const [tileRows, setTileRows] = useState(3);
  const [tileGap, setTileGap] = useState(10);
  const [applyToAll, setApplyToAll] = useState(false);
  const [margin, setMargin] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj);
    });
  }, [fabricCanvas, selectionVersion]);

  const getCanvas = useCallback(() => fabricCanvas, [fabricCanvas]);

  const fitObject = useCallback((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj: any,
    mode: FitMode,
    cv: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  ) => {
    const cw = cv.getWidth() / cv.getZoom() - margin * 2;
    const ch = cv.getHeight() / cv.getZoom() - margin * 2;
    const nw = obj.width ?? 1;
    const nh = obj.height ?? 1;

    if (mode === "contain") {
      const scale = Math.min(cw / nw, ch / nh);
      obj.set({ scaleX: scale, scaleY: scale });
    } else if (mode === "cover") {
      const scale = Math.max(cw / nw, ch / nh);
      obj.set({ scaleX: scale, scaleY: scale });
    } else if (mode === "fill") {
      obj.set({ scaleX: cw / nw, scaleY: ch / nh });
    } else if (mode === "center") {
      // No resize — just center
    }

    const ow = obj.getScaledWidth();
    const oh = obj.getScaledHeight();
    const { x, y } = getAnchorOffset(anchor, cw, ch, ow, oh);
    obj.set({ left: x + margin, top: y + margin });
    obj.setCoords();
  }, [anchor, margin]);

  const applyFit = useCallback(() => {
    const cv = getCanvas();
    if (!cv) { toast.error("Canvas não disponível"); return; }

    if (fitMode === "tile") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = cv.getActiveObject();
      if (!obj) { toast.error("Selecione um objeto"); return; }

      const cw = cv.getWidth() / cv.getZoom();
      const ch = cv.getHeight() / cv.getZoom();
      const cellW = (cw - tileGap * (tileColumns + 1)) / tileColumns;
      const cellH = (ch - tileGap * (tileRows + 1)) / tileRows;

      import("fabric").then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = m.fabric as any;
        for (let r = 0; r < tileRows; r++) {
          for (let c = 0; c < tileColumns; c++) {
            if (r === 0 && c === 0) {
              const scale = Math.min(cellW / (obj.width ?? 1), cellH / (obj.height ?? 1));
              obj.set({
                scaleX: scale, scaleY: scale,
                left: tileGap + c * (cellW + tileGap),
                top: tileGap + r * (cellH + tileGap),
              });
              obj.setCoords();
            } else {
              obj.clone((clone: unknown) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const cl = clone as any;
                const scale = Math.min(cellW / (cl.width ?? 1), cellH / (cl.height ?? 1));
                cl.set({
                  scaleX: scale, scaleY: scale,
                  left: tileGap + c * (cellW + tileGap),
                  top: tileGap + r * (cellH + tileGap),
                });
                cl.setCoords();
                cv.add(cl);
              });
            }
          }
        }
        cv.requestRenderAll();
        toast.success(`Ladrilhado: ${tileRows}×${tileColumns}`);
      });
      return;
    }

    if (applyToAll) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objs = cv.getObjects().filter((o: any) => o.selectable !== false);
      objs.forEach((o: unknown) => fitObject(o, fitMode, cv));
      cv.requestRenderAll();
      toast.success(`Ajuste "${fitMode}" aplicado a ${objs.length} objeto(s)`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = cv.getActiveObject();
      if (!obj) { toast.error("Selecione um objeto"); return; }
      fitObject(obj, fitMode, cv);
      cv.requestRenderAll();
      toast.success(`Ajuste "${fitMode}" aplicado`);
    }
  }, [getCanvas, fitMode, applyToAll, fitObject, tileColumns, tileRows, tileGap]);

  const fitAll = useCallback(() => {
    const cv = getCanvas();
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = cv.getObjects().filter((o: any) => o.selectable !== false);
    if (!objs.length) { toast.error("Nenhum objeto no canvas"); return; }
    const cw = cv.getWidth() / cv.getZoom() - margin * 2;
    const ch = cv.getHeight() / cv.getZoom() - margin * 2;
    const n = objs.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cellW = (cw - tileGap * (cols + 1)) / cols;
    const cellH = (ch - tileGap * (rows + 1)) / rows;
    objs.forEach((obj: unknown, i: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o = obj as any;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const scale = Math.min(cellW / (o.width ?? 1), cellH / (o.height ?? 1));
      o.set({
        scaleX: scale, scaleY: scale,
        left: margin + tileGap + col * (cellW + tileGap),
        top: margin + tileGap + row * (cellH + tileGap),
      });
      o.setCoords();
    });
    cv.requestRenderAll();
    toast.success(`${n} objetos distribuídos em grade ${rows}×${cols}`);
  }, [getCanvas, margin, tileGap]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Maximize className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Ajuste Inteligente</span>
      </div>

      {/* Fit modes */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Modo de ajuste</span>
        {FIT_MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setFitMode(m.value)}
            className={`flex items-center justify-between px-2 py-1.5 rounded border text-[8px] transition-colors ${
              fitMode === m.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span className="font-medium">{m.label}</span>
            <span className="text-[7px] opacity-70">{m.desc}</span>
          </button>
        ))}
      </div>

      {/* Anchor grid (not for tile mode) */}
      {fitMode !== "tile" && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Âncora de posicionamento</span>
          <div className="grid grid-cols-3 gap-0.5 w-24">
            {ANCHORS.map((a) => (
              <button
                key={a.value}
                onClick={() => setAnchor(a.value)}
                className={`h-7 rounded border text-[10px] font-mono transition-colors ${
                  anchor === a.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tile options */}
      {fitMode === "tile" && (
        <div className="flex flex-col gap-2 p-2 rounded border border-border">
          <span className="text-[9px] text-muted-foreground font-medium">Configuração de grade</span>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-muted-foreground">Colunas</span>
              <input type="number" min={1} max={10} value={tileColumns}
                onChange={(e) => setTileColumns(Number(e.target.value))}
                className="bg-muted/50 border border-border rounded px-1 py-1 text-[9px] focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-muted-foreground">Linhas</span>
              <input type="number" min={1} max={10} value={tileRows}
                onChange={(e) => setTileRows(Number(e.target.value))}
                className="bg-muted/50 border border-border rounded px-1 py-1 text-[9px] focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-muted-foreground">Espaço</span>
              <input type="number" min={0} max={50} value={tileGap}
                onChange={(e) => setTileGap(Number(e.target.value))}
                className="bg-muted/50 border border-border rounded px-1 py-1 text-[9px] focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Margin */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Margem</span>
        <input type="number" min={0} max={200} step={5} value={margin}
          onChange={(e) => setMargin(Number(e.target.value))}
          className="w-16 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
        <span className="text-[8px] text-muted-foreground">px</span>
      </div>

      {/* Apply all toggle */}
      {fitMode !== "tile" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)}
            className="accent-primary w-3 h-3" />
          <span className="text-[8px]">Aplicar a todos os objetos</span>
        </label>
      )}

      {/* Actions */}
      <button onClick={applyFit} disabled={!hasObject && !applyToAll && fitMode !== "tile"}
        className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40">
        {fitMode === "tile" ? <LayoutGrid className="w-3 h-3" /> : <AlignCenter className="w-3 h-3" />}
        {fitMode === "tile" ? `Ladrilhar (${tileRows}×${tileColumns})` : `Ajustar — ${FIT_MODES.find(m => m.value === fitMode)?.label}`}
      </button>

      <button onClick={fitAll}
        className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors">
        <Expand className="w-3 h-3" /> Distribuir todos em grade
      </button>

      <button
        onClick={() => {
          const cv = getCanvas();
          if (!cv) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const obj: any = cv.getActiveObject();
          if (!obj) { toast.error("Selecione um objeto"); return; }
          const cw = cv.getWidth() / cv.getZoom();
          const ch = cv.getHeight() / cv.getZoom();
          obj.set({ scaleX: 1, scaleY: 1, left: (cw - (obj.width ?? 0)) / 2, top: (ch - (obj.height ?? 0)) / 2 });
          obj.setCoords();
          cv.requestRenderAll();
          toast.success("Escala 1:1 e centralizado");
        }}
        disabled={!hasObject}
        className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40"
      >
        <ShrinkIcon className="w-3 h-3" /> Escala 1:1 e centralizar
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Conter/Cobrir preservam proporções · Esticar distorce · Ladrilhar cria cópias
      </p>
    </div>
  );
}
