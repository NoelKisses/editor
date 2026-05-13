"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { Template } from "@/types/editor";
import { CheckCircle2, Search } from "lucide-react";

export function TemplatePicker() {
  const [activeCategory, setActiveCategory] = useState("youtube");
  const [search, setSearch] = useState("");
  const { template: selectedTemplate, setTemplate } = useEditorStore();

  const filtered = useMemo(() => {
    const inCategory = TEMPLATES.filter((t) => t.category === activeCategory);
    if (!search.trim()) return inCategory;
    const q = search.toLowerCase();
    return inCategory.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [activeCategory, search]);

  const handleSelect = (t: Template) => {
    setTemplate(t);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search */}
      <div className="flex items-center gap-1.5 bg-background border border-border rounded px-2 py-1 sticky top-0 z-10">
        <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar template..."
          className="text-xs bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        )}
      </div>

      {/* Category tabs */}
      <div>
        <div className="flex flex-wrap gap-1">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-6 px-2 gap-0.5"
              onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-[10px] text-muted-foreground">
        {filtered.length} template{filtered.length !== 1 ? "s" : ""}
        {search && ` para "${search}"`}
      </div>

      {/* Template list */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pb-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Nenhum template encontrado
          </div>
        ) : (
          filtered.map((t) => {
            const isSelected = selectedTemplate?.id === t.id;
            const aspectRatio = t.width / t.height;
            const previewW = 72;
            const previewH = Math.max(28, Math.min(54, Math.round(previewW / aspectRatio)));

            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left w-full group ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                {/* Visual preview with gradient */}
                <div
                  className="flex-shrink-0 rounded border border-white/10 flex items-center justify-center overflow-hidden relative"
                  style={{
                    width: previewW,
                    height: previewH,
                    background: t.previewGradient ?? t.backgroundColor,
                  }}
                >
                  <span className="text-white/40 text-[7px] font-mono absolute bottom-0.5 right-1">
                    {t.width}×{t.height}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-foreground truncate">{t.name}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{t.description}</p>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    <span className="text-[9px] font-mono bg-muted/60 rounded px-1 py-0.5 text-muted-foreground">
                      {t.width}×{t.height}
                    </span>
                    {t.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[9px] bg-muted/40 rounded px-1 py-0.5 text-muted-foreground/70">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
