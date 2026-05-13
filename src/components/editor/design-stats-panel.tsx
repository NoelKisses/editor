"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

interface DesignStatsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface DesignStats {
  totalObjects: number;
  byType: Record<string, number>;
  colors: string[];
  fonts: string[];
  canvasWidth: number;
  canvasHeight: number;
  occupiedPercent: number;
  hasImages: boolean;
  hasText: boolean;
  hasShapes: boolean;
  groups: number;
  lockedObjects: number;
  hiddenObjects: number;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className="text-[9px] font-mono tabular-nums">{value}</span>
    </div>
  );
}

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <div
      className="w-5 h-5 rounded-sm border border-border/50 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
      style={{ background: hex }}
      title={hex}
      onClick={() => navigator.clipboard.writeText(hex).catch(() => {})}
    />
  );
}

export function DesignStatsPanel({ fabricCanvas, selectionVersion }: DesignStatsPanelProps) {
  const [stats, setStats] = useState<DesignStats | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(() => {
    if (!fabricCanvas) return;
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objects: any[] = fabricCanvas.getObjects();
      const cw = Math.round(fabricCanvas.getWidth() / fabricCanvas.getZoom());
      const ch = Math.round(fabricCanvas.getHeight() / fabricCanvas.getZoom());

      const byType: Record<string, number> = {};
      const colorsSet = new Set<string>();
      const fontsSet = new Set<string>();
      let occupiedArea = 0;
      let groups = 0;
      let lockedObjects = 0;
      let hiddenObjects = 0;

      const processObj = (o: { type?: string; fill?: string; stroke?: string; fontFamily?: string; opacity?: number; evented?: boolean; selectable?: boolean; lockMovementX?: boolean; getBoundingRect?: () => { width: number; height: number }; getObjects?: () => unknown[] }) => {
        const type = o.type ?? "unknown";
        byType[type] = (byType[type] ?? 0) + 1;

        if (o.fill && typeof o.fill === "string" && o.fill !== "transparent" && o.fill !== "") {
          colorsSet.add(o.fill);
        }
        if (o.stroke && typeof o.stroke === "string" && o.stroke !== "transparent" && o.stroke !== "") {
          colorsSet.add(o.stroke);
        }
        if (o.fontFamily) {
          fontsSet.add(o.fontFamily);
        }
        if (type === "group") {
          groups++;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (o.getObjects?.() ?? []).forEach((child: any) => processObj(child));
        }
        if (o.opacity === 0) hiddenObjects++;
        if (o.lockMovementX || (!o.evented && !o.selectable)) lockedObjects++;

        if (o.getBoundingRect) {
          const br = o.getBoundingRect();
          occupiedArea += br.width * br.height;
        }
      };

      objects.forEach(o => processObj(o));

      const canvasArea = cw * ch;
      const occupiedPercent = canvasArea > 0 ? Math.min(100, Math.round((occupiedArea / canvasArea) * 100)) : 0;

      setStats({
        totalObjects: objects.length,
        byType,
        colors: [...colorsSet].slice(0, 20),
        fonts: [...fontsSet],
        canvasWidth: cw,
        canvasHeight: ch,
        occupiedPercent,
        hasImages: !!byType["image"],
        hasText: !!(byType["i-text"] || byType["textbox"] || byType["text"]),
        hasShapes: !!(byType["rect"] || byType["circle"] || byType["triangle"] || byType["polygon"] || byType["ellipse"]),
        groups,
        lockedObjects,
        hiddenObjects,
      });
    } finally {
      setLoading(false);
    }
  }, [fabricCanvas]);

  useEffect(() => {
    void selectionVersion;
    if (fabricCanvas) {
      queueMicrotask(analyze);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, selectionVersion]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Estatísticas</span>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!stats ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Inicialize o canvas para ver estatísticas</p>
        </div>
      ) : (
        <>
          {/* Canvas info */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Canvas</span>
            <StatRow label="Dimensões" value={`${stats.canvasWidth}×${stats.canvasHeight}px`} />
            <StatRow label="Área ocupada" value={`${stats.occupiedPercent}%`} />
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full mt-0.5">
              <div
                className="h-1.5 bg-primary rounded-full transition-all"
                style={{ width: `${stats.occupiedPercent}%` }}
              />
            </div>
          </div>

          {/* Objects */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Objetos</span>
            <StatRow label="Total" value={stats.totalObjects} />
            <StatRow label="Grupos" value={stats.groups} />
            <StatRow label="Bloqueados" value={stats.lockedObjects} />
            <StatRow label="Ocultos (opac. 0)" value={stats.hiddenObjects} />
          </div>

          {/* By type */}
          {Object.keys(stats.byType).length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Por tipo</span>
              {Object.entries(stats.byType).map(([type, count]) => (
                <StatRow key={type} label={type} value={count} />
              ))}
            </div>
          )}

          {/* Composition tags */}
          <div className="flex flex-wrap gap-1">
            {stats.hasImages && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Imagens</span>
            )}
            {stats.hasText && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Texto</span>
            )}
            {stats.hasShapes && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Formas</span>
            )}
            {stats.groups > 0 && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Grupos</span>
            )}
          </div>

          {/* Colors */}
          {stats.colors.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Cores usadas ({stats.colors.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {stats.colors.map((c, i) => (
                  <ColorSwatch key={i} hex={c} />
                ))}
              </div>
              <p className="text-[7px] text-muted-foreground/50">Clique para copiar o hex</p>
            </div>
          )}

          {/* Fonts */}
          {stats.fonts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Fontes ({stats.fonts.length})
              </span>
              <div className="flex flex-col gap-0.5">
                {stats.fonts.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-[12px]" style={{ fontFamily: f }}>Aa</span>
                    <span className="text-[9px] text-muted-foreground truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.totalObjects === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-2">Canvas vazio — adicione objetos para ver estatísticas</p>
          )}
        </>
      )}
    </div>
  );
}
