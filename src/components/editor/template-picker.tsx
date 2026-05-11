"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/store/editor-store";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { Template } from "@/types/editor";
import { CheckCircle2 } from "lucide-react";

export function TemplatePicker() {
  const [activeCategory, setActiveCategory] = useState("youtube");
  const { template: selectedTemplate, setTemplate } = useEditorStore();

  const filtered = TEMPLATES.filter((t) => t.category === activeCategory);

  const handleSelect = (t: Template) => {
    setTemplate(t);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Plataforma</h3>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 px-2.5"
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        <h3 className="text-sm font-semibold text-foreground">Templates</h3>
        {filtered.map((t) => {
          const isSelected = selectedTemplate?.id === t.id;
          const aspectRatio = t.width / t.height;
          const previewW = 120;
          const previewH = Math.round(previewW / aspectRatio);

          return (
            <button
              key={t.id}
              onClick={() => handleSelect(t)}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left w-full group ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              {/* Preview */}
              <div
                className="flex-shrink-0 rounded border border-border/50 flex items-center justify-center overflow-hidden"
                style={{
                  width: Math.min(previewW, 80),
                  height: Math.min(previewH, 60),
                  backgroundColor: t.backgroundColor,
                }}
              >
                <span className="text-white/30 text-[8px] font-mono">
                  {t.width}×{t.height}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-medium text-foreground truncate">{t.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1.5 font-mono">
                  {t.width}×{t.height}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
