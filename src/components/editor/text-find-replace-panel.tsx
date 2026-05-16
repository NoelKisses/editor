"use client";

import { useEffect, useRef, useState } from "react";
import { Replace } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TEXT_TYPES = ["text", "i-text", "textbox"];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchRegex(
  find: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  useRegex: boolean,
): RegExp {
  let pattern = useRegex ? find : escapeRegex(find);
  if (wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }
  const flags = caseSensitive ? "g" : "gi";
  return new RegExp(pattern, flags);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getScopeObjects(canvas: any, scope: string): any[] {
  if (!canvas) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = canvas.getObjects?.() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textObjs = all.filter((obj: any) => TEXT_TYPES.includes(obj.type));

  if (scope === "selected") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any[] = canvas.getActiveObjects?.() ?? [];
    const activeSet = new Set(active);
    return textObjs.filter((obj) => activeSet.has(obj));
  }

  if (scope === "visible") {
    return textObjs.filter((obj) => obj.visible !== false);
  }

  return textObjs;
}

interface TextFindReplacePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextFindReplacePanel({ fabricCanvas }: TextFindReplacePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [scope, setScope] = useState<string>("all");
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const pushRecent = (query: string) => {
    if (!query) return;
    queueMicrotask(() => {
      setRecentSearches((prev) => {
        const filtered = prev.filter((q) => q !== query);
        return [query, ...filtered].slice(0, 5);
      });
    });
  };

  const handleSearch = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (!findText) {
      toast.error("Digite um termo para buscar");
      return;
    }

    let regex: RegExp;
    try {
      regex = buildSearchRegex(findText, caseSensitive, wholeWord, useRegex);
    } catch {
      toast.error("Expressão regular inválida");
      return;
    }

    const objs = getScopeObjects(canvas, scope);
    let count = 0;
    for (const obj of objs) {
      const text: string = obj.text ?? "";
      const matches = text.match(regex);
      if (matches) count += matches.length;
    }

    queueMicrotask(() => {
      setMatchCount(count);
    });
    pushRecent(findText);
    toast.success(`${count} ocorrência(s) encontrada(s)`);
  };

  const handleReplaceAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (!findText) {
      toast.error("Digite um termo para buscar");
      return;
    }

    let regex: RegExp;
    try {
      regex = buildSearchRegex(findText, caseSensitive, wholeWord, useRegex);
    } catch {
      toast.error("Expressão regular inválida");
      return;
    }

    const objs = getScopeObjects(canvas, scope);
    let count = 0;
    for (const obj of objs) {
      const text: string = obj.text ?? "";
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        const next = text.replace(regex, replaceText);
        obj.set?.("text", next);
        if (obj.text !== next) obj.text = next;
        count += matches.length;
      }
    }

    canvas.requestRenderAll?.();
    pushRecent(findText);
    toast.success(`${count} substituição(ões) realizadas`);
  };

  const handleReplaceFirst = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (!findText) {
      toast.error("Digite um termo para buscar");
      return;
    }

    let baseRegex: RegExp;
    try {
      baseRegex = buildSearchRegex(findText, caseSensitive, wholeWord, useRegex);
    } catch {
      toast.error("Expressão regular inválida");
      return;
    }

    // Non-global single-replace version
    const singleFlags = caseSensitive ? "" : "i";
    const singleRegex = new RegExp(baseRegex.source, singleFlags);

    const objs = getScopeObjects(canvas, scope);
    let replaced = false;
    for (const obj of objs) {
      const text: string = obj.text ?? "";
      if (singleRegex.test(text)) {
        const next = text.replace(singleRegex, replaceText);
        obj.set?.("text", next);
        if (obj.text !== next) obj.text = next;
        replaced = true;
        break;
      }
    }

    canvas.requestRenderAll?.();
    pushRecent(findText);
    if (replaced) {
      toast.success("Primeira ocorrência substituída");
    } else {
      toast.info("Nenhuma ocorrência encontrada");
    }
  };

  const applySymbolReplacement = (from: string, to: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    const regex = new RegExp(escapeRegex(from), "g");
    const objs = getScopeObjects(canvas, scope);
    let count = 0;
    for (const obj of objs) {
      const text: string = obj.text ?? "";
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        const next = text.replace(regex, to);
        obj.set?.("text", next);
        if (obj.text !== next) obj.text = next;
        count += matches.length;
      }
    }
    canvas.requestRenderAll?.();
    toast.success(`${count} substituição(ões): ${from} → ${to}`);
  };

  const recentClick = (query: string) => {
    setFindText(query);
  };

  const symbolButtons: Array<{ label: string; from: string; to: string }> = [
    { label: "(c) → ©", from: "(c)", to: "©" },
    { label: "(tm) → ™", from: "(tm)", to: "™" },
    { label: "(r) → ®", from: "(r)", to: "®" },
    { label: "1/2 → ½", from: "1/2", to: "½" },
    { label: "1/4 → ¼", from: "1/4", to: "¼" },
    { label: "... → …", from: "...", to: "…" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Replace className="h-5 w-5" />
        <h3 className="text-base font-semibold">Find &amp; Replace de Texto</h3>
        {matchCount !== null && (
          <Badge variant="secondary" className="ml-auto">
            {matchCount} match(es)
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Buscar</span>
        <Input
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          placeholder="Texto a buscar..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Substituir por</span>
        <Input
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Texto de substituição..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Opções</span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Case-sensitive
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={wholeWord}
            onChange={(e) => setWholeWord(e.target.checked)}
          />
          Palavra inteira
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useRegex}
            onChange={(e) => setUseRegex(e.target.checked)}
          />
          Usar regex
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Escopo</span>
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={scope === "all" ? "default" : "outline"}
            onClick={() => setScope("all")}
          >
            Todo Canvas
          </Button>
          <Button
            size="sm"
            variant={scope === "selected" ? "default" : "outline"}
            onClick={() => setScope("selected")}
          >
            Apenas Selecionados
          </Button>
          <Button
            size="sm"
            variant={scope === "visible" ? "default" : "outline"}
            onClick={() => setScope("visible")}
          >
            Apenas Visíveis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button onClick={handleSearch} variant="outline">
          Buscar
        </Button>
        <Button onClick={handleReplaceFirst} variant="outline">
          Substituir Primeiro
        </Button>
        <Button onClick={handleReplaceAll}>Substituir Tudo</Button>
      </div>

      {recentSearches.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Buscas recentes</span>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((q, idx) => (
              <Button
                key={`${q}-${idx}`}
                size="sm"
                variant="ghost"
                onClick={() => recentClick(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Símbolos rápidos</span>
        <div className="grid grid-cols-2 gap-2">
          {symbolButtons.map((s) => (
            <Button
              key={s.label}
              size="sm"
              variant="outline"
              onClick={() => applySymbolReplacement(s.from, s.to)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
