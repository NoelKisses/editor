"use client";

import { useEditorStore } from "@/store/editor-store";
import { Sparkles, Loader2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AiSuggestionsPanel() {
  const { aiSuggestions, isAnalyzing } = useEditorStore();

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-center">Claude está analisando sua thumbnail...</p>
      </div>
    );
  }

  if (aiSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
        <Sparkles className="w-6 h-6 opacity-40" />
        <p className="text-sm text-center opacity-60">
          Clique em &quot;Analisar com IA&quot; para receber sugestões personalizadas
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Sugestões do Claude</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {aiSuggestions.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2">
        {aiSuggestions.map((suggestion, i) => (
          <div
            key={i}
            className="flex gap-2.5 p-3 rounded-lg border border-border bg-card/50"
          >
            <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
