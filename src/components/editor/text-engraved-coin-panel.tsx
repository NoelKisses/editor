"use client";

import { useEffect, useRef, useState } from "react";
import { Award } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const METAL_PRESETS: Record<
  string,
  { face: string; edge: string; text: string }
> = {
  Ouro: { face: "#d4a574", edge: "#8b6914", text: "#3a2a05" },
  Prata: { face: "#c0c0c0", edge: "#707070", text: "#2a2a2a" },
  Bronze: { face: "#cd7f32", edge: "#6b3f15", text: "#2a1505" },
  Platina: { face: "#e5e4e2", edge: "#888888", text: "#1a1a1a" },
  Cobre: { face: "#b87333", edge: "#5c3a1a", text: "#2a1505" },
};

function distributeCharsOnCircle(
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  color: string,
  fontSize: number,
): Array<{ char: string; x: number; y: number; rotation: number }> {
  const result: Array<{
    char: string;
    x: number;
    y: number;
    rotation: number;
  }> = [];
  const len = text.length;
  if (len === 0) return result;
  // Mark unused params to avoid lint complaints while keeping signature.
  void color;
  void fontSize;
  for (let i = 0; i < len; i++) {
    const angle = (i / len) * Math.PI * 2 + startAngle;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const rotation = (angle * 180) / Math.PI + 90;
    result.push({ char: text.charAt(i), x, y, rotation });
  }
  return result;
}

interface TextEngravedCoinPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextEngravedCoinPanel({
  fabricCanvas,
}: TextEngravedCoinPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [innerText, setInnerText] = useState("2026");
  const [outerText, setOuterText] = useState(
    "BANCO DA AMAZÔNIA • CINQUENTA REAIS •",
  );
  const [metal, setMetal] = useState<string>("Ouro");
  const [diameter, setDiameter] = useState(250);
  const [ringThickness, setRingThickness] = useState(30);
  const [innerTextSize, setInnerTextSize] = useState(40);
  const [outerTextSize, setOuterTextSize] = useState(14);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric ?? (m as any);
        const preset = METAL_PRESETS[metal] ?? METAL_PRESETS.Ouro;
        const cx = (canvas.getWidth?.() ?? 800) / 2;
        const cy = (canvas.getHeight?.() ?? 600) / 2;
        const radius = diameter / 2;
        const innerRadius = radius - ringThickness;

        const outerCircle = new f.Circle({
          left: cx - radius,
          top: cy - radius,
          radius,
          fill: preset.edge,
          stroke: preset.text,
          strokeWidth: 2,
          originX: "left",
          originY: "top",
        });

        const innerCircle = new f.Circle({
          left: cx - innerRadius,
          top: cy - innerRadius,
          radius: innerRadius,
          fill: preset.face,
          stroke: preset.edge,
          strokeWidth: 2,
          originX: "left",
          originY: "top",
        });

        const innerLabel = new f.IText(innerText, {
          left: cx,
          top: cy,
          fontSize: innerTextSize,
          fill: preset.text,
          fontWeight: "bold",
          fontFamily: "serif",
          originX: "center",
          originY: "center",
        });

        const charRadius = radius - ringThickness / 2;
        const chars = distributeCharsOnCircle(
          outerText,
          cx,
          cy,
          charRadius,
          -Math.PI / 2,
          preset.text,
          outerTextSize,
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const charObjects: any[] = chars.map((c) => {
          return new f.IText(c.char, {
            left: c.x,
            top: c.y,
            fontSize: outerTextSize,
            fill: preset.text,
            fontWeight: "bold",
            fontFamily: "serif",
            originX: "center",
            originY: "center",
            angle: c.rotation,
          });
        });

        const group = new f.Group(
          [outerCircle, innerCircle, innerLabel, ...charObjects],
          {
            left: cx - radius,
            top: cy - radius,
            originX: "left",
            originY: "top",
            data: { engravedCoin: true },
          },
        );
        // Ensure tag is present even if fabric strips the data option.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (group as any).data = { engravedCoin: true };

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll?.();
        toast.success("Moeda gerada");
      })
      .catch(() => {
        toast.error("Falha ao carregar fabric");
      });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = canvas.getObjects?.() ?? [];
    const targets = objs.filter((o) => o?.data?.engravedCoin === true);
    targets.forEach((o) => canvas.remove(o));
    canvas.discardActiveObject?.();
    canvas.requestRenderAll?.();
    toast.success(`${targets.length} moeda(s) removida(s)`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Texto Gravado em Moeda</h3>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="coin-inner-text">
          Texto interno
        </label>
        <Input
          id="coin-inner-text"
          value={innerText}
          onChange={(e) => setInnerText(e.target.value)}
          placeholder="2026"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="coin-outer-text">
          Texto externo (anel)
        </label>
        <Input
          id="coin-outer-text"
          value={outerText}
          onChange={(e) => setOuterText(e.target.value)}
          placeholder="BANCO DA AMAZÔNIA • CINQUENTA REAIS •"
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Metal</span>
        <div className="grid grid-cols-5 gap-1">
          {Object.keys(METAL_PRESETS).map((name) => {
            const preset = METAL_PRESETS[name];
            const active = metal === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setMetal(name)}
                className={`flex flex-col items-center gap-1 rounded border p-1 text-[10px] ${
                  active ? "border-primary" : "border-border"
                }`}
                title={name}
              >
                <span
                  className="block h-6 w-6 rounded-full border"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${preset.face}, ${preset.edge})`,
                  }}
                />
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="coin-diameter">
          Diâmetro: {diameter}px
        </label>
        <input
          id="coin-diameter"
          type="range"
          min={150}
          max={500}
          step={1}
          value={diameter}
          onChange={(e) => setDiameter(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="coin-ring">
          Espessura do anel: {ringThickness}
        </label>
        <input
          id="coin-ring"
          type="range"
          min={10}
          max={60}
          step={1}
          value={ringThickness}
          onChange={(e) => setRingThickness(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="coin-inner-size">
          Tamanho texto interno: {innerTextSize}px
        </label>
        <input
          id="coin-inner-size"
          type="range"
          min={16}
          max={80}
          step={1}
          value={innerTextSize}
          onChange={(e) => setInnerTextSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="coin-outer-size">
          Tamanho texto externo: {outerTextSize}px
        </label>
        <input
          id="coin-outer-size"
          type="range"
          min={8}
          max={24}
          step={1}
          value={outerTextSize}
          onChange={(e) => setOuterTextSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={handleGenerate} className="flex-1">
          Gerar Moeda
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRemove}
          className="flex-1"
        >
          Remover Moedas
        </Button>
      </div>
    </div>
  );
}
