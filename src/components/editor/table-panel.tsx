"use client";

import { useCallback, useState } from "react";
import { Table, Plus } from "lucide-react";
import { toast } from "sonner";

interface TablePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const TABLE_STYLES = [
  {
    label: "Simples",
    headerBg: "#374151",
    headerText: "#ffffff",
    rowBg: "#1f2937",
    altRowBg: "#111827",
    rowText: "#e5e7eb",
    border: "#4b5563",
  },
  {
    label: "Azul",
    headerBg: "#1d4ed8",
    headerText: "#ffffff",
    rowBg: "#1e3a5f",
    altRowBg: "#172f50",
    rowText: "#e0f2fe",
    border: "#3b82f6",
  },
  {
    label: "Verde",
    headerBg: "#15803d",
    headerText: "#ffffff",
    rowBg: "#14532d",
    altRowBg: "#052e16",
    rowText: "#dcfce7",
    border: "#22c55e",
  },
  {
    label: "Roxo",
    headerBg: "#7c3aed",
    headerText: "#ffffff",
    rowBg: "#3b0764",
    altRowBg: "#2e1065",
    rowText: "#f3e8ff",
    border: "#a855f7",
  },
  {
    label: "Branco",
    headerBg: "#f9fafb",
    headerText: "#111827",
    rowBg: "#ffffff",
    altRowBg: "#f3f4f6",
    rowText: "#374151",
    border: "#d1d5db",
  },
  {
    label: "Dourado",
    headerBg: "#92400e",
    headerText: "#fef3c7",
    rowBg: "#78350f",
    altRowBg: "#451a03",
    rowText: "#fde68a",
    border: "#d97706",
  },
];

export function TablePanel({ fabricCanvas }: TablePanelProps) {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(3);
  const [cellW, setCellW] = useState(120);
  const [cellH, setCellH] = useState(40);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [hasHeader, setHasHeader] = useState(true);

  const createTable = useCallback(async () => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);
    const style = TABLE_STYLES[selectedStyle];
    const objects: unknown[] = [];

    const headers = ["Coluna 1", "Coluna 2", "Coluna 3", "Coluna 4", "Coluna 5"].slice(0, cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isHeader = hasHeader && r === 0;
        const isAlt = !isHeader && r % 2 === 0;

        const rect = new fabric.Rect({
          width: cellW,
          height: cellH,
          fill: isHeader ? style.headerBg : isAlt ? style.altRowBg : style.rowBg,
          stroke: style.border,
          strokeWidth: 1,
          rx: 0,
          ry: 0,
          selectable: false,
          evented: false,
        });

        const label = isHeader
          ? headers[c] ?? `Col ${c + 1}`
          : c === 0 ? `Linha ${r}` : "";

        const text = new fabric.IText(label, {
          fontSize: isHeader ? 13 : 12,
          fontFamily: "Arial",
          fontWeight: isHeader ? "bold" : "normal",
          fill: isHeader ? style.headerText : style.rowText,
          originX: "center",
          originY: "center",
          left: cellW / 2,
          top: cellH / 2,
          selectable: false,
          evented: false,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const group = new (fabric as any).Group([rect, text], {
          left: c * cellW,
          top: r * cellH,
          selectable: true,
          evented: true,
        });
        objects.push(group);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = new (fabric as any).Group(objects as any[], {
      left: 80,
      top: 80,
      selectable: true,
      evented: true,
      data: { type: "table", rows, cols, style: selectedStyle },
    });

    fabricCanvas.add(table);
    fabricCanvas.setActiveObject(table);
    fabricCanvas.requestRenderAll();
    toast.success(`Tabela ${cols}×${rows} criada`);
  }, [fabricCanvas, rows, cols, cellW, cellH, selectedStyle, hasHeader]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Table className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Tabela</span>
      </div>

      {/* Style presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo</span>
        <div className="grid grid-cols-3 gap-1.5">
          {TABLE_STYLES.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSelectedStyle(i)}
              className={`flex flex-col items-center gap-1 p-2 rounded border transition-all ${selectedStyle === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
            >
              <div className="w-full h-10 rounded overflow-hidden flex flex-col">
                <div className="flex-shrink-0 h-3.5" style={{ background: s.headerBg }} />
                <div className="flex-1" style={{ background: s.rowBg, borderTop: `1px solid ${s.border}` }} />
                <div className="flex-1" style={{ background: s.altRowBg, borderTop: `1px solid ${s.border}` }} />
              </div>
              <span className="text-[9px] text-muted-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Dimensões</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Colunas</span>
            <div className="flex items-center border border-border rounded bg-background">
              <button onClick={() => setCols(Math.max(1, cols - 1))} className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm">−</button>
              <span className="flex-1 text-center text-[11px] tabular-nums">{cols}</span>
              <button onClick={() => setCols(Math.min(8, cols + 1))} className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Linhas</span>
            <div className="flex items-center border border-border rounded bg-background">
              <button onClick={() => setRows(Math.max(1, rows - 1))} className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm">−</button>
              <span className="flex-1 text-center text-[11px] tabular-nums">{rows}</span>
              <button onClick={() => setRows(Math.min(20, rows + 1))} className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Largura célula</span>
            <div className="flex items-center border border-border rounded bg-background">
              <button onClick={() => setCellW(Math.max(40, cellW - 10))} className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm">−</button>
              <span className="flex-1 text-center text-[11px] tabular-nums">{cellW}</span>
              <button onClick={() => setCellW(Math.min(300, cellW + 10))} className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Altura célula</span>
            <div className="flex items-center border border-border rounded bg-background">
              <button onClick={() => setCellH(Math.max(20, cellH - 5))} className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm">−</button>
              <span className="flex-1 text-center text-[11px] tabular-nums">{cellH}</span>
              <button onClick={() => setCellH(Math.min(120, cellH + 5))} className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <span className="text-[11px]">Linha de cabeçalho</span>
        <button
          onClick={() => setHasHeader((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${hasHeader ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${hasHeader ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Preview */}
      <div className="bg-muted/20 rounded-lg border border-border p-2 overflow-hidden">
        <div className="text-[8px] text-muted-foreground mb-1">Prévia</div>
        <div className="overflow-auto" style={{ maxHeight: 100 }}>
          <div style={{ display: "inline-flex", flexDirection: "column", fontSize: 9 }}>
            {Array.from({ length: Math.min(rows, 4) }).map((_, r) => (
              <div key={r} style={{ display: "flex" }}>
                {Array.from({ length: Math.min(cols, 5) }).map((_, c) => {
                  const isH = hasHeader && r === 0;
                  const s = TABLE_STYLES[selectedStyle];
                  return (
                    <div
                      key={c}
                      style={{
                        width: 40,
                        height: 16,
                        background: isH ? s.headerBg : r % 2 === 0 ? s.altRowBg : s.rowBg,
                        border: `0.5px solid ${s.border}`,
                        color: isH ? s.headerText : s.rowText,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: isH ? "bold" : "normal",
                        fontSize: 7,
                        overflow: "hidden",
                      }}
                    >
                      {isH ? `C${c + 1}` : r === 1 ? "..." : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={createTable}
        className="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-[11px] font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Inserir Tabela {cols}×{rows}
      </button>
    </div>
  );
}
