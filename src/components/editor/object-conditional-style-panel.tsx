"use client";

import { useEffect, useRef, useState } from "react";
import { Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ObjectConditionalStylePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type FindRule = "type" | "text" | "fill" | "size";

const OBJECT_TYPES = ["text", "image", "rect", "circle", "polygon", "path", "group"];

interface StyleConfig {
  applyFill: boolean;
  fill: string;
  applyStroke: boolean;
  stroke: string;
  applyStrokeWidth: boolean;
  strokeWidth: number;
  applyOpacity: boolean;
  opacity: number;
  applyRotation: boolean;
  rotationDelta: number;
  applyScale: boolean;
  scale: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchByType(obj: any, types: string[]): boolean {
  if (!obj || !obj.type) return false;
  return types.includes(String(obj.type).toLowerCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchByText(obj: any, query: string): boolean {
  if (!obj) return false;
  const type = String(obj.type || "").toLowerCase();
  if (!type.includes("text")) return false;
  const text = String(obj.text || "");
  if (!query) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchByFill(obj: any, color: string): boolean {
  if (!obj || !obj.fill) return false;
  return String(obj.fill).toLowerCase() === color.toLowerCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchBySize(obj: any, minW: number, maxW: number): boolean {
  if (!obj) return false;
  const w = Number(obj.width || 0) * Number(obj.scaleX || 1);
  return w >= minW && w <= maxW;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyStyles(obj: any, styles: StyleConfig): void {
  if (!obj) return;
  if (styles.applyFill) {
    obj.set("fill", styles.fill);
  }
  if (styles.applyStroke) {
    obj.set("stroke", styles.stroke);
  }
  if (styles.applyStrokeWidth) {
    obj.set("strokeWidth", styles.strokeWidth);
  }
  if (styles.applyOpacity) {
    obj.set("opacity", styles.opacity);
  }
  if (styles.applyRotation) {
    const currentAngle = Number(obj.angle || 0);
    obj.set("angle", currentAngle + styles.rotationDelta);
  }
  if (styles.applyScale) {
    obj.set("scaleX", Number(obj.scaleX || 1) * styles.scale);
    obj.set("scaleY", Number(obj.scaleY || 1) * styles.scale);
  }
  if (typeof obj.setCoords === "function") {
    obj.setCoords();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCanvasObjects(canvas: any): any[] {
  if (!canvas || typeof canvas.getObjects !== "function") return [];
  return canvas.getObjects();
}

export function ObjectConditionalStylePanel({ fabricCanvas }: ObjectConditionalStylePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightedRef = useRef<any[]>([]);

  const [rule, setRule] = useState<FindRule>("type");
  const [typeFilter, setTypeFilter] = useState<string>("text");
  const [textQuery, setTextQuery] = useState<string>("");
  const [fillQuery, setFillQuery] = useState<string>("#000000");
  const [minW, setMinW] = useState<number>(0);
  const [maxW, setMaxW] = useState<number>(1000);
  const [matchCount, setMatchCount] = useState<number>(0);

  const [styles, setStyles] = useState<StyleConfig>({
    applyFill: false,
    fill: "#ff0000",
    applyStroke: false,
    stroke: "#000000",
    applyStrokeWidth: false,
    strokeWidth: 2,
    applyOpacity: false,
    opacity: 1,
    applyRotation: false,
    rotationDelta: 0,
    applyScale: false,
    scale: 1,
  });

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getMatches(): any[] {
    const canvas = canvasRef.current;
    const objects = getCanvasObjects(canvas);
    if (rule === "type") {
      return objects.filter((o) => matchByType(o, [typeFilter]));
    }
    if (rule === "text") {
      return objects.filter((o) => matchByText(o, textQuery));
    }
    if (rule === "fill") {
      return objects.filter((o) => matchByFill(o, fillQuery));
    }
    return objects.filter((o) => matchBySize(o, minW, maxW));
  }

  function clearHighlight() {
    const prev = highlightedRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prev.forEach((entry: any) => {
      if (entry && entry.obj) {
        entry.obj.set("stroke", entry.stroke);
        entry.obj.set("strokeWidth", entry.strokeWidth);
        if (typeof entry.obj.setCoords === "function") entry.obj.setCoords();
      }
    });
    highlightedRef.current = [];
    const canvas = canvasRef.current;
    if (canvas && typeof canvas.requestRenderAll === "function") {
      canvas.requestRenderAll();
    }
  }

  function handleSearch() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    clearHighlight();
    const matches = getMatches();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracked: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matches.forEach((obj: any) => {
      tracked.push({
        obj,
        stroke: obj.stroke,
        strokeWidth: obj.strokeWidth,
      });
      obj.set("stroke", "#3b82f6");
      obj.set("strokeWidth", 3);
      if (typeof obj.setCoords === "function") obj.setCoords();
    });
    highlightedRef.current = tracked;
    setMatchCount(matches.length);
    if (typeof canvas.requestRenderAll === "function") {
      canvas.requestRenderAll();
    }
    toast.success(`${matches.length} objeto(s) encontrado(s)`);
  }

  function handleApply() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const matches = getMatches();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matches.forEach((obj: any) => applyStyles(obj, styles));
    if (typeof canvas.requestRenderAll === "function") {
      canvas.requestRenderAll();
    }
    toast.success(`Estilos aplicados a ${matches.length} objeto(s)`);
  }

  function handleClearHighlight() {
    clearHighlight();
    setMatchCount(0);
    toast.info("Seleção visual limpa");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Estilização Condicional</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Regra de busca</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={rule === "type" ? "default" : "outline"}
            size="sm"
            onClick={() => setRule("type")}
          >
            Por tipo
          </Button>
          <Button
            variant={rule === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setRule("text")}
          >
            Por texto
          </Button>
          <Button
            variant={rule === "fill" ? "default" : "outline"}
            size="sm"
            onClick={() => setRule("fill")}
          >
            Por cor de fill
          </Button>
          <Button
            variant={rule === "size" ? "default" : "outline"}
            size="sm"
            onClick={() => setRule("size")}
          >
            Por tamanho
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rule === "type" && (
          <>
            <span className="text-sm font-medium">Tipo de objeto</span>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {OBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </>
        )}

        {rule === "text" && (
          <>
            <span className="text-sm font-medium">Texto contém</span>
            <Input
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder="Digite o texto..."
            />
          </>
        )}

        {rule === "fill" && (
          <>
            <span className="text-sm font-medium">Cor de fill</span>
            <input
              type="color"
              className="h-10 w-full cursor-pointer rounded-md border border-input bg-background"
              value={fillQuery}
              onChange={(e) => setFillQuery(e.target.value)}
            />
          </>
        )}

        {rule === "size" && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Largura mínima</span>
            <Input
              type="number"
              value={minW}
              onChange={(e) => setMinW(Number(e.target.value))}
            />
            <span className="text-sm font-medium">Largura máxima</span>
            <Input
              type="number"
              value={maxW}
              onChange={(e) => setMaxW(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSearch} size="sm">
          Buscar
        </Button>
        <Badge variant="secondary">{matchCount} encontrado(s)</Badge>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <span className="text-sm font-semibold">Estilos a aplicar</span>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="apply-fill"
            checked={styles.applyFill}
            onChange={(e) => setStyles({ ...styles, applyFill: e.target.checked })}
          />
          <label htmlFor="apply-fill" className="text-sm flex-1">
            Fill
          </label>
          <input
            type="color"
            className="h-8 w-12 cursor-pointer rounded border"
            value={styles.fill}
            onChange={(e) => setStyles({ ...styles, fill: e.target.value })}
            disabled={!styles.applyFill}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="apply-stroke"
            checked={styles.applyStroke}
            onChange={(e) => setStyles({ ...styles, applyStroke: e.target.checked })}
          />
          <label htmlFor="apply-stroke" className="text-sm flex-1">
            Stroke
          </label>
          <input
            type="color"
            className="h-8 w-12 cursor-pointer rounded border"
            value={styles.stroke}
            onChange={(e) => setStyles({ ...styles, stroke: e.target.value })}
            disabled={!styles.applyStroke}
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apply-sw"
              checked={styles.applyStrokeWidth}
              onChange={(e) =>
                setStyles({ ...styles, applyStrokeWidth: e.target.checked })
              }
            />
            <label htmlFor="apply-sw" className="text-sm flex-1">
              Stroke Width: {styles.strokeWidth}
            </label>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={styles.strokeWidth}
            onChange={(e) =>
              setStyles({ ...styles, strokeWidth: Number(e.target.value) })
            }
            disabled={!styles.applyStrokeWidth}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apply-op"
              checked={styles.applyOpacity}
              onChange={(e) => setStyles({ ...styles, applyOpacity: e.target.checked })}
            />
            <label htmlFor="apply-op" className="text-sm flex-1">
              Opacidade: {styles.opacity.toFixed(2)}
            </label>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={styles.opacity}
            onChange={(e) => setStyles({ ...styles, opacity: Number(e.target.value) })}
            disabled={!styles.applyOpacity}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apply-rot"
              checked={styles.applyRotation}
              onChange={(e) =>
                setStyles({ ...styles, applyRotation: e.target.checked })
              }
            />
            <label htmlFor="apply-rot" className="text-sm flex-1">
              Rotação delta: {styles.rotationDelta}°
            </label>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={styles.rotationDelta}
            onChange={(e) =>
              setStyles({ ...styles, rotationDelta: Number(e.target.value) })
            }
            disabled={!styles.applyRotation}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apply-scale"
              checked={styles.applyScale}
              onChange={(e) => setStyles({ ...styles, applyScale: e.target.checked })}
            />
            <label htmlFor="apply-scale" className="text-sm flex-1">
              Escala: {styles.scale.toFixed(2)}x
            </label>
          </div>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.05}
            value={styles.scale}
            onChange={(e) => setStyles({ ...styles, scale: Number(e.target.value) })}
            disabled={!styles.applyScale}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t pt-4">
        <Button onClick={handleApply} className="w-full">
          Aplicar Estilos aos Objetos Encontrados
        </Button>
        <Button onClick={handleClearHighlight} variant="outline" className="w-full">
          Limpar Seleção Visual
        </Button>
      </div>
    </div>
  );
}
