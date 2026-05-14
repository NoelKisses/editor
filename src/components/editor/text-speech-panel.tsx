"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Radio, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextSpeechPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface VoiceOption {
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
}

export function TextSpeechPanel({ fabricCanvas, selectionVersion }: TextSpeechPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [previewText, setPreviewText] = useState("");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      const svs = window.speechSynthesis.getVoices();
      const opts: VoiceOption[] = svs.map(v => ({ name: v.name, lang: v.lang, voice: v }));
      setVoices(opts);
      const ptVoice = opts.find(v => v.lang.startsWith("pt"));
      if (ptVoice) setSelectedVoice(ptVoice.name);
      else if (opts.length > 0) setSelectedVoice(opts[0].name);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [supported]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = !!obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text");
      setHasText(isText);
      if (isText) setPreviewText(obj.text ?? "");
    });
  }, [fabricCanvas, selectionVersion]);

  const getTextContent = useCallback(() => {
    if (!fabricCanvas) return "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text") ? (obj.text ?? "") : "";
  }, [fabricCanvas]);

  const speak = useCallback(() => {
    if (!supported) { toast.error("Web Speech API não suportada neste navegador"); return; }

    const text = previewText || getTextContent();
    if (!text.trim()) { toast.error("Nenhum texto para falar"); return; }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const voiceObj = voices.find(v => v.name === selectedVoice);
    if (voiceObj) utterance.voice = voiceObj.voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => { setIsSpeaking(false); toast.error("Erro na leitura"); };

    utterRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    toast.success("Lendo texto em voz alta");
  }, [supported, previewText, getTextContent, rate, pitch, volume, selectedVoice, voices]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  const ptVoices = voices.filter(v => v.lang.startsWith("pt"));
  const enVoices = voices.filter(v => v.lang.startsWith("en"));
  const otherVoices = voices.filter(v => !v.lang.startsWith("pt") && !v.lang.startsWith("en"));

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Texto para Fala</span>
      </div>

      {!supported ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Radio className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Web Speech API não disponível</p>
        </div>
      ) : (
        <>
          {!hasText && (
            <div className="px-2 py-1.5 rounded border border-amber-500/30 bg-amber-500/10">
              <p className="text-[9px] text-amber-500">Nenhum texto selecionado — edite o campo abaixo</p>
            </div>
          )}

          {/* Text preview */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Texto a ser lido</span>
            <textarea value={previewText} onChange={e => setPreviewText(e.target.value)}
              rows={3}
              placeholder="Digite ou selecione um texto no canvas..."
              className="bg-muted/50 border border-border rounded px-2 py-1.5 text-[9px] focus:outline-none focus:border-primary resize-none" />
          </div>

          {/* Voice selector */}
          {voices.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground">Voz</span>
              <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}
                className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary">
                {ptVoices.length > 0 && (
                  <optgroup label="Português">
                    {ptVoices.map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </optgroup>
                )}
                {enVoices.length > 0 && (
                  <optgroup label="Inglês">
                    {enVoices.map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </optgroup>
                )}
                {otherVoices.length > 0 && (
                  <optgroup label="Outros">
                    {otherVoices.slice(0, 10).map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* Rate */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Velocidade</span>
              <span className="text-[9px] tabular-nums">{rate}x</span>
            </div>
            <input type="range" min={0.5} max={2} step={0.1} value={rate}
              onChange={e => setRate(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Pitch */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tom</span>
              <span className="text-[9px] tabular-nums">{pitch}</span>
            </div>
            <input type="range" min={0.5} max={2} step={0.1} value={pitch}
              onChange={e => setPitch(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Volume</span>
              <span className="text-[9px] tabular-nums">{Math.round(volume * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.1} value={volume}
              onChange={e => setVolume(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => { setRate(1); setPitch(1); setVolume(1); }}
              className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <button onClick={isSpeaking ? stop : speak}
              className={`flex items-center justify-center gap-1 py-2 rounded border text-[9px] font-medium transition-colors ${isSpeaking ? "border-destructive text-destructive hover:bg-destructive/10" : "border-primary text-primary hover:bg-primary/10"}`}>
              {isSpeaking ? <><Square className="w-3 h-3" /> Parar</> : <><Play className="w-3 h-3" /> Falar</>}
            </button>
          </div>

          {isSpeaking && (
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1 bg-primary rounded-full animate-pulse"
                    style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-[8px] text-primary">Lendo...</span>
            </div>
          )}

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Usa a Web Speech API do navegador
          </p>
        </>
      )}
    </div>
  );
}
