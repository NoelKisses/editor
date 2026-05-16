"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Variable } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TextDataMergePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type LayoutMode = "vertical" | "horizontal" | "grid3";

const DEFAULT_TEMPLATE = "Olá {nome}! Seu pedido {pedido} está pronto.";
const DEFAULT_DATA = `nome,pedido
João,#001
Maria,#002
Pedro,#003`;

const VAR_REGEX = /\{(\w+)\}/g;

function extractVariables(template: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(VAR_REGEX.source, "g");
  while ((match = re.exec(template)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found);
}

function parseCsv(input: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = cells[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

function substituteVariables(
  template: string,
  record: Record<string, string>,
): string {
  return template.replace(VAR_REGEX, (_, key: string) => {
    return record[key] !== undefined ? record[key] : `{${key}}`;
  });
}

function computePosition(
  layout: LayoutMode,
  index: number,
  baseX: number,
  baseY: number,
): { left: number; top: number } {
  const gap = 20;
  const lineHeight = 36;
  const colWidth = 240;

  switch (layout) {
    case "horizontal":
      return {
        left: baseX + index * (colWidth + gap),
        top: baseY,
      };
    case "grid3": {
      const col = index % 3;
      const row = Math.floor(index / 3);
      return {
        left: baseX + col * (colWidth + gap),
        top: baseY + row * (lineHeight + gap),
      };
    }
    case "vertical":
    default:
      return {
        left: baseX,
        top: baseY + index * (lineHeight + gap),
      };
  }
}

export function TextDataMergePanel({ fabricCanvas }: TextDataMergePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [template, setTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [dataInput, setDataInput] = useState<string>(DEFAULT_DATA);
  const [layout, setLayout] = useState<LayoutMode>("vertical");
  const [baseX, setBaseX] = useState<number>(100);
  const [baseY, setBaseY] = useState<number>(100);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const variables = useMemo(() => extractVariables(template), [template]);
  const parsed = useMemo(() => parseCsv(dataInput), [dataInput]);

  const previews = useMemo(() => {
    return parsed.rows
      .slice(0, 3)
      .map((row) => substituteVariables(template, row));
  }, [template, parsed]);

  const applyToSelected = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (parsed.rows.length === 0) {
      toast.error("Nenhum registro disponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active || (active.type !== "i-text" && active.type !== "text" && active.type !== "textbox")) {
      toast.error("Selecione um texto primeiro");
      return;
    }
    const substituted = substituteVariables(template, parsed.rows[0]);
    active.set("text", substituted);
    canvas.requestRenderAll();
    toast.success("Texto aplicado ao objeto selecionado");
  };

  const generateForEachRecord = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (parsed.rows.length === 0) {
      toast.error("Nenhum registro para gerar");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fabricNs: any =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (typeof window !== "undefined" ? (window as any).fabric : null) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas.constructor as any)?.fabric ||
      null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ITextCtor: any = fabricNs?.IText;
    if (!ITextCtor) {
      toast.error("fabric.IText não disponível");
      return;
    }

    let created = 0;
    parsed.rows.forEach((row, i) => {
      const text = substituteVariables(template, row);
      const pos = computePosition(layout, i, baseX, baseY);
      const obj = new ITextCtor(text, {
        left: pos.left,
        top: pos.top,
        fontSize: 24,
        fill: "#000000",
      });
      obj.data = { dataMerge: true, recordIndex: i };
      canvas.add(obj);
      created++;
    });

    canvas.requestRenderAll();
    toast.success(`${created} texto(s) gerado(s)`);
  };

  const clearMerges = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const objects = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter((o: any) => o?.data?.dataMerge === true);
    toRemove.forEach((o: unknown) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} mescla(s) removida(s)`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Variable className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Mail Merge / Dados Mesclados</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Template
        </span>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Olá {nome}! Seu pedido {pedido} está pronto."
        />
      </div>

      {variables.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Variáveis detectadas
          </span>
          <div className="flex flex-wrap gap-1">
            {variables.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {`{${v}}`}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Dados (CSV: primeira linha são cabeçalhos)
        </span>
        <textarea
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground">
          {parsed.rows.length} registro(s) detectado(s)
        </span>
      </div>

      {previews.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Preview (primeiros 3)
          </span>
          <div className="flex flex-col gap-1 rounded-md border border-input bg-muted/30 p-2">
            {previews.map((p, i) => (
              <span key={i} className="text-xs">
                {i + 1}. {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Layout dos textos gerados
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={layout === "vertical" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("vertical")}
          >
            Vertical
          </Button>
          <Button
            type="button"
            variant={layout === "horizontal" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("horizontal")}
          >
            Horizontal
          </Button>
          <Button
            type="button"
            variant={layout === "grid3" ? "default" : "outline"}
            size="sm"
            onClick={() => setLayout("grid3")}
          >
            Grade 3-col
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Pos X
          </span>
          <Input
            type="number"
            value={baseX}
            onChange={(e) => setBaseX(Number(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Pos Y
          </span>
          <Input
            type="number"
            value={baseY}
            onChange={(e) => setBaseY(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" onClick={applyToSelected}>
          Aplicar a Selecionado
        </Button>
        <Button type="button" onClick={generateForEachRecord}>
          Gerar Texto para Cada Registro
        </Button>
        <Button type="button" variant="destructive" onClick={clearMerges}>
          Limpar Mesclas
        </Button>
      </div>
    </div>
  );
}
