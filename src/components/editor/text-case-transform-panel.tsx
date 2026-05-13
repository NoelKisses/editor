"use client";

import { useCallback, useEffect, useState } from "react";
import { CaseSensitive, Search, Replace } from "lucide-react";
import { toast } from "sonner";

interface TextCaseTransformPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type CaseMode = "upper" | "lower" | "title" | "sentence" | "alternate" | "camel" | "snake";

interface CaseOption {
  id: CaseMode;
  label: string;
  example: string;
}

const CASE_OPTIONS: CaseOption[] = [
  { id: "upper", label: "MAIÚSCULAS", example: "OLÁ MUNDO" },
  { id: "lower", label: "minúsculas", example: "olá mundo" },
  { id: "title", label: "Título", example: "Olá Mundo" },
  { id: "sentence", label: "Frase", example: "Olá mundo" },
  { id: "alternate", label: "aLtErNaDo", example: "oLá MuNdO" },
  { id: "camel", label: "camelCase", example: "oláMundo" },
  { id: "snake", label: "snake_case", example: "olá_mundo" },
];

function applyCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case "upper": return text.toUpperCase();
    case "lower": return text.toLowerCase();
    case "title": return text.replace(/\b\w/g, c => c.toUpperCase());
    case "sentence": return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    case "alternate": return text.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
    case "camel": return text.toLowerCase().replace(/[\s_-](\w)/g, (_, c: string) => c.toUpperCase());
    case "snake": return text.toLowerCase().replace(/[\s-]+/g, "_");
    default: return text;
  }
}

export function TextCaseTransformPanel({ fabricCanvas, selectionVersion }: TextCaseTransformPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = ["i-text", "textbox", "text"].includes(obj?.type ?? "");
      setHasText(isText);
      if (isText) {
        setCurrentText(obj.text ?? "");
        setPreview(null);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getTextObj = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return ["i-text", "textbox", "text"].includes(obj?.type ?? "") ? obj : null;
  }, [fabricCanvas]);

  const transformCase = useCallback((mode: CaseMode) => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    const original = obj.text ?? "";
    const transformed = applyCase(original, mode);
    obj.set({ text: transformed });
    fabricCanvas.requestRenderAll();
    setCurrentText(transformed);
    toast.success(`Caixa "${CASE_OPTIONS.find(o => o.id === mode)?.label}" aplicada`);
  }, [getTextObj, fabricCanvas]);

  const doReplace = useCallback((replaceAll: boolean) => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    if (!searchTerm) { toast.error("Digite o texto a buscar"); return; }
    const original = obj.text ?? "";
    const flags = caseSensitive ? "g" : "gi";
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, replaceAll ? flags : (caseSensitive ? "" : "i"));
    const result = replaceAll ? original.replace(regex, replaceTerm) : original.replace(regex, replaceTerm);
    if (result === original) { toast.error("Texto não encontrado"); return; }
    obj.set({ text: result });
    fabricCanvas.requestRenderAll();
    setCurrentText(result);
    toast.success(replaceAll ? "Todas as ocorrências substituídas" : "Primeira ocorrência substituída");
  }, [getTextObj, fabricCanvas, searchTerm, replaceTerm, caseSensitive]);

  const previewCase = useCallback((mode: CaseMode) => {
    setPreview(applyCase(currentText || "Texto de exemplo", mode));
  }, [currentText]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <CaseSensitive className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Transformar Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CaseSensitive className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para transformar</p>
        </div>
      ) : (
        <>
          {/* Case transform buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Caixa do texto</span>
            <div className="flex flex-col gap-1">
              {CASE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-1">
                  <button
                    onClick={() => transformCase(opt.id)}
                    onMouseEnter={() => previewCase(opt.id)}
                    onMouseLeave={() => setPreview(null)}
                    className="flex-1 flex items-center justify-between px-2 py-1.5 rounded border border-border text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-[10px] font-medium text-foreground">{opt.label}</span>
                    <span className="text-[8px] text-muted-foreground font-mono">{opt.example}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="px-2 py-2 rounded border border-primary/20 bg-primary/5">
              <span className="text-[8px] text-primary/60 block mb-0.5">Prévia:</span>
              <span className="text-[10px] text-foreground font-mono break-words">{preview.slice(0, 80)}{preview.length > 80 ? "…" : ""}</span>
            </div>
          )}

          {/* Current text preview */}
          {currentText && (
            <div className="px-2 py-1.5 rounded border border-border bg-muted/20">
              <span className="text-[8px] text-muted-foreground block mb-0.5">Texto atual:</span>
              <span className="text-[9px] text-foreground break-words">{currentText.slice(0, 60)}{currentText.length > 60 ? "…" : ""}</span>
            </div>
          )}

          {/* Find & Replace */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
            <div className="flex items-center gap-1.5">
              <Search className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Buscar e substituir</span>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary"
            />
            <div className="flex items-center gap-1.5">
              <Replace className="w-3 h-3 text-muted-foreground" />
              <input
                type="text"
                value={replaceTerm}
                onChange={e => setReplaceTerm(e.target.value)}
                placeholder="Substituir por..."
                className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={e => setCaseSensitive(e.target.checked)}
                className="w-3 h-3 accent-primary"
              />
              <span className="text-[9px] text-muted-foreground">Diferenciar maiúsculas</span>
            </label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => doReplace(false)}
                className="py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                Substituir 1ª
              </button>
              <button
                onClick={() => doReplace(true)}
                className="py-1.5 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
              >
                Substituir tudo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
