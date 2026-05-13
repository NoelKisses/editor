"use client";

import { useState } from "react";
import { Keyboard, Search } from "lucide-react";

interface ShortcutEntry {
  category: string;
  label: string;
  keys: string[];
}

const SHORTCUTS: ShortcutEntry[] = [
  // Arquivo
  { category: "Arquivo", label: "Salvar projeto", keys: ["⌘", "S"] },
  { category: "Arquivo", label: "Exportar PNG", keys: ["⌘", "Shift", "E"] },
  { category: "Arquivo", label: "Novo projeto", keys: ["⌘", "N"] },

  // Edição
  { category: "Edição", label: "Desfazer", keys: ["⌘", "Z"] },
  { category: "Edição", label: "Refazer", keys: ["⌘", "Shift", "Z"] },
  { category: "Edição", label: "Copiar", keys: ["⌘", "C"] },
  { category: "Edição", label: "Recortar", keys: ["⌘", "X"] },
  { category: "Edição", label: "Colar", keys: ["⌘", "V"] },
  { category: "Edição", label: "Duplicar", keys: ["⌘", "D"] },
  { category: "Edição", label: "Excluir objeto", keys: ["Del"] },
  { category: "Edição", label: "Selecionar tudo", keys: ["⌘", "A"] },
  { category: "Edição", label: "Desselecionar", keys: ["Esc"] },

  // Zoom
  { category: "Zoom", label: "Aumentar zoom", keys: ["⌘", "+"] },
  { category: "Zoom", label: "Diminuir zoom", keys: ["⌘", "-"] },
  { category: "Zoom", label: "Zoom 100%", keys: ["⌘", "0"] },
  { category: "Zoom", label: "Ajustar à tela", keys: ["⌘", "Shift", "F"] },
  { category: "Zoom", label: "Zoom no cursor", keys: ["Scroll"] },

  // Objetos
  { category: "Objetos", label: "Mover (1px)", keys: ["↑↓←→"] },
  { category: "Objetos", label: "Mover (10px)", keys: ["Shift", "↑↓←→"] },
  { category: "Objetos", label: "Trazer à frente", keys: ["⌘", "]"] },
  { category: "Objetos", label: "Enviar para trás", keys: ["⌘", "["] },
  { category: "Objetos", label: "Trazer para frente", keys: ["⌘", "Shift", "]"] },
  { category: "Objetos", label: "Enviar ao fundo", keys: ["⌘", "Shift", "["] },
  { category: "Objetos", label: "Agrupar", keys: ["⌘", "G"] },
  { category: "Objetos", label: "Desagrupar", keys: ["⌘", "Shift", "G"] },

  // Texto
  { category: "Texto", label: "Negrito", keys: ["⌘", "B"] },
  { category: "Texto", label: "Itálico", keys: ["⌘", "I"] },
  { category: "Texto", label: "Sublinhado", keys: ["⌘", "U"] },
  { category: "Texto", label: "Alinhar à esquerda", keys: ["⌘", "Shift", "L"] },
  { category: "Texto", label: "Centralizar", keys: ["⌘", "Shift", "E"] },
  { category: "Texto", label: "Alinhar à direita", keys: ["⌘", "Shift", "R"] },

  // Interface
  { category: "Interface", label: "Atalhos de teclado", keys: ["?"] },
  { category: "Interface", label: "Modo foco", keys: ["F"] },
  { category: "Interface", label: "Réguas", keys: ["⌘", "R"] },
  { category: "Interface", label: "Grade", keys: ["⌘", "'"] },
];

const CATEGORIES = Array.from(new Set(SHORTCUTS.map(s => s.category)));

function KeyBadge({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[8px] font-mono bg-muted border border-border rounded text-muted-foreground leading-none">
      {k}
    </kbd>
  );
}

export function KeyboardShortcutsPanel() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = SHORTCUTS.filter(s => {
    const matchSearch = !search || s.label.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  const grouped = CATEGORIES.reduce<Record<string, ShortcutEntry[]>>((acc, cat) => {
    const items = filtered.filter(s => s.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Keyboard className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Atalhos de Teclado</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Buscar atalho..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-7 pr-2 py-1.5 bg-muted/50 border border-border rounded text-[10px] focus:outline-none focus:border-primary"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-2 py-0.5 rounded text-[8px] transition-colors border ${!activeCategory ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
        >
          Todos
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-2 py-0.5 rounded text-[8px] transition-colors border ${activeCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shortcuts list */}
      <div className="flex flex-col gap-3">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">{cat}</span>
            {items.map(item => (
              <div key={item.label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                <span className="text-[10px] text-foreground/80">{item.label}</span>
                <div className="flex items-center gap-0.5">
                  {item.keys.map((k, i) => (
                    <span key={i} className="flex items-center gap-0.5">
                      <KeyBadge k={k} />
                      {i < item.keys.length - 1 && <span className="text-[7px] text-muted-foreground/40 mx-0.5">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum atalho encontrado</p>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Pressione <KeyBadge k="?" /> a qualquer momento para ver este painel
      </p>
    </div>
  );
}
