"use client";

import { useCallback, useState } from "react";
import { Smartphone, Monitor, Tablet, Play, FrameIcon } from "lucide-react";
import { toast } from "sonner";

interface CanvasMockupPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type MockupType = "iphone" | "android" | "laptop" | "tablet" | "youtube" | "instagram" | "twitter";

interface Mockup {
  type: MockupType;
  label: string;
  icon: React.ReactNode;
  frameColor: string;
  screenRatio: number;
  borderRadius: number;
  bezelTop: number;
  bezelSide: number;
  bezelBottom: number;
  notch: boolean;
  frameWidth: number;
  frameHeight: number;
}

const MOCKUPS: Mockup[] = [
  {
    type: "iphone",
    label: "iPhone",
    icon: <Smartphone className="w-4 h-4" />,
    frameColor: "#1a1a2e",
    screenRatio: 9 / 19.5,
    borderRadius: 40,
    bezelTop: 10,
    bezelSide: 8,
    bezelBottom: 10,
    notch: true,
    frameWidth: 280,
    frameHeight: 560,
  },
  {
    type: "android",
    label: "Android",
    icon: <Smartphone className="w-4 h-4" />,
    frameColor: "#2d2d2d",
    screenRatio: 9 / 20,
    borderRadius: 20,
    bezelTop: 8,
    bezelSide: 6,
    bezelBottom: 8,
    notch: false,
    frameWidth: 270,
    frameHeight: 540,
  },
  {
    type: "laptop",
    label: "Laptop",
    icon: <Monitor className="w-4 h-4" />,
    frameColor: "#c0c0c0",
    screenRatio: 16 / 10,
    borderRadius: 8,
    bezelTop: 12,
    bezelSide: 12,
    bezelBottom: 24,
    notch: false,
    frameWidth: 500,
    frameHeight: 340,
  },
  {
    type: "tablet",
    label: "Tablet",
    icon: <Tablet className="w-4 h-4" />,
    frameColor: "#1a1a1a",
    screenRatio: 4 / 3,
    borderRadius: 16,
    bezelTop: 10,
    bezelSide: 20,
    bezelBottom: 10,
    notch: false,
    frameWidth: 420,
    frameHeight: 330,
  },
  {
    type: "youtube",
    label: "YouTube",
    icon: <Play className="w-4 h-4" />,
    frameColor: "#ff0000",
    screenRatio: 16 / 9,
    borderRadius: 4,
    bezelTop: 40,
    bezelSide: 0,
    bezelBottom: 0,
    notch: false,
    frameWidth: 480,
    frameHeight: 270,
  },
  {
    type: "instagram",
    label: "Instagram",
    icon: <FrameIcon className="w-4 h-4" />,
    frameColor: "#c13584",
    screenRatio: 1,
    borderRadius: 8,
    bezelTop: 36,
    bezelSide: 0,
    bezelBottom: 0,
    notch: false,
    frameWidth: 360,
    frameHeight: 360,
  },
  {
    type: "twitter",
    label: "Twitter / X",
    icon: <FrameIcon className="w-4 h-4" />,
    frameColor: "#000000",
    screenRatio: 2,
    borderRadius: 4,
    bezelTop: 32,
    bezelSide: 0,
    bezelBottom: 0,
    notch: false,
    frameWidth: 440,
    frameHeight: 220,
  },
];

function drawMockupToCanvas(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cv: any,
  mockup: Mockup,
  screenshotDataUrl: string,
  padding: number
): void {
  import("fabric").then((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = m.fabric as any;
    const cw = cv.getWidth();
    const ch = cv.getHeight();
    const scale = Math.min(
      (cw - padding * 2) / mockup.frameWidth,
      (ch - padding * 2) / mockup.frameHeight
    );
    const fw = mockup.frameWidth * scale;
    const fh = mockup.frameHeight * scale;
    const left = (cw - fw) / 2;
    const top = (ch - fh) / 2;

    // Frame background rect
    const frame = new f.Rect({
      left,
      top,
      width: fw,
      height: fh,
      fill: mockup.frameColor,
      rx: mockup.borderRadius * scale,
      ry: mockup.borderRadius * scale,
      selectable: true,
      data: { mockupPart: "frame", mockupType: mockup.type },
    });

    // Screen image
    const screenLeft = left + mockup.bezelSide * scale;
    const screenTop = top + mockup.bezelTop * scale;
    const screenW = fw - mockup.bezelSide * 2 * scale;
    const screenH = fh - (mockup.bezelTop + mockup.bezelBottom) * scale;

    f.Image.fromURL(
      screenshotDataUrl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (img: any) => {
        if (!img) return;
        img.scaleToWidth(screenW);
        const scaledH = img.getScaledHeight();
        if (scaledH > screenH) img.scaleToHeight(screenH);
        img.set({
          left: screenLeft,
          top: screenTop,
          data: { mockupPart: "screen", mockupType: mockup.type },
        });
        img.setCoords();

        // Notch for iPhone
        if (mockup.notch) {
          const notchW = 80 * scale;
          const notchH = 22 * scale;
          const notch = new f.Rect({
            left: left + (fw - notchW) / 2,
            top,
            width: notchW,
            height: notchH,
            fill: mockup.frameColor,
            rx: notchH / 2,
            ry: notchH / 2,
            selectable: false,
            evented: false,
            data: { mockupPart: "notch" },
          });
          const group = new f.Group([frame, img, notch], { selectable: true });
          cv.add(group);
          cv.setActiveObject(group);
        } else {
          const group = new f.Group([frame, img], { selectable: true });
          cv.add(group);
          cv.setActiveObject(group);
        }

        cv.requestRenderAll();
      },
      { crossOrigin: "anonymous" }
    );
  });
}

