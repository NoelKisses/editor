"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const EMOJI_THEMES: Record<string, string[]> = {
  festa: ["🎉", "🎊", "🎈", "🥳", "🎁", "🎂", "🍾", "🎶"],
  amor: ["❤️", "💕", "💖", "💘", "💝", "🌹", "💋", "💌"],
  natureza: ["🌸", "🌺", "🌼", "🍃", "🌿", "🌳", "🌻", "🌷"],
  inverno: ["❄️", "☃️", "⛄", "🎿", "🧣", "🧤", "🌨️", "🎄"],
  verao: ["☀️", "🌴", "🏖️", "🌊", "🍹", "🌞", "🩱", "🕶️"],
  random: ["😊", "⭐", "🎯", "💎", "🔥", "✨", "🚀", "💫"],
};

const THEME_LABELS: Record<string, string> = {
  festa: "Festa",
  amor: "Amor",
  natureza: "Natureza",
  inverno: "Inverno",
  verao: "Verão",
  random: "Random",
};

function randomPosition(
  canvasW: number,
  canvasH: number,
  distribution: string,
): { x: number; y: number } {
  if (distribution === "topo") {
    return {
      x: Math.random() * canvasW,
      y: Math.random() * (canvasH * 0.4),
    };
  }
  if (distribution === "cantos") {
    const corner = Math.floor(Math.random() * 4);
    const margin = 0.25;
    const xRange = canvasW * margin;
    const yRange = canvasH * margin;
    if (corner === 0) {
      return { x: Math.random() * xRange, y: Math.random() * yRange };
    }
    if (corner === 1) {
      return {
        x: canvasW - Math.random() * xRange,
        y: Math.random() * yRange,
      };
    }
    if (corner === 2) {
      return {
        x: Math.random() * xRange,
        y: canvasH - Math.random() * yRange,
      };
    }
    return {
      x: canvasW - Math.random() * xRange,
      y: canvasH - Math.random() * yRange,
    };
  }
  return {
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface CanvasEmojiRainPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasEmojiRainPanel({ fabricCanvas }: CanvasEmojiRainPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [theme, setTheme] = useState<string>("festa");
  const [count, setCount] = useState<number>(30);
  const [size, setSize] = useState<number>(24);
  const [rotation, setRotation] = useState<boolean>(true);
  const [distribution, setDistribution] = useState<string>("espalhado");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleScatter = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const emojis = EMOJI_THEMES[theme] ?? EMOJI_THEMES.random;
    const canvasW = canvas.getWidth?.() ?? 800;
    const canvasH = canvas.getHeight?.() ?? 600;

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      for (let i = 0; i < count; i++) {
        const emoji = pickRandom(emojis);
        const pos = randomPosition(canvasW, canvasH, distribution);
        const variation = 1 + (Math.random() * 0.4 - 0.2);
        const fontSize = Math.max(8, Math.round(size * variation));
        const angle = rotation ? Math.random() * 360 : 0;
        const text = new f.IText(emoji, {
          left: pos.x,
          top: pos.y,
          fontSize,
          angle,
          originX: "center",
          originY: "center",
          selectable: true,
          evented: true,
          editable: false,
          data: { emojiRain: true },
        });
        canvas.add(text);
      }
      canvas.requestRenderAll?.();
      toast.success(`${count} emojis adicionados`);
    }).catch(() => {
      toast.error("Falha ao carregar fabric");
    });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects?.() ?? [];
    let removed = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.slice().forEach((obj: any) => {
      if (obj?.data?.emojiRain === true) {
        canvas.remove(obj);
        removed++;
      }
    });
    canvas.requestRenderAll?.();
    toast.success(`${removed} emojis removidos`);
  };

  const themeKeys = Object.keys(EMOJI_THEMES);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Smile className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Chuva de Emojis</h3>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Tema</span>
        <div className="grid grid-cols-2 gap-2">
          {themeKeys.map((key) => (
            <Button
              key={key}
              type="button"
              variant={theme === key ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(key)}
            >
              {THEME_LABELS[key]}
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {EMOJI_THEMES[theme].join(" ")}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">
          Quantidade: {count}
        </span>
        <input
          type="range"
          min={10}
          max={80}
          step={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">
          Tamanho: {size}px
        </span>
        <input
          type="range"
          min={12}
          max={60}
          step={1}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="emoji-rain-rotation"
          type="checkbox"
          checked={rotation}
          onChange={(e) => setRotation(e.target.checked)}
        />
        <label
          htmlFor="emoji-rain-rotation"
          className="text-sm font-medium"
        >
          Rotação aleatória
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Distribuição</span>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={distribution === "espalhado" ? "default" : "outline"}
            size="sm"
            onClick={() => setDistribution("espalhado")}
          >
            Espalhado
          </Button>
          <Button
            type="button"
            variant={distribution === "topo" ? "default" : "outline"}
            size="sm"
            onClick={() => setDistribution("topo")}
          >
            Topo
          </Button>
          <Button
            type="button"
            variant={distribution === "cantos" ? "default" : "outline"}
            size="sm"
            onClick={() => setDistribution("cantos")}
          >
            Cantos
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          className="w-full"
          onClick={handleScatter}
        >
          Espalhar Emojis
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleClear}
        >
          Limpar Emojis
        </Button>
      </div>
    </div>
  );
}
