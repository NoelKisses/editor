"use client";

import { useCallback, useEffect, useState } from "react";
import { Variable, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TextVariablePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface TemplateVariable {
  key: string;
  value: string;
}

const DEFAULT_VARS: TemplateVariable[] = [
  { key: "nome", value: "João Silva" },
  { key: "data", value: new Date().toLocaleDateString("pt-BR") },
  { key: "empresa", value: "Minha Empresa" },
  { key: "titulo", value: "CEO" },
];

export function TextVariablePanel({ fabricCanvas, selectionVersion }: TextVariablePanelProps) {
  const [hasText, setHasText] = useState(false);
  const [vars, setVars] = useState<TemplateVariable[]>(DEFAULT_VARS);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [originalText, setOriginalText] = useState<string>("");

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = !!obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text");
      setHasText(isText);
      if (isText && !originalText) {
        setOriginalText(obj.text ?? "");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, selectionVersion]);

  const getTextObj = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text") ? obj : null;
  }, [fabricCanvas]);

  const applyVariables = useCallback(() => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }

    const base = originalText || obj.text || "";
    let result = base;
    vars.forEach(v => {
      const pattern = new RegExp(`\\{\\{\\s*${v.key}\\s*\\}\\}`, "gi");
      result = result.replace(pattern, v.value);
    });

    obj.set({ text: result });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Variáveis aplicadas ao texto");
  }, [getTextObj, originalText, vars, fabricCanvas]);

  const resetText = useCallback(() => {
    const obj = getTextObj();
    if (!obj || !originalText) return;
    obj.set({ text: originalText });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Texto original restaurado");
  }, [getTextObj, originalText, fabricCanvas]);

  const captureText = useCallback(() => {
    const obj = getTextObj();
    if (!obj) return;
    setOriginalText(obj.text ?? "");
    toast.success("Texto original capturado");
  }, [getTextObj]);

  const addVar = useCallback(() => {
    const k = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!k) { toast.error("Digite um nome para a variável"); return; }
    if (vars.some(v => v.key === k)) { toast.error("Variável já existe"); return; }
    setVars(prev => [...prev, { key: k, value: newValue }]);
    setNewKey("");
    setNewValue("");
    toast.success(`Variável {{${k}}} adicionada`);
  }, [newKey, newValue, vars]);

  const removeVar = useCallback((key: string) => {
    setVars(prev => prev.filter(v => v.key !== key));
  }, []);

  const updateVarValue = useCallback((key: string, value: string) => {
    setVars(prev => prev.map(v => v.key === key ? { ...v, value } : v));
  }, []);

  const insertPlaceholder = useCallback((key: string) => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    const current = obj.text ?? "";
    obj.set({ text: current + `{{${key}}}` });
    if (!originalText) setOriginalText(obj.text ?? "");
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success(`{{${key}}} inserido`);
  }, [getTextObj, originalText, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Variable className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Variáveis de Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Variable className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para usar variáveis</p>
          <p className="text-[9px] text-muted-foreground/60">Use {"{{variavel}}"} no texto</p>
        </div>
      ) : (
        <>
          {/* Capture */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded border border-border bg-muted/10">
            <span className="text-[8px] text-muted-foreground flex-1 truncate">
              {originalText ? `Texto base: "${originalText.slice(0, 25)}${originalText.length > 25 ? "…" : ""}"` : "Nenhum texto base capturado"}
            </span>
            <button onClick={captureText}
              className="flex items-center gap-0.5 text-[8px] text-primary hover:underline flex-shrink-0">
              <RefreshCw className="w-2.5 h-2.5" /> Capturar
            </button>
          </div>

          {/* Variables list */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Variáveis</span>
            <div className="flex flex-col gap-1">
              {vars.map(v => (
                <div key={v.key} className="flex items-center gap-1">
                  <button onClick={() => insertPlaceholder(v.key)}
                    className="text-[8px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors flex-shrink-0"
                    title={`Inserir {{${v.key}}}`}>
                    {`{{${v.key}}}`}
                  </button>
                  <input type="text" value={v.value} onChange={e => updateVarValue(v.key, e.target.value)}
                    className="flex-1 bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary min-w-0" />
                  <button onClick={() => removeVar(v.key)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add variable */}
          <div className="flex flex-col gap-1.5 p-2 rounded border border-border bg-muted/10">
            <span className="text-[9px] text-muted-foreground">Nova Variável</span>
            <div className="grid grid-cols-2 gap-1">
              <input type="text" value={newKey} onChange={e => setNewKey(e.target.value)}
                placeholder="nome_var"
                className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              <input type="text" value={newValue} onChange={e => setNewValue(e.target.value)}
                placeholder="valor"
                className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
            </div>
            <button onClick={addVar}
              className="flex items-center justify-center gap-1 py-1 rounded border border-border text-[8px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button onClick={resetText}
              className="py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors">
              Restaurar Original
            </button>
            <button onClick={applyVariables}
              className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <Variable className="w-3 h-3" /> Aplicar
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Clique no marcador para inserir no texto
          </p>
        </>
      )}
    </div>
  );
}
