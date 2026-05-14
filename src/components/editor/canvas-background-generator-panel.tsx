"use client";

import { useCallback, useRef, useState } from "react";
import { Layers, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface CanvasBackgroundGeneratorPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BgType = "solid" | "linear" | "radial" | "mesh" | "noise" | "stripes" | "dots" | "waves";

interface ColorStop {
  color: string;
  pos: number;
}

const BG_TYPES: { value: BgType; label: string }[] = [
  { value: "solid", label: "Sólida" },
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
  { value: "mesh", label: "Mesh" },
  { value: "noise", label: "Ruído" },
  { value: "stripes", label: "Listras" },
  { value: "dots", label: "Pontos" },
  { value: "waves", label: "Ondas" },
];

const PRESET_GRADIENTS: { label: string; stops: ColorStop[] }[] = [
  { label: "Aurora", stops: [{ color: "#7928ca", pos: 0 }, { color: "#ff0080", pos: 50 }, { color: "#ff4d4d", pos: 100 }] },
  { label: "Ocean", stops: [{ color: "#0f2027", pos: 0 }, { color: "#203a43", pos: 50 }, { color: "#2c5364", pos: 100 }] },
  { label: "Sunset", stops: [{ color: "#f7971e", pos: 0 }, { color: "#ffd200", pos: 100 }] },
  { label: "Forest", stops: [{ color: "#134e5e", pos: 0 }, { color: "#71b280", pos: 100 }] },
  { label: "Candy", stops: [{ color: "#fd1d1d", pos: 0 }, { color: "#833ab4", pos: 50 }, { color: "#fcb045", pos: 100 }] },
  { label: "Steel", stops: [{ color: "#485563", pos: 0 }, { color: "#29323c", pos: 100 }] },
  { label: "Mint", stops: [{ color: "#11998e", pos: 0 }, { color: "#38ef7d", pos: 100 }] },
  { label: "Rose", stops: [{ color: "#f953c6", pos: 0 }, { color: "#b91d73", pos: 100 }] },
];

const RANDOM_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#0ea5e9"];

function randomColor() {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

function generateNoiseDataURL(width: number, height: number, baseColor: string, opacity: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Fill with base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Add noise
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 80 * opacity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

function generateStripes(width: number, height: number, color1: string, color2: string, size: number, angle: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-width, -height);
  const diag = Math.sqrt(width * width + height * height) * 2;
  ctx.fillStyle = color2;
  for (let x = -diag; x < diag; x += size * 2) {
    ctx.fillRect(x, -diag, size, diag * 2);
  }
  ctx.restore();
  return canvas.toDataURL();
}

function generateDots(width: number, height: number, bgColor: string, dotColor: string, dotSize: number, spacing: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = dotColor;
  for (let x = spacing / 2; x < width; x += spacing) {
    for (let y = spacing / 2; y < height; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvas.toDataURL();
}

function generateWaves(width: number, height: number, bgColor: string, waveColor: string, amplitude: number, frequency: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  for (let layer = 0; layer < 4; layer++) {
    ctx.beginPath();
    ctx.moveTo(0, height);
    const phase = layer * (Math.PI / 2);
    const layerAmplitude = amplitude * (1 - layer * 0.2);
    const baseY = height * (0.5 + layer * 0.1);
    for (let x = 0; x <= width; x++) {
      const y = baseY + layerAmplitude * Math.sin((x / width) * frequency * Math.PI * 2 + phase);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.globalAlpha = 0.3 - layer * 0.05;
    ctx.fillStyle = waveColor;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return canvas.toDataURL();
}

export function CanvasBackgroundGeneratorPanel({ fabricCanvas }: CanvasBackgroundGeneratorPanelProps) {
  const [bgType, setBgType] = useState<BgType>("linear");
  const [solidColor, setSolidColor] = useState("#6366f1");
  const [stops, setStops] = useState<ColorStop[]>([{ color: "#7928ca", pos: 0 }, { color: "#ff0080", pos: 100 }]);
  const [gradientAngle, setGradientAngle] = useState(135);
  const [noiseColor, setNoiseColor] = useState("#1a1a2e");
  const [noiseOpacity, setNoiseOpacity] = useState(0.5);
  const [stripeColor1, setStripeColor1] = useState("#1a1a2e");
  const [stripeColor2, setStripeColor2] = useState("#e94560");
  const [stripeSize, setStripeSize] = useState(30);
  const [stripeAngle, setStripeAngle] = useState(45);
  const [dotBg, setDotBg] = useState("#ffffff");
  const [dotColor, setDotColor] = useState("#6366f1");
  const [dotSize, setDotSize] = useState(6);
  const [dotSpacing, setDotSpacing] = useState(24);
  const [waveBg, setWaveBg] = useState("#0f2027");
  const [waveColor, setWaveColor] = useState("#203a43");
  const [waveAmplitude, setWaveAmplitude] = useState(40);
  const [waveFrequency, setWaveFrequency] = useState(3);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastBgRef = useRef<any>(null);

  const updateStop = useCallback((idx: number, field: keyof ColorStop, value: string | number) => {
    setStops((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }, []);

  const addStop = useCallback(() => {
    if (stops.length >= 5) return;
    const newPos = Math.round((stops[stops.length - 1].pos + 100) / 2);
    setStops((prev) => [...prev, { color: randomColor(), pos: Math.min(100, newPos) }]);
  }, [stops]);

  const removeStop = useCallback((idx: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, i) => i !== idx));
  }, [stops.length]);

  const applyBackground = useCallback(() => {
    const cv = fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const cw = cv.getWidth();
      const ch = cv.getHeight();

      // Remove previous background object
      if (lastBgRef.current) {
        cv.remove(lastBgRef.current);
        lastBgRef.current = null;
      }

      if (bgType === "solid") {
        const rect = new f.Rect({ left: 0, top: 0, width: cw, height: ch, fill: solidColor, selectable: false, evented: false, data: { isBg: true } });
        cv.add(rect);
        cv.sendToBack(rect);
        lastBgRef.current = rect;
        cv.requestRenderAll();
        toast.success("Fundo sólido aplicado");

      } else if (bgType === "linear") {
        const sortedStops = [...stops].sort((a, b) => a.pos - b.pos);
        const angleRad = (gradientAngle * Math.PI) / 180;
        const x1 = cw / 2 - Math.cos(angleRad) * cw / 2;
        const y1 = ch / 2 - Math.sin(angleRad) * ch / 2;
        const x2 = cw / 2 + Math.cos(angleRad) * cw / 2;
        const y2 = ch / 2 + Math.sin(angleRad) * ch / 2;

        const gradient = new f.Gradient({
          type: "linear",
          coords: { x1, y1, x2, y2 },
          colorStops: sortedStops.map((s) => ({ offset: s.pos / 100, color: s.color })),
        });
        const rect = new f.Rect({ left: 0, top: 0, width: cw, height: ch, fill: gradient, selectable: false, evented: false, data: { isBg: true } });
        cv.add(rect);
        cv.sendToBack(rect);
        lastBgRef.current = rect;
        cv.requestRenderAll();
        toast.success("Gradiente linear aplicado");

      } else if (bgType === "radial") {
        const sortedStops = [...stops].sort((a, b) => a.pos - b.pos);
        const gradient = new f.Gradient({
          type: "radial",
          coords: { x1: cw / 2, y1: ch / 2, r1: 0, x2: cw / 2, y2: ch / 2, r2: Math.max(cw, ch) / 2 },
          colorStops: sortedStops.map((s) => ({ offset: s.pos / 100, color: s.color })),
        });
        const rect = new f.Rect({ left: 0, top: 0, width: cw, height: ch, fill: gradient, selectable: false, evented: false, data: { isBg: true } });
        cv.add(rect);
        cv.sendToBack(rect);
        lastBgRef.current = rect;
        cv.requestRenderAll();
        toast.success("Gradiente radial aplicado");

      } else if (bgType === "mesh") {
        // Mesh: multiple overlapping radial gradients
        const offscreen = document.createElement("canvas");
        offscreen.width = cw;
        offscreen.height = ch;
        const ctx = offscreen.getContext("2d")!;
        const baseColor = stops[0]?.color ?? "#1a1a2e";
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, cw, ch);
        const meshColors = stops.slice(1).length > 0 ? stops.slice(1).map(s => s.color) : [stops[0].color, "#ff0080", "#00ffff"];
        const points = [{ x: cw * 0.2, y: ch * 0.2 }, { x: cw * 0.8, y: ch * 0.3 }, { x: cw * 0.5, y: ch * 0.7 }, { x: cw * 0.1, y: ch * 0.8 }, { x: cw * 0.9, y: ch * 0.9 }];
        points.forEach((p, i) => {
          const color = meshColors[i % meshColors.length];
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(cw, ch) * 0.5);
          grad.addColorStop(0, color + "88");
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, cw, ch);
        });
        const dataUrl = offscreen.toDataURL();
        f.Image.fromURL(dataUrl, (img: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const i = img as any;
          i.set({ left: 0, top: 0, selectable: false, evented: false, data: { isBg: true } });
          i.setCoords();
          cv.add(i);
          cv.sendToBack(i);
          lastBgRef.current = i;
          cv.requestRenderAll();
        });
        toast.success("Mesh gradient aplicado");

      } else if (bgType === "noise") {
        const dataUrl = generateNoiseDataURL(cw, ch, noiseColor, noiseOpacity);
        f.Image.fromURL(dataUrl, (img: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const i = img as any;
          i.set({ left: 0, top: 0, selectable: false, evented: false, data: { isBg: true } });
          i.setCoords();
          cv.add(i);
          cv.sendToBack(i);
          lastBgRef.current = i;
          cv.requestRenderAll();
        });
        toast.success("Fundo com ruído aplicado");

      } else if (bgType === "stripes") {
        const dataUrl = generateStripes(cw, ch, stripeColor1, stripeColor2, stripeSize, stripeAngle);
        f.Image.fromURL(dataUrl, (img: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const i = img as any;
          i.set({ left: 0, top: 0, selectable: false, evented: false, data: { isBg: true } });
          i.setCoords();
          cv.add(i);
          cv.sendToBack(i);
          lastBgRef.current = i;
          cv.requestRenderAll();
        });
        toast.success("Listras aplicadas");

      } else if (bgType === "dots") {
        const dataUrl = generateDots(cw, ch, dotBg, dotColor, dotSize, dotSpacing);
        f.Image.fromURL(dataUrl, (img: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const i = img as any;
          i.set({ left: 0, top: 0, selectable: false, evented: false, data: { isBg: true } });
          i.setCoords();
          cv.add(i);
          cv.sendToBack(i);
          lastBgRef.current = i;
          cv.requestRenderAll();
        });
        toast.success("Pontos aplicados");

      } else if (bgType === "waves") {
        const dataUrl = generateWaves(cw, ch, waveBg, waveColor, waveAmplitude, waveFrequency);
        f.Image.fromURL(dataUrl, (img: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const i = img as any;
          i.set({ left: 0, top: 0, selectable: false, evented: false, data: { isBg: true } });
          i.setCoords();
          cv.add(i);
          cv.sendToBack(i);
          lastBgRef.current = i;
          cv.requestRenderAll();
        });
        toast.success("Ondas aplicadas");
      }
    });
  }, [fabricCanvas, bgType, solidColor, stops, gradientAngle, noiseColor, noiseOpacity, stripeColor1, stripeColor2, stripeSize, stripeAngle, dotBg, dotColor, dotSize, dotSpacing, waveBg, waveColor, waveAmplitude, waveFrequency]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Gerador de Fundo</span>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-4 gap-0.5">
        {BG_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setBgType(t.value)}
            className={`py-1 rounded border text-[7px] transition-colors ${
              bgType === t.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Controls by type */}
      {bgType === "solid" && (
        <div className="flex items-center gap-2 p-2 rounded border border-border">
          <span className="text-[9px] text-muted-foreground">Cor</span>
          <input type="color" value={solidColor} onChange={(e) => setSolidColor(e.target.value)}
            className="w-7 h-6 rounded border border-border cursor-pointer" />
          <span className="text-[7px] font-mono text-muted-foreground">{solidColor}</span>
        </div>
      )}

      {(bgType === "linear" || bgType === "radial" || bgType === "mesh") && (
        <div className="flex flex-col gap-2 p-2 rounded border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-medium">Paradas de cor</span>
            <button onClick={addStop} className="text-[7px] text-primary hover:underline">+ Adicionar</button>
          </div>
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input type="color" value={s.color} onChange={(e) => updateStop(i, "color", e.target.value)}
                className="w-6 h-5 rounded border border-border cursor-pointer" />
              <input type="range" min={0} max={100} value={s.pos}
                onChange={(e) => updateStop(i, "pos", Number(e.target.value))}
                className="flex-1 accent-primary h-1" />
              <span className="text-[7px] tabular-nums w-6">{s.pos}%</span>
              {stops.length > 2 && (
                <button onClick={() => removeStop(i)} className="text-[7px] text-destructive hover:text-destructive/80">×</button>
              )}
            </div>
          ))}

          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-muted-foreground">Presets</span>
            <div className="flex flex-wrap gap-1">
              {PRESET_GRADIENTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setStops(p.stops)}
                  className="px-2 py-0.5 rounded border border-border text-[7px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                  style={{
                    background: `linear-gradient(90deg, ${p.stops.map(s => s.color).join(", ")})`,
                    color: "white",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {bgType === "linear" && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">Ângulo</span>
              <input type="range" min={0} max={360} step={15} value={gradientAngle}
                onChange={(e) => setGradientAngle(Number(e.target.value))}
                className="flex-1 accent-primary h-1" />
              <span className="text-[8px] tabular-nums">{gradientAngle}°</span>
            </div>
          )}
        </div>
      )}

      {bgType === "noise" && (
        <div className="flex flex-col gap-2 p-2 rounded border border-border">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Cor base</span>
            <input type="color" value={noiseColor} onChange={(e) => setNoiseColor(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Intensidade</span>
            <input type="range" min={0.1} max={1} step={0.05} value={noiseOpacity}
              onChange={(e) => setNoiseOpacity(Number(e.target.value))}
              className="flex-1 accent-primary h-1" />
            <span className="text-[8px] tabular-nums">{Math.round(noiseOpacity * 100)}%</span>
          </div>
        </div>
      )}

      {bgType === "stripes" && (
        <div className="flex flex-col gap-2 p-2 rounded border border-border">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">Cor 1</span>
              <input type="color" value={stripeColor1} onChange={(e) => setStripeColor1(e.target.value)}
                className="w-6 h-5 rounded border border-border cursor-pointer" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">Cor 2</span>
              <input type="color" value={stripeColor2} onChange={(e) => setStripeColor2(e.target.value)}
                className="w-6 h-5 rounded border border-border cursor-pointer" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground">Largura</span>
            <input type="range" min={5} max={100} step={5} value={stripeSize}
              onChange={(e) => setStripeSize(Number(e.target.value))}
              className="flex-1 accent-primary h-1" />
            <span className="text-[7px]">{stripeSize}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground">Ângulo</span>
            <input type="range" min={0} max={180} step={15} value={stripeAngle}
              onChange={(e) => setStripeAngle(Number(e.target.value))}
              className="flex-1 accent-primary h-1" />
            <span className="text-[7px]">{stripeAngle}°</span>
          </div>
        </div>
      )}

      {bgType === "dots" && (
        <div className="flex flex-col gap-2 p-2 rounded border border-border">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">Fundo</span>
              <input type="color" value={dotBg} onChange={(e) => setDotBg(e.target.value)}
                className="w-6 h-5 rounded border border-border cursor-pointer" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">Ponto</span>
              <input type="color" value={dotColor} onChange={(e) => setDotColor(e.target.value)}
                className="w-6 h-5 rounded border border-border cursor-pointer" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground">Tamanho</span>
            <input type="range" min={2} max={30} step={1} value={dotSize}
              onChange={(e) => setDotSize(Number(e.target.value))}
              className="flex-1 accent-primary h-1" />
            <span className="text-[7px]">{dotSize}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground">Espaço</span>
            <input type="range" min={10} max={80} step={2} value={dotSpacing}
              onChange={(e) => setDotSpacing(Number(e.target.value))}
              className="flex-1 accent-primary h-1" />
            <span className="text-[7px]">{dotSpacing}px</span>
          </div>
        </div>
      )}

      {bgType === "waves" && (
        <div className="flex flex-col gap-2 p-2 rounded border border-border">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">Fundo</span>
              <input type="color" value={waveBg} onChange={(e) => setWaveBg(e.target.value)}
                className="w-6 h-5 rounded border border-border cursor-pointer" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">Onda</span>
              <input type="color" value={waveColor} onChange={(e) => setWaveColor(e.target.value)}
                className="w-6 h-5 rounded border border-border cursor-pointer" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground">Altura</span>
            <input type="range" min={10} max={150} step={5} value={waveAmplitude}
              onChange={(e) => setWaveAmplitude(Number(e.target.value))}
              className="flex-1 accent-primary h-1" />
            <span className="text-[7px]">{waveAmplitude}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground">Frequência</span>
            <input type="range" min={1} max={10} step={0.5} value={waveFrequency}
              onChange={(e) => setWaveFrequency(Number(e.target.value))}
              className="flex-1 accent-primary h-1" />
            <span className="text-[7px]">{waveFrequency}×</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={applyBackground}
          disabled={!fabricCanvas}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40"
        >
          <Wand2 className="w-3 h-3" /> Aplicar Fundo
        </button>
        <button
          onClick={() => {
            const color = randomColor();
            const color2 = randomColor();
            setStops([{ color, pos: 0 }, { color: color2, pos: 100 }]);
            setSolidColor(color);
            toast.success("Cores aleatórias geradas");
          }}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors"
          title="Gerar cores aleatórias"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Fundo é inserido no fundo do canvas · Pode ser selecionado e deletado
      </p>
    </div>
  );
}
