"use client";

import { useEffect, useRef, useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SCRIPT_FONTS: Array<{ name: string; label: string }> = [
  { name: "Caveat", label: "Caveat" },
  { name: "Pacifico", label: "Pacifico" },
  { name: "Dancing Script", label: "Dancing Script" },
  { name: "Great Vibes", label: "Great Vibes" },
  { name: "Indie Flower", label: "Indie Flower" },
  { name: "Permanent Marker", label: "Permanent Marker" },
  { name: "Shadows Into Light", label: "Shadows Into Light" },
  { name: "Sacramento", label: "Sacramento" },
];

function isFontAvailable(fontName: string): boolean {
  if (typeof document === "undefined") return true;
  try {
    // document.fonts.check requires a size + family string
    return document.fonts.check(`16px "${fontName}"`);
  } catch {
    return true;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCanvasCenter(canvas: any): { x: number; y: number } {
  const width = canvas?.getWidth ? canvas.getWidth() : 800;
  const height = canvas?.getHeight ? canvas.getHeight() : 600;
  return { x: width / 2, y: height / 2 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyStyleToObject(obj: any, style: {
  fontFamily: string;
  fill: string;
  fontSize: number;
  fontStyle: string;
  charSpacing: number;
  lineHeight: number;
  underline: boolean;
  linethrough: boolean;
}) {
  if (!obj) return;
  obj.set({
    fontFamily: style.fontFamily,
    fill: style.fill,
    fontSize: style.fontSize,
    fontStyle: style.fontStyle,
    // fabric.js charSpacing is in 1/1000 em units; multiply px-ish input by ~50 for visual parity
    charSpacing: style.charSpacing * 50,
    lineHeight: style.lineHeight,
    underline: style.underline,
    linethrough: style.linethrough,
  });
}

interface TextScriptHandwritingPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextScriptHandwritingPanel({ fabricCanvas }: TextScriptHandwritingPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [text, setText] = useState("Belíssimo");
  const [selectedFont, setSelectedFont] = useState<string>(SCRIPT_FONTS[0].name);
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(64);
  const [italic, setItalic] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function currentStyle() {
    return {
      fontFamily: selectedFont,
      fill: color,
      fontSize,
      fontStyle: italic ? "italic" : "normal",
      charSpacing: letterSpacing,
      lineHeight,
      underline,
      linethrough: strikethrough,
    };
  }

  function checkFontLoaded(fontName: string) {
    if (!isFontAvailable(fontName)) {
      toast.warning(`Fonte "${fontName}" pode não estar carregada ainda`);
    }
  }

  function handlePresetClick(fontName: string) {
    setSelectedFont(fontName);
    checkFontLoaded(fontName);
  }

  function handleInsert() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const value = text.trim() || "Belíssimo";
    checkFontLoaded(selectedFont);

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const center = getCanvasCenter(canvas);
      const style = currentStyle();
      const obj = new f.IText(value, {
        left: center.x,
        top: center.y,
        originX: "center",
        originY: "center",
        fontFamily: style.fontFamily,
        fill: style.fill,
        fontSize: style.fontSize,
        fontStyle: style.fontStyle,
        charSpacing: style.charSpacing * 50,
        lineHeight: style.lineHeight,
        underline: style.underline,
        linethrough: style.linethrough,
        data: { scriptHandwriting: true },
      });
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      toast.success("Texto manuscrito inserido");
    }).catch(() => {
      toast.error("Erro ao carregar fabric");
    });
  }

  function handleApplyToSelected() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObjects ? canvas.getActiveObjects() : [];
    if (!active || active.length === 0) {
      toast.error("Nenhum objeto selecionado");
      return;
    }
    const style = currentStyle();
    let applied = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    active.forEach((obj: any) => {
      if (obj && (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox")) {
        applyStyleToObject(obj, style);
        if (!obj.data) obj.data = {};
        obj.data.scriptHandwriting = true;
        applied++;
      }
    });
    canvas.requestRenderAll();
    if (applied > 0) {
      toast.success(`Estilo aplicado a ${applied} objeto(s)`);
    } else {
      toast.error("Nenhum texto selecionado");
    }
  }

  function handleRemoveAll() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const all = canvas.getObjects ? canvas.getObjects() : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targets = all.filter((o: any) => o?.data?.scriptHandwriting === true);
    if (targets.length === 0) {
      toast.info("Nenhum texto manuscrito encontrado");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targets.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${targets.length} texto(s) manuscrito(s) removido(s)`);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <PenLine className="h-5 w-5" />
        <h3 className="text-base font-semibold">Texto Manuscrito / Script</h3>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="script-text" className="text-xs font-medium">
          Texto
        </label>
        <Input
          id="script-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Belíssimo"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">Estilos de Script</label>
        <div className="grid grid-cols-2 gap-2">
          {SCRIPT_FONTS.map((font) => (
            <Button
              key={font.name}
              type="button"
              variant={selectedFont === font.name ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetClick(font.name)}
              style={{ fontFamily: `"${font.name}", cursive` }}
            >
              {font.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="script-color" className="text-xs font-medium">
          Cor
        </label>
        <input
          id="script-color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-full cursor-pointer rounded-md border border-input bg-background"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="script-fontsize" className="flex justify-between text-xs font-medium">
          <span>Tamanho da Fonte</span>
          <span className="text-muted-foreground">{fontSize}px</span>
        </label>
        <input
          id="script-fontsize"
          type="range"
          min={24}
          max={120}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="script-italic"
          type="checkbox"
          checked={italic}
          onChange={(e) => setItalic(e.target.checked)}
        />
        <label htmlFor="script-italic" className="text-xs font-medium">
          Itálico
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="script-letterspacing" className="flex justify-between text-xs font-medium">
          <span>Espaçamento entre Letras</span>
          <span className="text-muted-foreground">{letterSpacing}px</span>
        </label>
        <input
          id="script-letterspacing"
          type="range"
          min={-5}
          max={20}
          step={1}
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="script-lineheight" className="flex justify-between text-xs font-medium">
          <span>Altura da Linha</span>
          <span className="text-muted-foreground">{lineHeight.toFixed(2)}</span>
        </label>
        <input
          id="script-lineheight"
          type="range"
          min={0.8}
          max={2.0}
          step={0.05}
          value={lineHeight}
          onChange={(e) => setLineHeight(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="script-underline"
          type="checkbox"
          checked={underline}
          onChange={(e) => setUnderline(e.target.checked)}
        />
        <label htmlFor="script-underline" className="text-xs font-medium">
          Sublinhado
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="script-strikethrough"
          type="checkbox"
          checked={strikethrough}
          onChange={(e) => setStrikethrough(e.target.checked)}
        />
        <label htmlFor="script-strikethrough" className="text-xs font-medium">
          Tachado
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={handleInsert}>
          Inserir Texto Manuscrito
        </Button>
        <Button type="button" variant="outline" onClick={handleApplyToSelected}>
          Aplicar a Selecionado
        </Button>
        <Button type="button" variant="destructive" onClick={handleRemoveAll}>
          Remover Manuscritos
        </Button>
      </div>
    </div>
  );
}
