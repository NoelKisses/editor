"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TextLanguageStylesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface LanguageStyleConfig {
  fontFamily: string;
  textAlign: string;
  lineHeight: number;
  charSpacing: number;
  direction?: string;
}

const LANGUAGE_STYLES: Record<string, LanguageStyleConfig> = {
  PT: {
    fontFamily: "Arial",
    textAlign: "left",
    lineHeight: 1.2,
    charSpacing: 0,
  },
  JP: {
    fontFamily: "Noto Serif JP, Arial",
    textAlign: "left",
    lineHeight: 1.6,
    charSpacing: 50,
  },
  CN: {
    fontFamily: "Noto Serif SC, Arial",
    textAlign: "left",
    lineHeight: 1.5,
    charSpacing: 30,
  },
  AR: {
    fontFamily: "Noto Sans Arabic, Arial",
    textAlign: "right",
    lineHeight: 1.6,
    charSpacing: 0,
    direction: "rtl",
  },
  HI: {
    fontFamily: "Noto Sans Devanagari, Arial",
    textAlign: "left",
    lineHeight: 1.7,
    charSpacing: 0,
  },
  RU: {
    fontFamily: "Noto Sans, Arial",
    textAlign: "left",
    lineHeight: 1.3,
    charSpacing: 10,
  },
  KR: {
    fontFamily: "Noto Sans KR, Arial",
    textAlign: "left",
    lineHeight: 1.5,
    charSpacing: 20,
  },
  TH: {
    fontFamily: "Noto Sans Thai, Arial",
    textAlign: "left",
    lineHeight: 1.8,
    charSpacing: 10,
  },
};

const LANGUAGE_BUTTONS: Array<{ code: string; flag: string; label: string }> = [
  { code: "PT", flag: "🇧🇷", label: "PT" },
  { code: "JP", flag: "🇯🇵", label: "JP" },
  { code: "CN", flag: "🇨🇳", label: "CN" },
  { code: "AR", flag: "🇦🇪", label: "AR" },
  { code: "HI", flag: "🇮🇳", label: "HI" },
  { code: "RU", flag: "🇷🇺", label: "RU" },
  { code: "KR", flag: "🇰🇷", label: "KR" },
  { code: "TH", flag: "🇹🇭", label: "TH" },
];

const TRANSLATE_SAMPLES: Array<{ lang: string; text: string }> = [
  { lang: "PT", text: "Olá Mundo" },
  { lang: "JP", text: "こんにちは世界" },
  { lang: "AR", text: "مرحبا بالعالم" },
  { lang: "KR", text: "안녕하세요 세계" },
];

const TEXT_TYPES = ["text", "i-text", "textbox"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedTextObjects(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObjects?.() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return active.filter((obj: any) => TEXT_TYPES.includes(obj?.type));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyLanguageStyle(canvas: any, code: string): number {
  const config = LANGUAGE_STYLES[code];
  if (!config) return 0;
  const targets = getSelectedTextObjects(canvas);
  targets.forEach((obj) => {
    obj.set({
      fontFamily: config.fontFamily,
      textAlign: config.textAlign,
      lineHeight: config.lineHeight,
      charSpacing: config.charSpacing,
      direction: config.direction ?? "ltr",
    });
  });
  canvas?.requestRenderAll?.();
  return targets.length;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resetLanguageStyle(canvas: any): number {
  const targets = getSelectedTextObjects(canvas);
  targets.forEach((obj) => {
    obj.set({
      fontFamily: "Arial",
      textAlign: "left",
      lineHeight: 1.16,
      charSpacing: 0,
      direction: "ltr",
    });
  });
  canvas?.requestRenderAll?.();
  return targets.length;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toggleBold(canvas: any): number {
  const targets = getSelectedTextObjects(canvas);
  targets.forEach((obj) => {
    const current = obj.fontWeight;
    obj.set({ fontWeight: current === "bold" ? "normal" : "bold" });
  });
  canvas?.requestRenderAll?.();
  return targets.length;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toggleItalic(canvas: any): number {
  const targets = getSelectedTextObjects(canvas);
  targets.forEach((obj) => {
    const current = obj.fontStyle;
    obj.set({ fontStyle: current === "italic" ? "normal" : "italic" });
  });
  canvas?.requestRenderAll?.();
  return targets.length;
}

export function TextLanguageStylesPanel({ fabricCanvas }: TextLanguageStylesPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedLang, setSelectedLang] = useState<string>("PT");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedLang((prev) => prev);
    });
  }, []);

  const handleApply = () => {
    const count = applyLanguageStyle(canvasRef.current, selectedLang);
    if (count === 0) {
      toast.error("Selecione ao menos um objeto de texto");
      return;
    }
    toast.success(`Estilo ${selectedLang} aplicado a ${count} objeto(s)`);
  };

  const handleReset = () => {
    const count = resetLanguageStyle(canvasRef.current);
    if (count === 0) {
      toast.error("Selecione ao menos um objeto de texto");
      return;
    }
    toast.success(`Estilo resetado em ${count} objeto(s)`);
  };

  const handleBold = () => {
    const count = toggleBold(canvasRef.current);
    if (count === 0) {
      toast.error("Selecione ao menos um objeto de texto");
      return;
    }
    toast.success("Negrito alternado");
  };

  const handleItalic = () => {
    const count = toggleItalic(canvasRef.current);
    if (count === 0) {
      toast.error("Selecione ao menos um objeto de texto");
      return;
    }
    toast.success("Itálico alternado");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Estilos por Idioma</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Selecionar idioma</span>
        <div className="grid grid-cols-4 grid-rows-2 gap-2">
          {LANGUAGE_BUTTONS.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              className={`flex flex-col items-center justify-center rounded-md border px-2 py-2 text-xs transition-colors ${
                selectedLang === lang.code
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="mt-1 font-medium">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleApply}>
          Aplicar Estilo Idioma
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Resetar
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Formatação universal</span>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={handleBold}>
            <span className="font-bold">B</span> Negrito
          </Button>
          <Button type="button" variant="outline" onClick={handleItalic}>
            <span className="italic">I</span> Itálico
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">
          Exemplos de tradução (apenas referência visual)
        </span>
        <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-2">
          {TRANSLATE_SAMPLES.map((sample) => (
            <div key={sample.lang} className="flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground">{sample.lang}</span>
              <span>{sample.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
