"use client";

import { useCallback, useState } from "react";
import { Camera, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

interface CanvasSnapshotPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface Snapshot {
  id: string;
  label: string;
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function CanvasSnapshotPanel({ fabricCanvas }: CanvasSnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [label, setLabel] = useState("");

  const captureSnapshot = useCallback(() => {
    if (!fabricCanvas) { toast.error("Canvas não disponível"); return; }

    const dataUrl = fabricCanvas.toDataURL({ format: "png", multiplier: 0.5 });
    const now = Date.now();
    const snap: Snapshot = {
      id: `snap-${now}`,
      label: label.trim() || `Snapshot ${snapshots.length + 1}`,
      dataUrl,
      timestamp: now,
      width: fabricCanvas.width ?? 800,
      height: fabricCanvas.height ?? 600,
    };
    setSnapshots(prev => [snap, ...prev].slice(0, 12));
    setLabel("");
    toast.success(`Snapshot "${snap.label}" salvo`);
  }, [fabricCanvas, label, snapshots.length]);

  const restoreSnapshot = useCallback((snap: Snapshot) => {
    if (!fabricCanvas) return;
    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      f.Image.fromURL(snap.dataUrl, (img: unknown) => {
        fabricCanvas.clear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgAny = img as any;
        imgAny.set({ left: 0, top: 0, selectable: false, evented: false });
        fabricCanvas.add(imgAny);
        fabricCanvas.requestRenderAll();
        toast.success(`Snapshot "${snap.label}" restaurado`);
      });
    });
  }, [fabricCanvas]);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
    toast.success("Snapshot removido");
  }, []);

  const downloadSnapshot = useCallback((snap: Snapshot) => {
    downloadDataUrl(snap.dataUrl, `${snap.label.replace(/\s+/g, "-")}.png`);
    toast.success(`"${snap.label}" baixado`);
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Snapshots do Canvas</span>
      </div>

      {/* Capture controls */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Nome do snapshot (opcional)"
          className="bg-muted/50 border border-border rounded px-2 py-1.5 text-[9px] focus:outline-none focus:border-primary"
        />
        <button onClick={captureSnapshot}
          className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
          <Camera className="w-3 h-3" /> Capturar Snapshot
        </button>
      </div>

      {/* Snapshot count */}
      {snapshots.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Snapshots ({snapshots.length}/12)
          </span>
          <button onClick={() => { setSnapshots([]); toast.success("Todos os snapshots removidos"); }}
            className="text-[8px] text-muted-foreground hover:text-destructive transition-colors">
            Limpar todos
          </button>
        </div>
      )}

      {/* Snapshots list */}
      {snapshots.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Camera className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Nenhum snapshot capturado ainda</p>
          <p className="text-[9px] text-muted-foreground/60">Capture para salvar versões do design</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {snapshots.map(snap => (
            <div key={snap.id}
              className="flex gap-2 p-1.5 rounded border border-border hover:border-primary/30 transition-colors">
              {/* Thumbnail */}
              <div className="w-12 h-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snap.dataUrl} alt={snap.label}
                  className="w-full h-full object-cover" />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-medium truncate">{snap.label}</p>
                <p className="text-[7px] text-muted-foreground">{formatTime(snap.timestamp)}</p>
                <p className="text-[7px] text-muted-foreground">{snap.width}×{snap.height}px</p>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => restoreSnapshot(snap)}
                  className="text-[7px] text-primary hover:underline px-1">
                  Restaurar
                </button>
                <button onClick={() => downloadSnapshot(snap)}
                  className="text-muted-foreground hover:text-primary transition-colors">
                  <Download className="w-2.5 h-2.5" />
                </button>
                <button onClick={() => deleteSnapshot(snap.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Máx. 12 snapshots em memória — não persistem ao recarregar
      </p>
    </div>
  );
}
