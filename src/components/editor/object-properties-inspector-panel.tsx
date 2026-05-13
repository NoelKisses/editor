"use client";

import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ObjectPropertiesInspectorPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ObjProps {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  flipX: boolean;
  flipY: boolean;
  selectable: boolean;
  visible: boolean;
  shadow: string | null;
  skewX: number;
  skewY: number;
}

function PropRow({ label, value, onCopy }: { label: string; value: string | number | boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between py-0.5 group">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-[9px] font-mono tabular-nums max-w-[100px] truncate">{String(value)}</span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copiar valor"
          >
            <Copy className="w-2.5 h-2.5 text-muted-foreground hover:text-primary" />
          </button>
        )}
      </div>
    </div>
  );
}

function EditableRow({ label, field, value, onChange, type = "number" }: {
  label: string;
  field: string;
  value: number;
  onChange: (field: string, val: number) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(field, Number(e.target.value))}
        className="w-20 bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[9px] font-mono tabular-nums focus:outline-none focus:border-primary text-right"
      />
    </div>
  );
}

export function ObjectPropertiesInspectorPanel({ fabricCanvas, selectionVersion }: ObjectPropertiesInspectorPanelProps) {
  const [props, setProps] = useState<ObjProps | null>(null);

  const readProps = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { setProps(null); return; }

    const br = obj.getBoundingRect?.() ?? { width: 0, height: 0 };
    const shadow = obj.shadow
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? `${(obj.shadow as any).offsetX ?? 0}px ${(obj.shadow as any).offsetY ?? 0}px ${(obj.shadow as any).blur ?? 0}px`
      : null;

    setProps({
      type: obj.type ?? "unknown",
      left: Math.round(obj.left ?? 0),
      top: Math.round(obj.top ?? 0),
      width: Math.round(br.width),
      height: Math.round(br.height),
      scaleX: parseFloat((obj.scaleX ?? 1).toFixed(3)),
      scaleY: parseFloat((obj.scaleY ?? 1).toFixed(3)),
      angle: Math.round(obj.angle ?? 0),
      opacity: Math.round((obj.opacity ?? 1) * 100),
      fill: typeof obj.fill === "string" ? obj.fill : "gradient",
      stroke: obj.stroke ?? "",
      strokeWidth: obj.strokeWidth ?? 0,
      flipX: obj.flipX ?? false,
      flipY: obj.flipY ?? false,
      selectable: obj.selectable ?? true,
      visible: obj.visible ?? true,
      shadow,
      skewX: Math.round(obj.skewX ?? 0),
      skewY: Math.round(obj.skewY ?? 0),
    });
  }, [fabricCanvas]);

  useEffect(() => {
    void selectionVersion;
    queueMicrotask(readProps);
  }, [fabricCanvas, selectionVersion, readProps]);

  const applyProp = useCallback((field: string, val: number) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;

    const mapped: Record<string, string> = { opacity: "opacity" };
    const fabricField = mapped[field] ?? field;

    // opacity stored as 0-1 in fabric
    const fabricVal = field === "opacity" ? val / 100 : val;
    obj.set({ [fabricField]: fabricVal });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setProps(p => p ? { ...p, [field]: val } : p);
  }, [fabricCanvas]);

  const copy = useCallback((val: string | number | boolean) => {
    navigator.clipboard.writeText(String(val)).catch(() => {});
    toast.success("Valor copiado");
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Inspetor</span>
        </div>
        <button
          onClick={readProps}
          className="text-[9px] text-muted-foreground hover:text-primary transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {!props ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <SlidersHorizontal className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para inspecionar</p>
        </div>
      ) : (
        <>
          {/* Type */}
          <div className="px-2 py-1 rounded bg-primary/10 text-center">
            <span className="text-[10px] text-primary font-mono">{props.type}</span>
          </div>

          {/* Position & Size */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Posição e Tamanho</span>
            <EditableRow label="X (left)" field="left" value={props.left} onChange={applyProp} />
            <EditableRow label="Y (top)" field="top" value={props.top} onChange={applyProp} />
            <PropRow label="Largura (bounding)" value={`${props.width}px`} onCopy={() => copy(props.width)} />
            <PropRow label="Altura (bounding)" value={`${props.height}px`} onCopy={() => copy(props.height)} />
          </div>

          {/* Transform */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Transformação</span>
            <EditableRow label="Rotação" field="angle" value={props.angle} onChange={applyProp} />
            <EditableRow label="Scale X" field="scaleX" value={props.scaleX} onChange={applyProp} />
            <EditableRow label="Scale Y" field="scaleY" value={props.scaleY} onChange={applyProp} />
            <EditableRow label="Skew X" field="skewX" value={props.skewX} onChange={applyProp} />
            <EditableRow label="Skew Y" field="skewY" value={props.skewY} onChange={applyProp} />
          </div>

          {/* Appearance */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Aparência</span>
            <EditableRow label="Opacidade (%)" field="opacity" value={props.opacity} onChange={applyProp} />
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[9px] text-muted-foreground">Fill</span>
              <div className="flex items-center gap-1.5">
                {props.fill && props.fill !== "gradient" && (
                  <div className="w-4 h-4 rounded-sm border border-border/50" style={{ background: props.fill }} />
                )}
                <span className="text-[9px] font-mono truncate max-w-[80px]">{props.fill || "—"}</span>
                <button onClick={() => copy(props.fill)} className="opacity-60 hover:opacity-100">
                  <Copy className="w-2.5 h-2.5 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[9px] text-muted-foreground">Stroke</span>
              <div className="flex items-center gap-1.5">
                {props.stroke && (
                  <div className="w-4 h-4 rounded-sm border border-border/50" style={{ background: props.stroke }} />
                )}
                <span className="text-[9px] font-mono truncate max-w-[80px]">{props.stroke || "—"}</span>
              </div>
            </div>
            <PropRow label="Espessura stroke" value={`${props.strokeWidth}px`} />
            {props.shadow && <PropRow label="Sombra" value={props.shadow} onCopy={() => copy(props.shadow!)} />}
          </div>

          {/* State flags */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Estado</span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: "Flip X", value: props.flipX },
                { label: "Flip Y", value: props.flipY },
                { label: "Selecionável", value: props.selectable },
                { label: "Visível", value: props.visible },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1 px-1.5 py-1 rounded bg-muted/30">
                  <div className={`w-1.5 h-1.5 rounded-full ${value ? "bg-green-400" : "bg-muted-foreground/30"}`} />
                  <span className="text-[8px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
