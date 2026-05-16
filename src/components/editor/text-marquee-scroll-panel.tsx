"use client";

import { useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextMarqueeScrollPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type Direction = "left" | "right" | "up" | "down";
type Position = "top" | "middle" | "bottom";
type BannerStyle = "solid" | "stripes" | "double-border";

function directionToVelocity(
  direction: string,
  speed: number,
): { vx: number; vy: number } {
  switch (direction) {
    case "left":
      return { vx: -speed, vy: 0 };
    case "right":
      return { vx: speed, vy: 0 };
    case "up":
      return { vx: 0, vy: -speed };
    case "down":
      return { vx: 0, vy: speed };
    default:
      return { vx: -speed, vy: 0 };
  }
}

function buildRepeatedText(base: string, repeats: number): string {
  let out = "";
  for (let i = 0; i < repeats; i++) {
    out += base;
  }
  return out;
}

function computeBannerY(
  position: Position,
  canvasHeight: number,
  bannerHeight: number,
): number {
  switch (position) {
    case "top":
      return 0;
    case "middle":
      return Math.max(0, canvasHeight / 2 - bannerHeight / 2);
    case "bottom":
      return Math.max(0, canvasHeight - bannerHeight);
    default:
      return 0;
  }
}

export function TextMarqueeScrollPanel({
  fabricCanvas,
}: TextMarqueeScrollPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const [text, setText] = useState<string>(
    "BREAKING NEWS • ÚLTIMAS NOTÍCIAS • ",
  );
  const [bgColor, setBgColor] = useState<string>("#000000");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [fontSize, setFontSize] = useState<number>(28);
  const [bold, setBold] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(5);
  const [direction, setDirection] = useState<Direction>("left");
  const [position, setPosition] = useState<Position>("top");
  const [bannerHeight, setBannerHeight] = useState<number>(60);
  const [bannerStyle, setBannerStyle] = useState<BannerStyle>("solid");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      queueMicrotask(() => {
        toast.success("Animação parada");
      });
    }
  };

  const handleStartMarquee = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (!text.trim()) {
      toast.error("Texto vazio");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Fabric indisponível");
        return;
      }

      const canvasWidth = canvas.getWidth ? canvas.getWidth() : 800;
      const canvasHeight = canvas.getHeight ? canvas.getHeight() : 600;
      const y = computeBannerY(position, canvasHeight, bannerHeight);

      const banner = new f.Rect({
        left: 0,
        top: y,
        width: canvasWidth,
        height: bannerHeight,
        fill: bgColor,
        selectable: false,
        evented: false,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decorations: any[] = [];
      if (bannerStyle === "stripes") {
        const stripeCount = 6;
        const stripeW = canvasWidth / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
          if (i % 2 === 0) continue;
          decorations.push(
            new f.Rect({
              left: i * stripeW,
              top: y,
              width: stripeW,
              height: bannerHeight,
              fill: textColor,
              opacity: 0.08,
              selectable: false,
              evented: false,
            }),
          );
        }
      } else if (bannerStyle === "double-border") {
        decorations.push(
          new f.Rect({
            left: 0,
            top: y + 2,
            width: canvasWidth,
            height: 2,
            fill: textColor,
            selectable: false,
            evented: false,
          }),
        );
        decorations.push(
          new f.Rect({
            left: 0,
            top: y + bannerHeight - 4,
            width: canvasWidth,
            height: 2,
            fill: textColor,
            selectable: false,
            evented: false,
          }),
        );
      }

      const repeatedText = buildRepeatedText(text, 4);

      const scrollingText = new f.IText(repeatedText, {
        left: 0,
        top: y + bannerHeight / 2 - fontSize / 2,
        fill: textColor,
        fontSize,
        fontWeight: bold ? "bold" : "normal",
        fontFamily: "Arial",
        selectable: false,
        evented: false,
        editable: false,
      });

      const group = new f.Group([banner, ...decorations, scrollingText], {
        left: 0,
        top: y,
        selectable: false,
        evented: false,
        subTargetCheck: false,
        data: { marqueeScroll: true },
      });

      canvas.add(group);
      canvas.requestRenderAll();

      const { vx, vy } = directionToVelocity(direction, speed);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textWidth = (scrollingText.width as number) || canvasWidth;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textHeight = (scrollingText.height as number) || fontSize;

      let offsetX = 0;
      let offsetY = 0;
      const baseLeft = scrollingText.left as number;
      const baseTop = scrollingText.top as number;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const tick = () => {
        offsetX += vx;
        offsetY += vy;

        if (vx < 0 && offsetX <= -textWidth) {
          offsetX = 0;
        } else if (vx > 0 && offsetX >= textWidth) {
          offsetX = 0;
        }
        if (vy < 0 && offsetY <= -textHeight) {
          offsetY = 0;
        } else if (vy > 0 && offsetY >= textHeight) {
          offsetY = 0;
        }

        scrollingText.set({
          left: baseLeft + offsetX,
          top: baseTop + offsetY,
        });
        // group needs to update internal coords
        if (group.setCoords) group.setCoords();
        canvas.requestRenderAll();

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      toast.success("Marquee iniciado");
    });
  };

  const handleClearMarquees = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = canvas.getObjects ? canvas.getObjects() : [];
    let removed = 0;
    for (const obj of objects) {
      if (obj && obj.data && obj.data.marqueeScroll === true) {
        canvas.remove(obj);
        removed++;
      }
    }
    canvas.requestRenderAll();
    toast.success(`${removed} marquee(s) removido(s)`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <MoveHorizontal className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Marquee / Scrolling Text</h3>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">Texto</label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Texto do marquee"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Cor de fundo</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Cor do texto</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">
          Tamanho da fonte: {fontSize}px
        </label>
        <input
          type="range"
          min={16}
          max={60}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={bold}
          onChange={(e) => setBold(e.target.checked)}
        />
        Negrito
      </label>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">
          Velocidade de scroll: {speed}
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">Direção</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={direction === "left" ? "default" : "outline"}
            size="sm"
            onClick={() => setDirection("left")}
          >
            ← Esquerda
          </Button>
          <Button
            variant={direction === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => setDirection("right")}
          >
            → Direita
          </Button>
          <Button
            variant={direction === "up" ? "default" : "outline"}
            size="sm"
            onClick={() => setDirection("up")}
          >
            ↑ Cima
          </Button>
          <Button
            variant={direction === "down" ? "default" : "outline"}
            size="sm"
            onClick={() => setDirection("down")}
          >
            ↓ Baixo
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">Posição</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={position === "top" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("top")}
          >
            Topo
          </Button>
          <Button
            variant={position === "middle" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("middle")}
          >
            Meio
          </Button>
          <Button
            variant={position === "bottom" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("bottom")}
          >
            Rodapé
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">
          Altura do banner: {bannerHeight}px
        </label>
        <input
          type="range"
          min={40}
          max={120}
          step={1}
          value={bannerHeight}
          onChange={(e) => setBannerHeight(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">Estilo do banner</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={bannerStyle === "solid" ? "default" : "outline"}
            size="sm"
            onClick={() => setBannerStyle("solid")}
          >
            Sólido
          </Button>
          <Button
            variant={bannerStyle === "stripes" ? "default" : "outline"}
            size="sm"
            onClick={() => setBannerStyle("stripes")}
          >
            Listras
          </Button>
          <Button
            variant={bannerStyle === "double-border" ? "default" : "outline"}
            size="sm"
            onClick={() => setBannerStyle("double-border")}
          >
            Borda Dupla
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleStartMarquee}>Iniciar Marquee</Button>
        <Button variant="outline" onClick={stopAnimation}>
          Parar Animação
        </Button>
        <Button variant="destructive" onClick={handleClearMarquees}>
          Limpar Marquees
        </Button>
      </div>
    </div>
  );
}
