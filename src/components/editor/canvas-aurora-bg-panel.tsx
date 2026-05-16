"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AURORA_PALETTES: Record<string, string[]> = {
  verde: ["#00ff88", "#00d4ff", "#7b2ff7", "#00ffaa"],
  rosa: ["#ff6ec7", "#c724b1", "#7b2ff7", "#ff8fcf"],
  cyan: ["#00e5ff", "#00b8d9", "#1de9b6", "#0091ea"],
  dourada: ["#ffd700", "#ffa500", "#ff6347", "#ffcc33"],
  roxo: ["#7b2ff7", "#e040fb", "#3d1e6d", "#a020f0"],
  multi: ["#ff0080", "#ff8c00", "#ffd500", "#00ff88", "#00d4ff", "#7b2ff7"],
};

const PRESETS: { id: string; label: string }[] = [
  { id: "verde", label: "Aurora Verde" },
  { id: "rosa", label: "Aurora Rosa" },
  { id: "cyan", label: "Aurora Cyan" },
  { id: "dourada", label: "Aurora Dourada" },
  { id: "roxo", label: "Aurora Roxo" },
  { id: "multi", label: "Aurora Multi" },
];

function buildWavyPath(
  width: number,
  amplitude: number,
  frequency: number,
  baseY: number,
  phase: number
): string {
  const segments = Math.max(4, Math.floor(8 * frequency));
  const step = width / segments;
  let d = `M 0 ${baseY}`;
  for (let i = 0; i < segments; i++) {
    const x0 = i * step;
    const x1 = x0 + step;
    const cx1 = x0 + step / 3;
    const cx2 = x0 + (2 * step) / 3;
    const cy1 =
      baseY + Math.sin((i * frequency + phase) * Math.PI) * amplitude;
    const cy2 =
      baseY +
      Math.sin(((i + 0.5) * frequency + phase) * Math.PI) * amplitude * -1;
    const y1 =
      baseY +
      Math.sin(((i + 1) * frequency + phase) * Math.PI) * amplitude * 0.5;
    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x1} ${y1}`;
  }
  // close to bottom-right then bottom-left
  d += ` L ${width} ${baseY + amplitude * 2}`;
  d += ` L 0 ${baseY + amplitude * 2}`;
  d += " Z";
  return d;
}

interface CanvasAuroraBgPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasAuroraBgPanel({ fabricCanvas }: CanvasAuroraBgPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [palette, setPalette] = useState<string>("verde");
  const [waveCount, setWaveCount] = useState<number>(4);
  const [amplitude, setAmplitude] = useState<number>(150);
  const [frequency, setFrequency] = useState<number>(1.2);
  const [opacity, setOpacity] = useState<number>(0.7);
  const [blur, setBlur] = useState<number>(20);
  const [darkBg, setDarkBg] = useState<boolean>(true);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function removeAurora() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = canvas.getObjects().filter((o: any) => o?.data?.auroraBg);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
  }

  function handleRemove() {
    removeAurora();
    toast.success("Aurora removida");
  }

  function handleGenerate() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f) {
          toast.error("Fabric indisponível");
          return;
        }
        // Remove existing aurora
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = canvas
          .getObjects()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((o: any) => o?.data?.auroraBg);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing.forEach((o: any) => canvas.remove(o));

        const canvasW = canvas.getWidth();
        const canvasH = canvas.getHeight();
        const colors = AURORA_PALETTES[palette] || AURORA_PALETTES.verde;

        if (darkBg) {
          const base = new f.Rect({
            left: 0,
            top: 0,
            width: canvasW,
            height: canvasH,
            fill: "#0a0a1a",
            selectable: false,
            evented: false,
            data: { auroraBg: true },
          });
          canvas.add(base);
          canvas.sendToBack(base);
        }

        for (let i = 0; i < waveCount; i++) {
          const phase = i * 0.6;
          const baseY = canvasH / 2 + (i - waveCount / 2) * (amplitude * 0.4);
          const variation = (i % 2 === 0 ? 1 : -1) * (amplitude * 0.3);
          const adjustedBaseY = baseY + variation * 0.1;
          const d = buildWavyPath(
            canvasW,
            amplitude,
            frequency,
            adjustedBaseY,
            phase
          );
          const color = colors[i % colors.length];
          const path = new f.Path(d, {
            left: 0,
            top: 0,
            fill: color,
            opacity,
            selectable: false,
            evented: false,
            data: { auroraBg: true },
            shadow: new f.Shadow({
              color,
              blur,
              offsetX: 0,
              offsetY: 0,
            }),
          });
          canvas.add(path);
        }

        canvas.requestRenderAll();
        toast.success("Aurora gerada");
      })
      .catch(() => {
        toast.error("Erro ao carregar fabric");
      });
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-semibold">Fundo Aurora / Northern Lights</h3>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium">Paleta</div>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              variant={palette === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPalette(p.id)}
              className="text-xs"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>Ondas</span>
            <span className="text-muted-foreground">{waveCount}</span>
          </div>
          <Input
            type="range"
            min={2}
            max={8}
            step={1}
            value={waveCount}
            onChange={(e) => setWaveCount(parseInt(e.target.value, 10))}
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>Amplitude</span>
            <span className="text-muted-foreground">{amplitude}px</span>
          </div>
          <Input
            type="range"
            min={50}
            max={300}
            step={1}
            value={amplitude}
            onChange={(e) => setAmplitude(parseInt(e.target.value, 10))}
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>Frequencia</span>
            <span className="text-muted-foreground">{frequency.toFixed(2)}</span>
          </div>
          <Input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={frequency}
            onChange={(e) => setFrequency(parseFloat(e.target.value))}
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>Opacidade</span>
            <span className="text-muted-foreground">{opacity.toFixed(2)}</span>
          </div>
          <Input
            type="range"
            min={0.4}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>Blur</span>
            <span className="text-muted-foreground">{blur}</span>
          </div>
          <Input
            type="range"
            min={0}
            max={40}
            step={1}
            value={blur}
            onChange={(e) => setBlur(parseInt(e.target.value, 10))}
          />
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={darkBg}
            onChange={(e) => setDarkBg(e.target.checked)}
          />
          <span>Fundo escuro</span>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleGenerate} size="sm" className="w-full">
          Gerar Aurora
        </Button>
        <Button
          onClick={handleRemove}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Remover Aurora
        </Button>
      </div>
    </div>
  );
}
