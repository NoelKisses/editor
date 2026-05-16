"use client";

import { useEffect, useRef, useState } from "react";
import { Grid2X2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ObjectDistortGridPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface DistortValues {
  skewX: number;
  skewY: number;
  scaleX: number;
  scaleY: number;
  angle: number;
}

interface DistortPreset {
  id: string;
  label: string;
  values: DistortValues;
}

const PRESETS: DistortPreset[] = [
  {
    id: "arc",
    label: "Arco",
    values: { skewX: 0, skewY: 20, scaleX: 1, scaleY: 1, angle: 0 },
  },
  {
    id: "wave",
    label: "Onda",
    values: { skewX: 25, skewY: 0, scaleX: 1, scaleY: 1, angle: 0 },
  },
  {
    id: "funnel",
    label: "Funil",
    values: { skewX: 0, skewY: 0, scaleX: 0.6, scaleY: 0.6, angle: 0 },
  },
  {
    id: "stretch",
    label: "Estiramento",
    values: { skewX: 0, skewY: 0, scaleX: 2, scaleY: 1, angle: 0 },
  },
  {
    id: "squeeze",
    label: "Espremimento",
    values: { skewX: 0, skewY: 0, scaleX: 0.5, scaleY: 1, angle: 0 },
  },
  {
    id: "diagonal",
    label: "Diagonal",
    values: { skewX: 15, skewY: 15, scaleX: 1, scaleY: 1, angle: 0 },
  },
];

const DEFAULT_VALUES: DistortValues = {
  skewX: 0,
  skewY: 0,
  scaleX: 1,
  scaleY: 1,
  angle: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActiveObjects(fabricCanvas: any): any[] {
  if (!fabricCanvas) return [];
  const active = fabricCanvas.getActiveObjects?.();
  return Array.isArray(active) ? active : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyValuesToObjects(objects: any[], values: DistortValues) {
  objects.forEach((obj) => {
    obj.set({
      skewX: values.skewX,
      skewY: values.skewY,
      scaleX: values.scaleX,
      scaleY: values.scaleY,
      angle: values.angle,
    });
    obj.setCoords?.();
  });
}

export function ObjectDistortGridPanel({
  fabricCanvas,
}: ObjectDistortGridPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [values, setValues] = useState<DistortValues>(DEFAULT_VALUES);
  const [selectionCount, setSelectionCount] = useState(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const updateCount = () => {
      const count = getActiveObjects(fabricCanvas).length;
      queueMicrotask(() => setSelectionCount(count));
    };

    updateCount();

    fabricCanvas.on?.("selection:created", updateCount);
    fabricCanvas.on?.("selection:updated", updateCount);
    fabricCanvas.on?.("selection:cleared", updateCount);

    return () => {
      fabricCanvas.off?.("selection:created", updateCount);
      fabricCanvas.off?.("selection:updated", updateCount);
      fabricCanvas.off?.("selection:cleared", updateCount);
    };
  }, [fabricCanvas]);

  const handlePreset = (preset: DistortPreset) => {
    setValues(preset.values);
    const objects = getActiveObjects(canvasRef.current);
    if (objects.length === 0) {
      toast.info(`Preset "${preset.label}" carregado. Selecione objetos para aplicar.`);
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      void f;
      applyValuesToObjects(objects, preset.values);
      canvasRef.current?.requestRenderAll?.();
      toast.success(`Preset "${preset.label}" aplicado.`);
    });
  };

  const handleApply = () => {
    const objects = getActiveObjects(canvasRef.current);
    if (objects.length === 0) {
      toast.error("Nenhum objeto selecionado.");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      void f;
      applyValuesToObjects(objects, values);
      canvasRef.current?.requestRenderAll?.();
      toast.success("Distorção aplicada.");
    });
  };

  const handleReset = () => {
    const objects = getActiveObjects(canvasRef.current);
    if (objects.length === 0) {
      toast.error("Nenhum objeto selecionado.");
      return;
    }
    setValues(DEFAULT_VALUES);
    applyValuesToObjects(objects, DEFAULT_VALUES);
    canvasRef.current?.requestRenderAll?.();
    toast.success("Distorção resetada.");
  };

  const handleSnapshot = () => {
    const objects = getActiveObjects(canvasRef.current);
    if (objects.length === 0) {
      toast.error("Nenhum objeto selecionado.");
      return;
    }
    const obj = objects[0];
    setValues({
      skewX: obj.skewX ?? 0,
      skewY: obj.skewY ?? 0,
      scaleX: obj.scaleX ?? 1,
      scaleY: obj.scaleY ?? 1,
      angle: obj.angle ?? 0,
    });
    toast.success("Valores capturados do objeto selecionado.");
  };

  const updateValue = (key: keyof DistortValues, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Grid2X2 className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Distorção em Grade</h3>
      </div>

      <div className="text-xs text-muted-foreground">
        {selectionCount === 0
          ? "Nenhum objeto selecionado"
          : `${selectionCount} objeto(s) selecionado(s)`}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t pt-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            SkewX: {values.skewX.toFixed(0)}°
          </label>
          <input
            type="range"
            min={-45}
            max={45}
            step={1}
            value={values.skewX}
            onChange={(e) => updateValue("skewX", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            SkewY: {values.skewY.toFixed(0)}°
          </label>
          <input
            type="range"
            min={-45}
            max={45}
            step={1}
            value={values.skewY}
            onChange={(e) => updateValue("skewY", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            ScaleX: {values.scaleX.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.05}
            value={values.scaleX}
            onChange={(e) => updateValue("scaleX", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            ScaleY: {values.scaleY.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.05}
            value={values.scaleY}
            onChange={(e) => updateValue("scaleY", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            Rotação: {values.angle.toFixed(0)}°
          </label>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={values.angle}
            onChange={(e) => updateValue("angle", Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        <Button onClick={handleApply} size="sm">
          Aplicar Distorção
        </Button>
        <Button onClick={handleSnapshot} variant="outline" size="sm">
          Snapshot atual
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm">
          Resetar
        </Button>
      </div>
    </div>
  );
}
