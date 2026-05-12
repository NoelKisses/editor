"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { toast } from "sonner";

interface AiTemplateGeneratorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const EXAMPLES = [
  "Canal de gaming com fundo escuro e título em vermelho neon",
  "Receita de bolo de chocolate, cores quentes e apetitosas",
  "Review de smartphone, fundo tecnológico azul escuro",
  "Vlog de viagem no Japão, cores vibrantes e alegres",
  "Tutorial de programação, fundo escuro estilo hacker",
  "Podcast motivacional, gradiente roxo e dourado",
];

export function AiTemplateGenerator({ fabricCanvas }: AiTemplateGeneratorProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const { template } = useEditorStore();

  const applyLayout = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (layout: any) => {
      if (!fabricCanvas || !template) return;
      const { fabric } = await import("fabric");

      // Clear canvas objects
      fabricCanvas.getObjects().forEach((o: unknown) => fabricCanvas.remove(o));

      // Background
      if (layout.backgroundGradient) {
        const g = layout.backgroundGradient;
        const w: number = fabricCanvas.getWidth();
        const h: number = fabricCanvas.getHeight();
        const rad = ((g.angle ?? 135) * Math.PI) / 180;
        const gradient = new fabric.Gradient({
          type: "linear",
          coords: {
            x1: w * (0.5 - 0.5 * Math.cos(rad)),
            y1: h * (0.5 - 0.5 * Math.sin(rad)),
            x2: w * (0.5 + 0.5 * Math.cos(rad)),
            y2: h * (0.5 + 0.5 * Math.sin(rad)),
          },
          colorStops: [
            { offset: 0, color: g.color1 ?? "#000" },
            { offset: 1, color: g.color2 ?? "#333" },
          ],
        });
        fabricCanvas.setBackgroundColor(gradient, () => fabricCanvas.requestRenderAll());
      } else {
        fabricCanvas.setBackgroundColor(
          layout.backgroundColor ?? "#1a1a2e",
          () => fabricCanvas.requestRenderAll()
        );
      }

      // Shapes
      for (const shape of layout.shapes ?? []) {
        let obj;
        if (shape.type === "rect") {
          obj = new fabric.Rect({
            left: shape.x ?? 0,
            top: shape.y ?? 0,
            width: shape.width ?? 200,
            height: shape.height ?? 100,
            fill: shape.fill ?? "#333",
            opacity: shape.opacity ?? 1,
            selectable: true,
            rx: shape.rx ?? 0,
            ry: shape.ry ?? 0,
          });
        } else if (shape.type === "circle") {
          obj = new fabric.Circle({
            left: shape.x ?? 0,
            top: shape.y ?? 0,
            radius: shape.radius ?? 50,
            fill: shape.fill ?? "#333",
            opacity: shape.opacity ?? 1,
          });
        }
        if (obj) fabricCanvas.add(obj);
      }

      // Texts
      for (const textDef of layout.texts ?? []) {
        const shadow = textDef.shadow
          ? new fabric.Shadow({
              color: textDef.shadowColor ?? "rgba(0,0,0,0.5)",
              blur: textDef.shadowBlur ?? 8,
              offsetX: 2,
              offsetY: 2,
            })
          : undefined;

        const text = new fabric.IText(textDef.content ?? "Texto", {
          left: textDef.x ?? 50,
          top: textDef.y ?? 50,
          fontSize: textDef.fontSize ?? 72,
          fontFamily: textDef.fontFamily ?? "Arial",
          fontWeight: textDef.fontWeight ?? "bold",
          fill: textDef.fill ?? "#ffffff",
          textAlign: textDef.textAlign ?? "left",
          shadow: shadow ?? undefined,
          stroke: textDef.strokeColor,
          strokeWidth: textDef.strokeWidth ?? 0,
        });
        fabricCanvas.add(text);
      }

      fabricCanvas.requestRenderAll();
    },
    [fabricCanvas, template]
  );

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      toast.error("Descreva o layout desejado");
      return;
    }
    if (!template) {
      toast.error("Selecione um template primeiro");
      return;
    }
    setLoading(true);
    setStep("Gerando layout com IA...");

    try {
      const res = await fetch("/api/generate-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          width: template.width,
          height: template.height,
          platform: template.category,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.layout) {
        throw new Error(data.error ?? "Erro ao gerar layout");
      }

      setStep("Aplicando layout ao canvas...");
      await applyLayout(data.layout);

      // If layout has imagePrompt, generate background image
      if (data.layout.imagePrompt && typeof data.layout.imagePrompt === "string") {
        setStep("Gerando imagem de fundo...");
        const imgRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: data.layout.imagePrompt,
            width: template.width,
            height: template.height,
          }),
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          if (imgData.image) {
            const { fabric } = await import("fabric");
            fabric.Image.fromURL(imgData.image, (img) => {
              img.set({
                left: 0,
                top: 0,
                scaleX: template.width / (img.width ?? template.width),
                scaleY: template.height / (img.height ?? template.height),
                selectable: true,
                opacity: 0.6,
              });
              fabricCanvas.insertAt(img, 0);
              fabricCanvas.requestRenderAll();
            });
          }
        }
      }

      toast.success("Layout gerado com sucesso!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setLoading(false);
      setStep("");
    }
  }, [description, template, applyLayout, fabricCanvas]);

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-foreground">Gerar com IA</h3>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descreva o layout que você quer criar..."
        rows={3}
        className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground w-full resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <Button
        onClick={handleGenerate}
        disabled={loading || !fabricCanvas || !template}
        className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {step || "Gerando..."}
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Gerar Layout
          </>
        )}
      </Button>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Exemplos</span>
        <div className="flex flex-col gap-1">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setDescription(ex)}
              className="text-left text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent rounded px-2 py-1 transition-colors leading-relaxed"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