export function CanvasMockupPanel({ fabricCanvas }: CanvasMockupPanelProps) {
  const [selected, setSelected] = useState<MockupType>("iphone");
  const [padding, setPadding] = useState(40);
  const [useCurrentCanvas, setUseCurrentCanvas] = useState(true);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const applyMockup = useCallback(() => {
    const cv = fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }

    const mockup = MOCKUPS.find((m) => m.type === selected);
    if (!mockup) return;

    if (useCurrentCanvas) {
      try {
        const dataUrl = cv.toDataURL({ format: "png", multiplier: 1 });
        cv.clear();
        drawMockupToCanvas(cv, mockup, dataUrl, padding);
        toast.success(`Mockup ${mockup.label} aplicado`);
      } catch {
        toast.error("Erro ao capturar canvas");
      }
    } else {
      if (!customImageUrl.trim()) { toast.error("Informe a URL da imagem"); return; }
      drawMockupToCanvas(cv, mockup, customImageUrl.trim(), padding);
      toast.success(`Mockup ${mockup.label} inserido`);
    }
  }, [fabricCanvas, selected, padding, useCurrentCanvas, customImageUrl]);

  const insertEmptyMockup = useCallback(() => {
    const cv = fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }
    const mockup = MOCKUPS.find((m) => m.type === selected);
    if (!mockup) return;

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const cw = cv.getWidth();
      const ch = cv.getHeight();
      const scale = Math.min((cw - padding * 2) / mockup.frameWidth, (ch - padding * 2) / mockup.frameHeight);
      const fw = mockup.frameWidth * scale;
      const fh = mockup.frameHeight * scale;
      const left = (cw - fw) / 2;
      const top = (ch - fh) / 2;

      const frame = new f.Rect({
        left, top, width: fw, height: fh,
        fill: mockup.frameColor,
        rx: mockup.borderRadius * scale,
        ry: mockup.borderRadius * scale,
        selectable: true,
      });

      const screenLeft = left + mockup.bezelSide * scale;
      const screenTop = top + mockup.bezelTop * scale;
      const screenW = fw - mockup.bezelSide * 2 * scale;
      const screenH = fh - (mockup.bezelTop + mockup.bezelBottom) * scale;

      const screen = new f.Rect({
        left: screenLeft, top: screenTop, width: screenW, height: screenH,
        fill: "#ffffff", rx: 2, ry: 2, selectable: false,
      });

      const group = new f.Group([frame, screen], { selectable: true });
      cv.add(group);
      cv.setActiveObject(group);
      cv.requestRenderAll();
      toast.success(`Frame ${mockup.label} inserido`);
    });
  }, [fabricCanvas, selected, padding]);

  const current = MOCKUPS.find((m) => m.type === selected)!;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Mockup de Dispositivo</span>
      </div>

      {/* Mockup selector */}
      <div className="grid grid-cols-4 gap-1">
        {MOCKUPS.map((m) => (
          <button
            key={m.type}
            onClick={() => setSelected(m.type)}
            className={`flex flex-col items-center gap-1 py-2 rounded border text-[7px] transition-colors ${
              selected === m.type
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Selected mockup info */}
      <div className="flex flex-col gap-1 p-2 rounded border border-border bg-muted/10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium">{current.label}</span>
          <span
            className="w-4 h-4 rounded-full border border-border"
            style={{ background: current.frameColor }}
          />
        </div>
        <span className="text-[7px] text-muted-foreground">
          {current.frameWidth} × {current.frameHeight}px · Raio {current.borderRadius}px
        </span>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useCurrentCanvas}
            onChange={(e) => setUseCurrentCanvas(e.target.checked)}
            className="accent-primary w-3 h-3"
          />
          <span className="text-[8px]">Usar conteúdo atual do canvas como tela</span>
        </label>

        {!useCurrentCanvas && (
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-muted-foreground">URL da imagem</span>
            <input
              type="text"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="https://..."
              className="bg-muted/50 border border-border rounded px-2 py-1 text-[8px] focus:outline-none focus:border-primary"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Padding</span>
          <input
            type="number"
            min={0}
            max={200}
            step={10}
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="w-16 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary"
          />
          <span className="text-[8px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={applyMockup}
        disabled={!fabricCanvas}
        className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40"
      >
        <Smartphone className="w-3 h-3" /> Aplicar Mockup ao Canvas
      </button>

      <button
        onClick={insertEmptyMockup}
        disabled={!fabricCanvas}
        className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40"
      >
        <FrameIcon className="w-3 h-3" /> Inserir Frame Vazio
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        &quot;Aplicar&quot; usa o canvas atual como tela do mockup · &quot;Frame&quot; insere contorno vazio
      </p>
    </div>
  );
}
