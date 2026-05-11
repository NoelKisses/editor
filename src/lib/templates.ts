import { Template } from "@/types/editor";

export const TEMPLATES: Template[] = [
  // YouTube
  {
    id: "yt-standard",
    name: "YouTube Padrão",
    category: "youtube",
    width: 1280,
    height: 720,
    backgroundColor: "#1a1a2e",
    description: "Formato padrão 16:9 para thumbnails do YouTube",
  },
  {
    id: "yt-gaming",
    name: "YouTube Gaming",
    category: "youtube",
    width: 1280,
    height: 720,
    backgroundColor: "#0d0d0d",
    description: "Estilo escuro e dinâmico para canais de games",
  },
  {
    id: "yt-vlog",
    name: "YouTube Vlog",
    category: "youtube",
    width: 1280,
    height: 720,
    backgroundColor: "#f8f9fa",
    description: "Layout clean e vibrante para vlogs",
  },
  // Instagram
  {
    id: "ig-square",
    name: "Instagram Quadrado",
    category: "instagram",
    width: 1080,
    height: 1080,
    backgroundColor: "#ffffff",
    description: "Formato quadrado clássico 1:1",
  },
  {
    id: "ig-portrait",
    name: "Instagram Retrato",
    category: "instagram",
    width: 1080,
    height: 1350,
    backgroundColor: "#f0f0f0",
    description: "Formato retrato 4:5 para maior alcance",
  },
  // Stories
  {
    id: "stories-instagram",
    name: "Instagram Stories",
    category: "stories",
    width: 1080,
    height: 1920,
    backgroundColor: "#1a1a2e",
    description: "Stories do Instagram / TikTok / Reels 9:16",
  },
  // Twitter/X
  {
    id: "twitter-card",
    name: "Twitter/X Card",
    category: "twitter",
    width: 1200,
    height: 675,
    backgroundColor: "#15202b",
    description: "Imagem para posts no Twitter/X",
  },
  // Custom
  {
    id: "custom",
    name: "Personalizado",
    category: "custom",
    width: 1920,
    height: 1080,
    backgroundColor: "#ffffff",
    description: "Dimensões personalizadas",
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "youtube", label: "YouTube", icon: "📺" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "stories", label: "Stories / Reels", icon: "📱" },
  { id: "twitter", label: "Twitter/X", icon: "🐦" },
  { id: "custom", label: "Personalizado", icon: "✏️" },
] as const;

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
