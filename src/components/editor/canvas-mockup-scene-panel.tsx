"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor } from "lucide-react";
import { toast } from "sonner";

interface CanvasMockupScenePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface ScenePreset {
  id: string;
  label: string;
  icon: string;
  bgColor: string;
  description: string;
}

const SCENE_PRESETS: ScenePreset[] = [
  { id: "mesa", label: "Mesa", icon: "🖥", bgColor: "#f5f5f0", description: "Mesa de trabalho" },
  { id: "mao", label: "Mão", icon: "📱", bgColor: "#e8e0d8", description: "Dispositivo na mão" },
  { id: "parede", label: "Parede", icon: "🖼", bgColor: "#ddd8cc", description: "Quadro na parede" },
  { id: "tela", label: "Tela", icon: "💻", bgColor: "#1a1a2e", description: "Tela de computador" },
  { id: "outdoor", label: "Outdoor", icon: "🏙", bgColor: "#87ceeb", description: "Outdoor urbano" },
  { id: "livro", label: "Livro", icon: "📖", bgColor: "#fdf6e3", description: "Capa de livro" },
];

function generateSceneElements(
  scene: ScenePreset,
  bgColor: string,
  addShadow: boolean,
  scale: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  canvasWidth: number,
  canvasHeight: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [];

  const shadowOptions = addShadow
    ? new fabric.Shadow({
        color: "rgba(0,0,0,0.35)",
        blur: 24,
        offsetX: 6,
        offsetY: 6,
      })
    : null;

  // Background rect filling the entire canvas
  const bg = new fabric.Rect({
    left: 0,
    top: 0,
    width: canvasWidth,
    height: canvasHeight,
    fill: bgColor,
    selectable: false,
    evented: false,
    data: { mockupScene: true, sceneType: scene.id },
  });
  objects.push(bg);

  const frameW = canvasWidth * scale;
  const frameH = canvasHeight * scale;
  const frameLeft = (canvasWidth - frameW) / 2;
  const frameTop = (canvasHeight - frameH) / 2;

  const cornerRadiusMap: Record<string, number> = {
    mesa: 4,
    mao: 16,
    parede: 8,
    tela: 2,
    outdoor: 0,
    livro: 4,
  };
  const rx = cornerRadiusMap[scene.id] ?? 4;

  if (scene.id === "tela") {
    // Monitor bezel (dark outer frame)
    const bezelPad = 20;
    const bezel = new fabric.Rect({
      left: frameLeft - bezelPad,
      top: frameTop - bezelPad,
      width: frameW + bezelPad * 2,
      height: frameH + bezelPad * 2,
      fill: "#1a1a2e",
      rx: 8,
      ry: 8,
      selectable: false,
      evented: false,
      shadow: shadowOptions,
      data: { mockupScene: true, sceneType: scene.id },
    });
    objects.push(bezel);

    // Inner screen area (lighter)
    const screen = new fabric.Rect({
      left: frameLeft,
      top: frameTop,
      width: frameW,
      height: frameH,
      fill: "#2a2a3e",
      rx,
      ry: rx,
      selectable: false,
      evented: false,
      data: { mockupScene: true, sceneType: scene.id },
    });
    objects.push(screen);
  } else if (scene.id === "mesa") {
    // Main frame
    const frame = new fabric.Rect({
      left: frameLeft,
      top: frameTop,
      width: frameW,
      height: frameH,
      fill: "#ffffff",
      rx,
      ry: rx,
      selectable: false,
      evented: false,
      shadow: shadowOptions,
      data: { mockupScene: true, sceneType: scene.id },
    });
    objects.push(frame);

    // Subtle surface overlay with low opacity
    const surface = new fabric.Rect({
      left: frameLeft,
      top: frameTop + frameH * 0.7,
      width: frameW,
      height: frameH * 0.3,
      fill: "rgba(0,0,0,0.06)",
      rx,
      ry: rx,
      selectable: false,
      evented: false,
      data: { mockupScene: true, sceneType: scene.id },
    });
    objects.push(surface);
  } else {
    // Generic frame for all other scene types
    const frame = new fabric.Rect({
      left: frameLeft,
      top: frameTop,
      width: frameW,
      height: frameH,
      fill: "#ffffff",
      rx,
      ry: rx,
      selectable: false,
      evented: false,
      shadow: shadowOptions,
      data: { mockupScene: true, sceneType: scene.id },
    });
    objects.push(frame);
  }

  return objects;
}

