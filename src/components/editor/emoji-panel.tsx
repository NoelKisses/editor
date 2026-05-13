"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Smile } from "lucide-react";
import { toast } from "sonner";

interface EmojiPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const EMOJI_CATEGORIES = [
  {
    name: "Populares",
    icon: "⭐",
    emojis: ["😀","😂","🥰","😎","🤩","🎉","🔥","💯","✨","🎊","👏","💪","🚀","💡","❤️","🎯","⚡","🌟","💎","🏆","🎨","📸","🎬","📱","💻","🎮","🎵","🎤","📺","🎁"],
  },
  {
    name: "Expressões",
    icon: "😀",
    emojis: ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","😗","🙂","🤗","🤩","🥳","😐","😑","😶","🙄","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤫","🤭","🧐","🤓","😈","👿","💀","💩","🤡","👹","👺","👻","👽","🤖"],
  },
  {
    name: "Gestos",
    icon: "👋",
    emojis: ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","🤝","🙏","✍️","💪","🦾","🖕","💅","🫱","🫲","🫳","🫴"],
  },
  {
    name: "Objetos",
    icon: "💎",
    emojis: ["💎","🔥","⚡","💥","✨","🌟","⭐","🌈","🎯","🎊","🎉","🎈","🎁","🏆","🥇","🥈","🥉","🎖️","🏅","🎗️","🎀","🎪","🎭","🎨","🖼️","🎬","🎤","🎧","🎵","🎶","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎲","🎮","🕹️","🎰","🧩","🪄","🃏","🎴","🀄","🎭"],
  },
  {
    name: "Natureza",
    icon: "🌿",
    emojis: ["🌿","🌱","🌾","🍀","🌳","🌲","🌴","🌵","🎋","🎍","🍁","🍂","🍃","🌺","🌸","🌼","🌻","🌹","🥀","🌷","🌾","🍄","🌰","🎄","🌊","🌙","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌪️","🌫️","🌈","❄️","☃️","⛄","🔥","💧","🌊"],
  },
  {
    name: "Comida",
    icon: "🍕",
    emojis: ["🍕","🍔","🌮","🌯","🥗","🍜","🍣","🍱","🥘","🍛","🍲","🥧","🧁","🎂","🍰","🍩","🍪","🍫","🍬","🍭","🍦","🍨","🍧","🥤","🧃","☕","🍵","🧋","🍺","🍻","🥂","🍷","🥃","🍸","🍹"],
  },
  {
    name: "Símbolos",
    icon: "❤️",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☯️","🕉️","☦️","🔯","🪯","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⛎","🔀","🔁","🔂","▶️","⏩","⏪","⏫","⏬","🆕","🆙","🆒","🆓","🆖","🅰️","🅱️","🆎","🆑","🅾️","🆘","⛔","🚫","🔞","📵","🚳","🚭","🚯","🚱","🚷","📶","🈳","🈹"],
  },
  {
    name: "Viagem",
    icon: "✈️",
    emojis: ["✈️","🚀","🛸","🚁","🛺","🚗","🚕","🚙","🚌","🚎","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚋","🚍","🚐","🚑","🚒","🚓","🏎️","🚖","🚘","🚍","🛵","🏍️","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","⛽","🚦","🚥","🛞","⚓","🪝","🗺️","🌐","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏗️","🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭"],
  },
];

const FONT_SIZE_OPTIONS = [48, 64, 80, 96, 128, 160];

export function EmojiPanel({ fabricCanvas }: EmojiPanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [fontSize, setFontSize] = useState(80);

  const filteredEmojis = useMemo(() => {
    if (!search) return EMOJI_CATEGORIES[activeCategory]?.emojis ?? [];
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return all.filter((e) => e.includes(search));
  }, [search, activeCategory]);

  const addEmoji = useCallback(async (emoji: string) => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    const text = new fabric.IText(emoji, {
      left: 80,
      top: 80,
      fontSize,
      selectable: true,
      fontFamily: "Arial",
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.requestRenderAll();
    toast.success(`Emoji adicionado ao canvas`);
  }, [fabricCanvas, fontSize]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Smile className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Emojis</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar emoji..."
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-background border border-border rounded outline-none focus:border-primary/50 text-foreground"
        />
      </div>

      {/* Font size */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Tamanho:</span>
        <div className="flex gap-1">
          {FONT_SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${fontSize === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`flex-shrink-0 text-base px-2 py-1 rounded transition-colors ${activeCategory === i ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent/30"}`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="grid grid-cols-6 gap-1">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => addEmoji(emoji)}
            className="text-2xl p-1.5 rounded hover:bg-accent/40 transition-colors flex items-center justify-center"
            title={`Adicionar ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        {filteredEmojis.length === 0 && (
          <p className="col-span-6 text-[10px] text-muted-foreground text-center py-4">
            Nenhum emoji encontrado
          </p>
        )}
      </div>
    </div>
  );
}
