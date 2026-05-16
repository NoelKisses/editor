"use client";

import { useEffect, useRef, useState } from "react";
import { History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CanvasHistoryTreePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface HistoryState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
  parentId: string | null;
  label: string;
  timestamp: number;
  thumb: string;
}

function generateStateId(): string {
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `st_${Date.now().toString(36)}_${rand()}${rand()}`;
}

function computeDepth(
  stateId: string,
  states: Map<string, HistoryState>,
): number {
  let depth = 0;
  let current = states.get(stateId);
  const visited = new Set<string>();
  while (current && current.parentId) {
    if (visited.has(current.parentId)) break;
    visited.add(current.parentId);
    depth += 1;
    current = states.get(current.parentId);
  }
  return depth;
}

function getChildren(
  parentId: string | null,
  states: Map<string, HistoryState>,
): string[] {
  const out: string[] = [];
  states.forEach((value, key) => {
    if (value.parentId === parentId) {
      out.push(key);
    }
  });
  return out;
}

function formatTimestamp(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

function buildOrderedTree(
  states: Map<string, HistoryState>,
): string[] {
  const ordered: string[] = [];
  const roots = getChildren(null, states).sort(
    (a, b) => (states.get(a)?.timestamp ?? 0) - (states.get(b)?.timestamp ?? 0),
  );
  const walk = (id: string) => {
    ordered.push(id);
    const children = getChildren(id, states).sort(
      (a, b) =>
        (states.get(a)?.timestamp ?? 0) - (states.get(b)?.timestamp ?? 0),
    );
    children.forEach(walk);
  };
  roots.forEach(walk);
  return ordered;
}

function collectDescendants(
  rootId: string,
  states: Map<string, HistoryState>,
): string[] {
  const result: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    result.push(id);
    getChildren(id, states).forEach((c) => stack.push(c));
  }
  return result;
}

export function CanvasHistoryTreePanel({
  fabricCanvas,
}: CanvasHistoryTreePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [states, setStates] = useState<Map<string, HistoryState>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const captureState = (asBranch: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    try {
      const json = canvas.toJSON();
      let thumb = "";
      try {
        thumb = canvas.toDataURL({ multiplier: 0.1 });
      } catch {
        thumb = "";
      }
      const id = generateStateId();
      const parentId = asBranch ? activeId : activeId;
      const newState: HistoryState = {
        json,
        parentId: parentId ?? null,
        label: label.trim() || `Estado ${new Date().toLocaleTimeString()}`,
        timestamp: Date.now(),
        thumb,
      };
      queueMicrotask(() => {
        setStates((prev) => {
          const next = new Map(prev);
          next.set(id, newState);
          return next;
        });
        setActiveId(id);
        setLabel("");
      });
      toast.success(
        asBranch ? "Novo ramo criado" : "Estado capturado",
      );
    } catch (error) {
      toast.error(
        `Falha ao capturar: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const loadState = (id: string) => {
    const canvas = canvasRef.current;
    const state = states.get(id);
    if (!canvas || !state) {
      toast.error("Estado ou canvas indisponível");
      return;
    }
    try {
      canvas.loadFromJSON(state.json, () => {
        canvas.renderAll();
      });
      setActiveId(id);
      toast.success(`Carregado: ${state.label}`);
    } catch (error) {
      toast.error(
        `Falha ao carregar: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const deleteState = (id: string) => {
    setStates((prev) => {
      const next = new Map(prev);
      const toRemove = collectDescendants(id, next);
      toRemove.forEach((rid) => next.delete(rid));
      return next;
    });
    if (activeId && collectDescendants(id, states).includes(activeId)) {
      setActiveId(null);
    }
    toast.success("Estado removido");
  };

  const clearAll = () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm("Limpar todo o histórico?");
      if (!ok) return;
    }
    setStates(new Map());
    setActiveId(null);
    toast.success("Histórico limpo");
  };

  const exportTree = async () => {
    const obj: Record<string, HistoryState> = {};
    states.forEach((value, key) => {
      obj[key] = value;
    });
    const payload = JSON.stringify(
      { activeId, states: obj },
      null,
      2,
    );
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(payload);
        toast.success("Árvore copiada para a área de transferência");
      } else {
        toast.error("Clipboard indisponível");
      }
    } catch (error) {
      toast.error(
        `Falha ao copiar: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const ordered = buildOrderedTree(states);

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4" />
        <h3 className="text-sm font-semibold">
          Histórico em Árvore (Branches)
        </h3>
      </div>

      <div className="space-y-2 rounded-md border border-border p-2">
        <label
          htmlFor="history-label"
          className="text-xs font-medium text-muted-foreground"
        >
          Rótulo do estado
        </label>
        <Input
          id="history-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex.: layout inicial"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => captureState(false)}
            className="flex-1"
          >
            Capturar Estado
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => captureState(true)}
            className="flex-1"
          >
            Capturar e Ramificar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Árvore de Estados ({states.size})
          </span>
          {activeId ? (
            <Badge variant="secondary" className="text-[10px]">
              Ativo: {states.get(activeId)?.label ?? activeId.slice(0, 8)}
            </Badge>
          ) : null}
        </div>

        {ordered.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Nenhum estado capturado ainda.
          </p>
        ) : (
          <ul className="space-y-1">
            {ordered.map((id) => {
              const state = states.get(id);
              if (!state) return null;
              const depth = computeDepth(id, states);
              const isActive = id === activeId;
              return (
                <li
                  key={id}
                  style={{ paddingLeft: `${depth * 12}px` }}
                  className={`flex items-center gap-2 rounded border p-2 text-xs ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  {state.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={state.thumb}
                      alt={state.label}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium">{state.label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatTimestamp(state.timestamp)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadState(id)}
                  >
                    Carregar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteState(id)}
                  >
                    Deletar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={clearAll}
          className="flex-1"
        >
          Limpar Histórico
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={exportTree}
          className="flex-1"
        >
          Exportar Árvore JSON
        </Button>
      </div>
    </div>
  );
}
