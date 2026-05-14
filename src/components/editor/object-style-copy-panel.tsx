"use client";

import { useCallback, useEffect, useState } from "react";
import { Pipette, Paintbrush2, RotateCcw, Copy } from "lucide-react";
import { toast } from "sonner";

interface ObjectStyleCopyPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface CopiedStyle {
  fill?: unknown;
  stroke?: unknown;
  strokeWidth?: number;
  opacity?: number;
  shadow?: unknown;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  charSpacing?: number;
  underline?: boolean;
  linethrough?: boolean;
  rx?: number;
  ry?: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
  flipX?: boolean;
  flipY?: boolean;
}

const STYLE_GROUPS = {
  appearance: ["fill", "stroke", "strokeWidth", "opacity"],
  shadow: ["shadow"],
  text: ["fontFamily", "fontSize", "fontWeight", "fontStyle", "textAlign", "lineHeight", "charSpacing", "underline", "linethrough"],
  shape: ["rx", "ry"],
  transform: ["angle", "scaleX", "scaleY", "flipX", "flipY"],
};

const GROUP_LABELS: Record<string, string> = {
  appearance: "Aparência (cor, contorno, opacidade)",
  shadow: "Sombra",
  text: "Texto (fonte, tamanho, alinhamento)",
  shape: "Formato (raio dos cantos)",
  transform: "Transformação (ângulo, escala, espelho)",
};

function extractStyle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  groups: string[]
): CopiedStyle {
  const style: CopiedStyle = {};
  const allProps = groups.flatMap(g => STYLE_GROUPS[g as keyof typeof STYLE_GROUPS] ?? []);
  for (const prop of allProps) {
    if (obj[prop] !== undefined) {
      (style as Record<string, unknown>)[prop] = obj[prop];
    }
  }
  return style;
}

export function ObjectStyleCopyPanel({ fabricCanvas, selectionVersion }: ObjectStyleCopyPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [objectType, setObjectType] = useState("");
  const [copiedStyle, setCopiedStyle] = useState<CopiedStyle | null>(null);
  const [copiedFrom, setCopiedFrom] = useState<string>("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["appearance", "shadow"]);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj);
      setObjectType(obj?.type ?? "");
    });
  }, [fabricCanvas, selectionVersion]);

  const getActive = useCallback(() => {
    if (!fabricCanvas) return null;
    return fabricCanvas.getActiveObject();
  }, [fabricCanvas]);

  const toggleGroup = useCallback((group: string) => {
    setSelectedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  }, []);

  const copyStyle = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) { toast.error("Selecione um objeto para copiar o estilo"); return; }

    const style = extractStyle(obj, selectedGroups);
    setCopiedStyle(style);

    const type = obj.type ?? "objeto";
    const label = String(obj.data?.label ?? obj.__id ?? type);
    setCopiedFrom(label);

    const propCount = Object.keys(style).length;
    toast.success(`Estilo copiado: ${propCount} propriedade(s) de "${label}"`);
  }, [getActive, selectedGroups]);

  const pasteStyle = useCallback(() => {
    if (!fabricCanvas || !copiedStyle) { toast.error("Nenhum estilo copiado"); return; }

    if (applyToAll) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objs = fabricCanvas.getObjects().filter((o: any) => o.selectable !== false);
      objs.forEach((o: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (o as any).set(copiedStyle as Record<string, unknown>);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (o as any).setCoords();
      });
      fabricCanvas.requestRenderAll();
      toast.success(`Estilo aplicado a ${objs.length} objeto(s)`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) { toast.error("Selecione um objeto para colar o estilo"); return; }
    obj.set(copiedStyle as Record<string, unknown>);
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Estilo colado");
  }, [fabricCanvas, copiedStyle, applyToAll, getActive]);

  const clearCopied = useCallback(() => {
    setCopiedStyle(null);
    setCopiedFrom("");
    toast.success("Estilo copiado limpo");
  }, []);

  const previewProps = copiedStyle
    ? Object.entries(copiedStyle).slice(0, 8).map(([k, v]) => {
        let display = String(v);
        if (typeof v === "object" && v !== null) display = "{...}";
        if (typeof v === "number") display = v.toFixed(2);
        return `${k}: ${display}`;
      })
    : [];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Pipette className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Copiar Estilo</span>
      </div>

      {/* Property groups to copy */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Propriedades a copiar</span>
        {Object.entries(GROUP_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={selectedGroups.includes(key)}
              onChange={() => toggleGroup(key)}
              className="accent-primary w-3 h-3" />
            <span className="text-[8px] text-foreground/70">{label}</span>
          </label>
        ))}
      </div>

      {/* Copy action */}
      <button onClick={copyStyle} disabled={!hasObject}
        className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40">
        <Pipette className="w-3 h-3" /> Copiar estilo do objeto
      </button>

      {/* Copied style preview */}
      {copiedStyle && (
        <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-primary font-medium">Estilo copiado de: {copiedFrom}</span>
            <button onClick={clearCopied} className="text-[7px] text-muted-foreground hover:text-destructive">
              Limpar
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {previewProps.map(p => (
              <span key={p} className="text-[7px] font-mono text-muted-foreground truncate">{p}</span>
            ))}
            {Object.keys(copiedStyle).length > 8 && (
              <span className="text-[7px] text-muted-foreground/50">+{Object.keys(copiedStyle).length - 8} mais...</span>
            )}
          </div>
        </div>
      )}

      {/* Apply to all toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={applyToAll} onChange={e => setApplyToAll(e.target.checked)}
          className="accent-primary w-3 h-3" />
        <span className="text-[8px] text-foreground/70">Aplicar a todos os objetos</span>
      </label>

      {/* Paste action */}
      <button onClick={pasteStyle} disabled={!copiedStyle || (!hasObject && !applyToAll)}
        className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40">
        <Paintbrush2 className="w-3 h-3" /> {applyToAll ? "Colar estilo em todos" : "Colar estilo no objeto"}
      </button>

      {/* Current object info */}
      {hasObject && (
        <div className="flex items-center gap-2 p-1.5 rounded border border-border bg-muted/10">
          <Copy className="w-3 h-3 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">Objeto atual: <strong>{objectType}</strong></span>
        </div>
      )}

      <button onClick={clearCopied} disabled={!copiedStyle}
        className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors disabled:opacity-40">
        <RotateCcw className="w-3 h-3" /> Limpar estilo copiado
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Selecione as propriedades → copie → selecione destino → cole
      </p>
    </div>
  );
}