export function CanvasMockupScenePanel({ fabricCanvas }: CanvasMockupScenePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [selectedScene, setSelectedScene] = useState<string>("mesa");
  const [bgColor, setBgColor] = useState<string>("#f5f5f0");
  const [addShadow, setAddShadow] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(0.85);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // Sync bgColor with selected scene preset
  const handleSceneSelect = useCallback((sceneId: string) => {
    setSelectedScene(sceneId);
    const preset = SCENE_PRESETS.find((p) => p.id === sceneId);
    if (preset) {
      setBgColor(preset.bgColor);
    }
  }, []);

  const handleGenerate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível.");
      return;
    }

    const scene = SCENE_PRESETS.find((p) => p.id === selectedScene);
    if (!scene) {
      toast.error("Cena não encontrada.");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;

      // Remove existing mockup scene objects
      const existing = canvas
        .getObjects()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((obj: any) => obj.data && obj.data.mockupScene === true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing.forEach((obj: any) => canvas.remove(obj));

      const canvasWidth: number = canvas.getWidth();
      const canvasHeight: number = canvas.getHeight();

      const newObjects = generateSceneElements(
        scene,
        bgColor,
        addShadow,
        scale,
        f,
        canvasWidth,
        canvasHeight
      );

      // Add objects to canvas, then send each to back (in reverse order so bg ends up furthest back)
      for (let i = newObjects.length - 1; i >= 0; i--) {
        canvas.add(newObjects[i]);
        canvas.sendToBack(newObjects[i]);
      }

      canvas.renderAll();
      toast.success(`Cena "${scene.label}" gerada com sucesso!`);
    }).catch(() => {
      toast.error("Erro ao carregar Fabric.js.");
    });
  }, [selectedScene, bgColor, addShadow, scale]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível.");
      return;
    }

    const existing = canvas
      .getObjects()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((obj: any) => obj.data && obj.data.mockupScene === true);

    if (existing.length === 0) {
      toast.error("Nenhuma cena encontrada para remover.");
      return;
    }

    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing.forEach((obj: any) => canvas.remove(obj));
      canvas.renderAll();
      toast.success("Cena de mockup removida.");
    });
  }, []);

  const selectedPreset = SCENE_PRESETS.find((p) => p.id === selectedScene);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Monitor className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Cena de Mockup</span>
      </div>

      {/* Scene type selector — 3x2 grid */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Tipo de cena</p>
        <div className="grid grid-cols-3 gap-2">
          {SCENE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSceneSelect(preset.id)}
              title={preset.description}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs transition-colors hover:bg-accent ${
                selectedScene === preset.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              <span className="text-lg leading-none">{preset.icon}</span>
              <span className="font-medium">{preset.label}</span>
            </button>
          ))}
        </div>
        {selectedPreset && (
          <p className="mt-1 text-xs text-muted-foreground italic">{selectedPreset.description}</p>
        )}
      </div>

      {/* Background color picker */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Cor de fundo</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
          />
          <span className="font-mono text-xs text-muted-foreground">{bgColor.toUpperCase()}</span>
        </div>
      </div>

      {/* Scale slider */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Escala do frame</p>
          <span className="text-xs font-medium">{Math.round(scale * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={1.0}
          step={0.05}
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Shadow toggle */}
      <div className="flex items-center gap-2">
        <input
          id="mockup-shadow"
          type="checkbox"
          checked={addShadow}
          onChange={(e) => setAddShadow(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-primary"
        />
        <label htmlFor="mockup-shadow" className="cursor-pointer text-xs text-muted-foreground">
          Adicionar sombra ao frame
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Gerar Cena
        </button>
        <button
          onClick={handleClear}
          className="flex-1 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
        >
          Limpar Cena
        </button>
      </div>
    </div>
  );
}
