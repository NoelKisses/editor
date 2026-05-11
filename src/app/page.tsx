import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Layers, Download, Wand2, ImageIcon, PlayCircle, Camera, Smartphone } from "lucide-react";

const FEATURES = [
  {
    icon: <Layers className="w-6 h-6" />,
    title: "Editor Canvas Profissional",
    description: "Arraste, redimensione e posicione elementos com precisão total",
  },
  {
    icon: <Wand2 className="w-6 h-6" />,
    title: "Remoção de Fundo IA",
    description: "Remove o fundo de qualquer imagem automaticamente com um clique",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Análise com Claude AI",
    description: "Receba sugestões inteligentes para melhorar suas thumbnails",
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "Exportação em Alta Qualidade",
    description: "Exporte em PNG, JPG ou WebP com qualidade máxima",
  },
];

const PLATFORMS = [
  { icon: <PlayCircle className="w-5 h-5" />, label: "YouTube 1280×720", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  { icon: <Camera className="w-5 h-5" />, label: "Instagram 1080×1080", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  { icon: <Smartphone className="w-5 h-5" />, label: "Stories 1080×1920", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { icon: <ImageIcon className="w-5 h-5" />, label: "Twitter/X 1200×675", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
];

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 gap-8 flex-1">
        <Badge variant="outline" className="gap-2 px-4 py-1.5 text-sm border-primary/30 text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Claude AI
        </Badge>

        <div className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
            Editor
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Crie thumbnails profissionais para YouTube e redes sociais
          </p>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Templates prontos, editor canvas completo, remoção de fundo com IA e análise inteligente —
            tudo que você precisa para se destacar.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {PLATFORMS.map((p) => (
            <span
              key={p.label}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${p.color}`}
            >
              {p.icon}
              {p.label}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/editor" className={cn(buttonVariants({ size: "lg" }), "text-base px-8 gap-2")}>
            <Sparkles className="w-4 h-4" />
            Abrir Editor
          </Link>
          <Link href="/editor" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "text-base px-8 gap-2")}>
            <ImageIcon className="w-4 h-4" />
            Novo Projeto
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-muted/20 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10 text-foreground">
            Tudo que você precisa em um lugar só
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-5 rounded-xl border border-border bg-card hover:bg-card/80 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-sm text-muted-foreground">
        Editor — Feito com ♥ usando Claude AI
      </footer>
    </main>
  );
}
