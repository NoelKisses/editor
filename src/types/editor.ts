export type TemplateCategory =
  | "youtube"
  | "instagram"
  | "stories"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "facebook"
  | "pinterest"
  | "presentation"
  | "banner"
  | "custom";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  width: number;
  height: number;
  thumbnail?: string;
  backgroundColor: string;
  /** CSS gradient string for visual preview (optional) */
  previewGradient?: string;
  description: string;
  tags?: string[];
}

export interface CanvasElement {
  id: string;
  type: "image" | "text" | "shape" | "background";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
}

export interface TextElement extends CanvasElement {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  textAlign: "left" | "center" | "right";
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  strokeWidth: number;
  strokeColor: string;
}

export interface ImageElement extends CanvasElement {
  type: "image";
  src: string;
  originalSrc: string;
  filters: ImageFilters;
  hasBgRemoved: boolean;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: boolean;
}

export interface EditorState {
  template: Template | null;
  elements: CanvasElement[];
  selectedElementId: string | null;
  history: CanvasElement[][];
  historyIndex: number;
  zoom: number;
  isAnalyzing: boolean;
  aiSuggestions: string[];
  snapToGrid: boolean;
}

export interface ExportOptions {
  format: "png" | "jpg" | "webp";
  quality: number;
  scale: number;
}
