"use client";

import { useCallback, useState } from "react";
import { Target, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface CanvasMarkerPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface CanvasMarker {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  type: "pin" | "cross" | "circle";
}

const MARKER_TAG = "__marker__";

type MarkerType = "pin" | "cross" | "circle";

const MARKER_TYPES: { value: MarkerType; label: string }[] = [
  { value: "pin", label: "Pino" },
  { value: "cross", label: "Cruz" },
  { value: "circle", label: "Círculo" },
];

export function CanvasMarkerPanel({ fabricCanvas }: CanvasMarkerPanelProps) {
  const [markers, setMarkers] = useState<CanvasMarker[]>([]);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#ff4444");
  const [markerType, setMarkerType] = useState<MarkerType>("pin");
  const [xPos, setXPos] = useState(100);
  const [yPos, setYPos] = useState(100);
  const [visible, setVisible] = useState(true);
  const [capturing, setCapturing] = useState(false);

  const addMarker = useCallback(() => {
    if (!fabricCanvas) return;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const id = `marker-${Date.now()}`;
      const markerLabel = label.trim() || `Marcador ${markers.length + 1}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objects: any[] = [];

      switch (markerType) {
        case "pin": {
          const circle = new f.Circle({
            left: xPos - 8,
            top: yPos - 8,
            radius: 8,
            fill: color,
            stroke: "#ffffff",
            strokeWidth: 1.5,
            selectable: false,
            evented: false,
            data: { [MARKER_TAG]: true, id },
          });
          const line = new f.Line([xPos, yPos + 8, xPos, yPos + 20], {
            stroke: color,
            strokeWidth: 2,
            selectable: false,
            evented: false,
            data: { [MARKER_TAG]: true, id },
          });
          objects.push(circle, line);
          fabricCanvas.add(circle);
          fabricCanvas.add(line);
          break;
        }
        case "cross": {
          const h = new f.Line([xPos - 12, yPos, xPos + 12, yPos], {
            stroke: color,
            strokeWidth: 2.5,
            selectable: false,
            evented: false,
            data: { [MARKER_TAG]: true, id },
          });
          const v = new f.Line([xPos, yPos - 12, xPos, yPos + 12], {
            stroke: color,
            strokeWidth: 2.5,
            selectable: false,
            evented: false,
            data: { [MARKER_TAG]: true, id },
          });
          objects.push(h, v);
          fabricCanvas.add(h);
          fabricCanvas.add(v);
          break;
        }
        case "circle": {
          const c = new f.Circle({
            left: xPos - 12,
            top: yPos - 12,
            radius: 12,
            fill: "transparent",
            stroke: color,
            strokeWidth: 2.5,
            selectable: false,
            evented: false,
            data: { [MARKER_TAG]: true, id },
          });
          objects.push(c);
          fabricCanvas.add(c);
          break;
        }
      }

      // Text label
      const text = new f.Text(markerLabel, {
        left: xPos + 16,
        top: yPos - 8,
        fontSize: 11,
        fill: color,
        fontWeight: "bold",
        selectable: false,
        evented: false,
        data: { [MARKER_TAG]: true, id },
      });
      objects.push(text);
      fabricCanvas.add(text);

      fabricCanvas.requestRenderAll();

      const marker: CanvasMarker = { id, label: markerLabel, x: xPos, y: yPos, color, type: markerType };
      setMarkers(prev => [...prev, marker]);
      setLabel("");
      toast.success(`Marcador "${markerLabel}" adicionado`);
    });
  }, [fabricCanvas, label, markers.length, markerType, color, xPos, yPos]);

  const removeMarker = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = fabricCanvas.getObjects().filter((o: any) => o.data?.[MARKER_TAG] && o.data?.id === id);
    toRemove.forEach((o: unknown) => fabricCanvas.remove(o));
    fabricCanvas.requestRenderAll();
    setMarkers(prev => prev.filter(m => m.id !== id));
    toast.success("Marcador removido");
  }, [fabricCanvas]);

  const clearAll = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = fabricCanvas.getObjects().filter((o: any) => o.data?.[MARKER_TAG]);
    toRemove.forEach((o: unknown) => fabricCanvas.remove(o));
    fabricCanvas.requestRenderAll();
    setMarkers([]);
    toast.success("Todos os marcadores removidos");
  }, [fabricCanvas]);

  const toggleVisibility = useCallback(() => {
    if (!fabricCanvas) return;
    const next = !visible;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().filter((o: any) => o.data?.[MARKER_TAG]).forEach((o: any) => {
      o.set({ visible: next });
    });
    fabricCanvas.requestRenderAll();
    setVisible(next);
  }, [fabricCanvas, visible]);

  const captureClick = useCallback(() => {
    if (!fabricCanvas) return;
    setCapturing(true);
    toast.success("Clique no canvas para posicionar o marcador");

    const handler = (e: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev = e as any;
      const pt = ev.absolutePointer ?? ev.pointer;
      if (pt) {
        setXPos(Math.round(pt.x));
        setYPos(Math.round(pt.y));
      }
      fabricCanvas.off("mouse:down", handler);
      setCapturing(false);
    };
    fabricCanvas.on("mouse:down", handler);
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Marcadores no Canvas</span>
        </div>
        {markers.length > 0 && (
          <div className="flex items-center gap-1">
            <button onClick={toggleVisibility}
              className="text-muted-foreground hover:text-primary transition-colors">
              {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button onClick={clearAll}
              className="text-[8px] text-muted-foreground hover:text-destructive transition-colors">
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Add marker form */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Novo Marcador</span>

        <input type="text" value={label} onChange={e => setLabel(e.target.value)}
          placeholder="Nome do marcador"
          className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />

        {/* Type */}
        <div className="grid grid-cols-3 gap-1">
          {MARKER_TYPES.map(t => (
            <button key={t.value} onClick={() => setMarkerType(t.value)}
              className={`py-1 rounded border text-[8px] transition-colors ${markerType === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Color */}
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground">Cor</span>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-7 h-6 rounded border border-border cursor-pointer" />
          <span className="text-[7px] font-mono text-muted-foreground">{color}</span>
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-muted-foreground">X (px)</span>
            <input type="number" value={xPos} onChange={e => setXPos(Number(e.target.value))}
              className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-muted-foreground">Y (px)</span>
            <input type="number" value={yPos} onChange={e => setYPos(Number(e.target.value))}
              className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <button onClick={captureClick}
            className={`py-1.5 rounded border text-[8px] transition-colors ${capturing ? "border-primary bg-primary/10 text-primary animate-pulse" : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
            {capturing ? "Clique no canvas..." : "Capturar posição"}
          </button>
          <button onClick={addMarker}
            className="flex items-center justify-center gap-0.5 py-1.5 rounded border border-primary text-primary text-[8px] font-medium hover:bg-primary/10 transition-colors">
            <Plus className="w-2.5 h-2.5" /> Adicionar
          </button>
        </div>
      </div>

      {/* Markers list */}
      {markers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Target className="w-6 h-6 text-muted-foreground/20" />
          <p className="text-[9px] text-muted-foreground">Nenhum marcador adicionado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Marcadores ({markers.length})</span>
          {markers.map(m => (
            <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-medium truncate">{m.label}</p>
                <p className="text-[7px] text-muted-foreground">{m.x}×{m.y}px — {m.type}</p>
              </div>
              <button onClick={() => removeMarker(m.id)}
                className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
