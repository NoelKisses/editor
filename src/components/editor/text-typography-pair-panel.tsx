"use client";

import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextTypographyPairPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const TYPO_PAIRS: Array<{
  id: string;
  label: string;
  heading: string;
  body: string;
}> = [
  {
    id: "editorial",
    label: "Editorial",
    heading: "Playfair Display",
    body: "Lato",
  },
  {
    id: "moderno",
    label: "Moderno",
    heading: "Bebas Neue",
    body: "Inter",
  },
  {
    id: "minimalista",
    label: "Minimalista",
    heading: "Helvetica",
    body: "Helvetica",
  },
  {
    id: "vintage",
    label: "Vintage",
    heading: "Cormorant",
    body: "Crimson",
  },
  {
    id: "tech",
    label: "Tech",
    heading: "Space Grotesk",
    body: "IBM Plex",
  },
  {
    id: "friendly",
    label: "Friendly",
    heading: "Caveat",
    body: "Open Sans",
  },
  {
    id: "corporate",
    label: "Corporate",
    heading: "Georgia",
    body: "Verdana",
  },
  {
    id: "display",
    label: "Display",
    heading: "Impact",
    body: "Arial",
  },
];

const COLOR_THEMES: Record<string, { heading: string; body: string }> = {
  Light: { heading: "#1f2937", body: "#6b7280" },
  Dark: { heading: "#f9fafb", body: "#d1d5db" },
  Brand: { heading: "#2563eb", body: "#4b5563" },
};

export function TextTypographyPairPanel({
  fabricCanvas,
}: TextTypographyPairPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedPairId, setSelectedPairId] = useState<string>("editorial");
  const [headingText, setHeadingText] = useState<string>("Título Principal");
  const [bodyText, setBodyText] = useState<string>(
    "Subtítulo ou descrição mais longa que complementa o título."
  );
  const [bodyWidth, setBodyWidth] = useState<number>(400);
  const [selectedTheme, setSelectedTheme] = useState<string>("Light");
  const [headingSize, setHeadingSize] = useState<number>(48);
  const [bodySize, setBodySize] = useState<number>(18);
  const [verticalGap, setVerticalGap] = useState<number>(15);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsertPair = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const pair = TYPO_PAIRS.find((p) => p.id === selectedPairId);
    if (!pair) {
      toast.error("Par tipográfico não encontrado");
      return;
    }
    const theme = COLOR_THEMES[selectedTheme] ?? COLOR_THEMES.Light;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const centerX = (canvas.getWidth?.() ?? 800) / 2;
      const centerY = (canvas.getHeight?.() ?? 600) / 2;

      const heading = new f.IText(headingText, {
        left: centerX,
        top: centerY - headingSize,
        fontFamily: pair.heading,
        fontSize: headingSize,
        fill: theme.heading,
        originX: "center",
        originY: "top",
        textAlign: "center",
      });

      const body = new f.Textbox(bodyText, {
        left: centerX,
        top: centerY - headingSize + headingSize + verticalGap,
        width: bodyWidth,
        fontFamily: pair.body,
        fontSize: bodySize,
        fill: theme.body,
        originX: "center",
        originY: "top",
        textAlign: "center",
      });

      const group = new f.Group([heading, body], {
        left: centerX,
        top: centerY,
        originX: "center",
        originY: "center",
        data: { typoPair: true },
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll?.();
      toast.success(`Par tipográfico "${pair.label}" inserido`);
    });
  };

  const handleRemovePairs = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects?.() ?? [];
    let removed = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((obj: any) => {
      if (obj?.data?.typoPair === true) {
        canvas.remove(obj);
        removed += 1;
      }
    });
    canvas.discardActiveObject?.();
    canvas.requestRenderAll?.();
    if (removed > 0) {
      toast.success(`${removed} par(es) tipográfico(s) removido(s)`);
    } else {
      toast.info("Nenhum par tipográfico para remover");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Type className="h-5 w-5" />
        <h3 className="text-base font-semibold">
          Pares de Tipografia (Heading + Body)
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TYPO_PAIRS.map((pair) => (
          <button
            key={pair.id}
            type="button"
            onClick={() => setSelectedPairId(pair.id)}
            className={`rounded border px-3 py-2 text-left text-sm transition-colors ${
              selectedPairId === pair.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">{pair.label}</div>
            <div className="text-xs text-gray-500">
              {pair.heading} + {pair.body}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="typo-heading-text">
          Texto do Heading
        </label>
        <Input
          id="typo-heading-text"
          value={headingText}
          onChange={(e) => setHeadingText(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="typo-body-text">
          Texto do Body
        </label>
        <Input
          id="typo-body-text"
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="typo-body-width">
          Largura do Body: {bodyWidth}px
        </label>
        <input
          id="typo-body-width"
          type="range"
          min={200}
          max={800}
          step={1}
          value={bodyWidth}
          onChange={(e) => setBodyWidth(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">Tema de Cores</span>
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(COLOR_THEMES).map((themeName) => (
            <button
              key={themeName}
              type="button"
              onClick={() => setSelectedTheme(themeName)}
              className={`rounded border px-3 py-2 text-sm transition-colors ${
                selectedTheme === themeName
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              {themeName}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="typo-heading-size">
          Tamanho do Heading: {headingSize}px
        </label>
        <input
          id="typo-heading-size"
          type="range"
          min={24}
          max={80}
          step={1}
          value={headingSize}
          onChange={(e) => setHeadingSize(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="typo-body-size">
          Tamanho do Body: {bodySize}px
        </label>
        <input
          id="typo-body-size"
          type="range"
          min={12}
          max={32}
          step={1}
          value={bodySize}
          onChange={(e) => setBodySize(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="typo-vertical-gap">
          Espaço Vertical: {verticalGap}px
        </label>
        <input
          id="typo-vertical-gap"
          type="range"
          min={5}
          max={60}
          step={1}
          value={verticalGap}
          onChange={(e) => setVerticalGap(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleInsertPair}>
          Inserir Par Tipográfico
        </Button>
        <Button type="button" variant="outline" onClick={handleRemovePairs}>
          Remover Pares
        </Button>
      </div>
    </div>
  );
}
