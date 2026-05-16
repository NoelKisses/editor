"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { CanvasContextMenu } from "@/components/canvas/canvas-context-menu";
import { TemplatePicker } from "@/components/editor/template-picker";
import { AiSuggestionsPanel } from "@/components/editor/ai-suggestions-panel";
import { AiTemplateGenerator } from "@/components/editor/ai-template-generator";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { LayersPanel } from "@/components/editor/layers-panel";
import { ShapesPanel } from "@/components/editor/shapes-panel";
import { ElementsPanel } from "@/components/editor/elements-panel";
import { BackgroundPanel } from "@/components/editor/background-panel";
import { AlignTools } from "@/components/editor/align-tools";
import { TextEffectsPanel } from "@/components/editor/text-effects-panel";
import { HistoryPanel } from "@/components/editor/history-panel";
import { ProjectsPanel } from "@/components/editor/projects-panel";
import { ImageFiltersPanel } from "@/components/editor/image-filters-panel";
import { GradientPanel } from "@/components/editor/gradient-panel";
import { FramesPanel } from "@/components/editor/frames-panel";
import { IconsPanel } from "@/components/editor/icons-panel";
import { ColorPalettePanel } from "@/components/editor/color-palette-panel";
import { EffectsPanel } from "@/components/editor/effects-panel";
import { DrawPanel } from "@/components/editor/draw-panel";
import { PageStrip } from "@/components/editor/page-strip";
import { StockPhotosPanel } from "@/components/editor/stock-photos-panel";
import { KeyboardShortcutsModal } from "@/components/editor/keyboard-shortcuts-modal";
import { ClipMaskPanel } from "@/components/editor/clip-mask-panel";
import { ColorReplacePanel } from "@/components/editor/color-replace-panel";
import { QRCodePanel } from "@/components/editor/qrcode-panel";
import { CustomFontPanel } from "@/components/editor/custom-font-panel";
import { PresentationMode } from "@/components/editor/presentation-mode";
import { ResizeCanvasDialog } from "@/components/editor/resize-canvas-dialog";
import { OpacityBlendPanel } from "@/components/editor/opacity-blend-panel";
import { CurvedTextPanel } from "@/components/editor/curved-text-panel";
import { ColorPickerEyedropper } from "@/components/editor/color-picker-eyedropper";
import { TextTemplatesPanel } from "@/components/editor/text-templates-panel";
import { ImageCropPanel } from "@/components/editor/image-crop-panel";
import { MyImagesPanel } from "@/components/editor/my-images-panel";
import { CanvasStatusBar } from "@/components/editor/canvas-status-bar";
import { CanvasWithRulers } from "@/components/canvas/canvas-with-rulers";
import { GoogleFontsPanel } from "@/components/editor/google-fonts-panel";
import { BrandKitPanel } from "@/components/editor/brand-kit-panel";
import { TextStylesPanel } from "@/components/editor/text-styles-panel";
import { CanvasNotesPanel } from "@/components/editor/canvas-notes-panel";
import { EmojiPanel } from "@/components/editor/emoji-panel";
import { TypographyPanel } from "@/components/editor/typography-panel";
import { ShadowPanel } from "@/components/editor/shadow-panel";
import { BorderPanel } from "@/components/editor/border-panel";
import { FloatingToolbar } from "@/components/canvas/floating-toolbar";
import { PositionSizePanel } from "@/components/editor/position-size-panel";
import { TextFormatBar } from "@/components/editor/text-format-bar";
import { AnimationsPanel } from "@/components/editor/animations-panel";
import { GridSettingsPanel } from "@/components/editor/grid-settings-panel";
import { TablePanel } from "@/components/editor/table-panel";
import { MultiSelectPanel } from "@/components/editor/multi-select-panel";
import { AdvancedExportPanel } from "@/components/editor/advanced-export-panel";
import { VectorElementsPanel } from "@/components/editor/vector-elements-panel";
import { SmartResizePanel } from "@/components/editor/smart-resize-panel";
import { SmartGuidesPanel } from "@/components/editor/smart-guides-panel";
import { TextOnPathPanel } from "@/components/editor/text-on-path-panel";
import { PatternsPanel } from "@/components/editor/patterns-panel";
import { QuickStylesPanel } from "@/components/editor/quick-styles-panel";
import { PhotoFramesPanel } from "@/components/editor/photo-frames-panel";
import { TextEffectsAdvancedPanel } from "@/components/editor/text-effects-advanced-panel";
import { ImageAdjustmentsPanel } from "@/components/editor/image-adjustments-panel";
import { ObjectLockPanel } from "@/components/editor/object-lock-panel";
import { TextSpacingPanel } from "@/components/editor/text-spacing-panel";
import { DropShadowAdvancedPanel } from "@/components/editor/drop-shadow-advanced-panel";
import { ColorHarmonyPanel } from "@/components/editor/color-harmony-panel";
import { TransformPanel } from "@/components/editor/transform-panel";
import { StrokeOutlinePanel } from "@/components/editor/stroke-outline-panel";
import { ObjectDuplicatorPanel } from "@/components/editor/object-duplicator-panel";
import { PreciseCoordsPanel } from "@/components/editor/precise-coords-panel";
import { AutosaveProjectPanel } from "@/components/editor/autosave-project-panel";
import { ImageColorExtractorPanel } from "@/components/editor/image-color-extractor-panel";
import { SmartMeasurementPanel } from "@/components/editor/smart-measurement-panel";
import { FavoritesPanel } from "@/components/editor/favorites-panel";
import { VisualHistoryPanel } from "@/components/editor/visual-history-panel";
import { ElementSearchPanel } from "@/components/editor/element-search-panel";
import { QuickActionsPanel } from "@/components/editor/quick-actions-panel";
import { AutoDistributePanel } from "@/components/editor/auto-distribute-panel";
import { ObjectBlendPanel } from "@/components/editor/object-blend-panel";
import { MarginBleedPanel } from "@/components/editor/margin-bleed-panel";
import { PatternTilePanel } from "@/components/editor/pattern-tile-panel";
import { DesignStatsPanel } from "@/components/editor/design-stats-panel";
import { ImageCropAdvancedPanel } from "@/components/editor/image-crop-advanced-panel";
import { CanvasBackgroundAdvancedPanel } from "@/components/editor/canvas-background-advanced-panel";
import { ObjectPropertiesInspectorPanel } from "@/components/editor/object-properties-inspector-panel";
import { TextShadowPanel } from "@/components/editor/text-shadow-panel";
import { ColorGradientTextPanel } from "@/components/editor/color-gradient-text-panel";
import { CanvasRulerGuidePanel } from "@/components/editor/canvas-ruler-guide-panel";
import { ObjectVisibilityPanel } from "@/components/editor/object-visibility-panel";
import { CanvasExportSettingsPanel } from "@/components/editor/canvas-export-settings-panel";
import { SmartAlignDistributePanel } from "@/components/editor/smart-align-distribute-panel";
import { TextOutlinePanel } from "@/components/editor/text-outline-panel";
import { CanvasGridOverlayPanel } from "@/components/editor/canvas-grid-overlay-panel";
import { ObjectRenamePanel } from "@/components/editor/object-rename-panel";
import { ClipboardPanel } from "@/components/editor/clipboard-panel";
import { SnapSettingsPanel } from "@/components/editor/snap-settings-panel";
import { ZoomControlsPanel } from "@/components/editor/zoom-controls-panel";
import { AspectRatioLockPanel } from "@/components/editor/aspect-ratio-lock-panel";
import { KeyboardShortcutsPanel } from "@/components/editor/keyboard-shortcuts-panel";
import { ContextualToolbarPanel } from "@/components/editor/contextual-toolbar-panel";
import { ObjectGroupPanel } from "@/components/editor/object-group-panel";
import { TextBackgroundPanel } from "@/components/editor/text-background-panel";
import { ImagePlaceholderPanel } from "@/components/editor/image-placeholder-panel";
import { CropInteractivePanel } from "@/components/editor/crop-interactive-panel";
import { TextLetterSpacingPanel } from "@/components/editor/text-letter-spacing-panel";
import { ObjectTransparencyPanel } from "@/components/editor/object-transparency-panel";
import { ShapeLibraryPanel } from "@/components/editor/shape-library-panel";
import { TextPathEffectPanel } from "@/components/editor/text-path-effect-panel";
import { CanvasExportPreviewPanel } from "@/components/editor/canvas-export-preview-panel";
import { ObjectFlipMirrorPanel } from "@/components/editor/object-flip-mirror-panel";
import { TextParagraphPanel } from "@/components/editor/text-paragraph-panel";
import { CanvasTemplateSizePanel } from "@/components/editor/canvas-template-size-panel";
import { ObjectShadowPresetPanel } from "@/components/editor/object-shadow-preset-panel";
import { ColorMixerPanel } from "@/components/editor/color-mixer-panel";
import { TextCaseTransformPanel } from "@/components/editor/text-case-transform-panel";
import { CanvasWatermarkPanel } from "@/components/editor/canvas-watermark-panel";
import { ObjectCornerRadiusPanel } from "@/components/editor/object-corner-radius-panel";
import { ImageBgColorRemovePanel } from "@/components/editor/image-bg-color-remove-panel";
import { ImageFilterPanel } from "@/components/editor/image-filter-panel";
import { ObjectAlignDistributePanel } from "@/components/editor/object-align-distribute-panel";
import { CanvasGridSnapPanel } from "@/components/editor/canvas-grid-snap-panel";
import { ObjectGradientPanel } from "@/components/editor/object-gradient-panel";
import { CanvasLayerExportPanel } from "@/components/editor/canvas-layer-export-panel";
import { CanvasHistoryPanel } from "@/components/editor/canvas-history-panel";
import { TextArcPanel } from "@/components/editor/text-arc-panel";
import { CanvasPatternPanel } from "@/components/editor/canvas-pattern-panel";
import { CanvasGuidesPanel } from "@/components/editor/canvas-guides-panel";
import { ObjectPositionAnimationPanel } from "@/components/editor/object-position-animation-panel";
import { CanvasRulerSettingsPanel } from "@/components/editor/canvas-ruler-settings-panel";
import { TextHighlightPanel } from "@/components/editor/text-highlight-panel";
import { ObjectMosaicPanel } from "@/components/editor/object-mosaic-panel";
import { CanvasPrintSafePanel } from "@/components/editor/canvas-print-safe-panel";
import { TextAutofitPanel } from "@/components/editor/text-autofit-panel";
import { ObjectNeonGlowPanel } from "@/components/editor/object-neon-glow-panel";
import { CanvasCollaborationPanel } from "@/components/editor/canvas-collaboration-panel";
import { ImageSaturationPanel } from "@/components/editor/image-saturation-panel";
import { ObjectReflectionPanel } from "@/components/editor/object-reflection-panel";
import { CanvasExportBatchPanel } from "@/components/editor/canvas-export-batch-panel";
import { TextCounterPanel } from "@/components/editor/text-counter-panel";
import { ObjectStrokePanel } from "@/components/editor/object-stroke-panel";
import { ProjectColorPalettePanel } from "@/components/editor/project-color-palette-panel";
import { ObjectClipMaskPanel } from "@/components/editor/object-clip-mask-panel";
import { ObjectGlitchEffectPanel } from "@/components/editor/object-glitch-effect-panel";
import { CanvasSnapshotPanel } from "@/components/editor/canvas-snapshot-panel";
import { TextVariablePanel } from "@/components/editor/text-variable-panel";
import { TextAnimationPanel } from "@/components/editor/text-animation-panel";
import { ObjectPatternFillPanel } from "@/components/editor/object-pattern-fill-panel";
import { CanvasMultiPagePanel } from "@/components/editor/canvas-multi-page-panel";
import { ImageDuotonePanel } from "@/components/editor/image-duotone-panel";
import { ObjectBorderAnimPanel } from "@/components/editor/object-border-anim-panel";
import { CanvasMarkerPanel } from "@/components/editor/canvas-marker-panel";
import { TextSpeechPanel } from "@/components/editor/text-speech-panel";
import { ObjectMagnetPanel } from "@/components/editor/object-magnet-panel";
import { CanvasFocusModePanel } from "@/components/editor/canvas-focus-mode-panel";
import { CanvasTimerPanel } from "@/components/editor/canvas-timer-panel";
import { ObjectLinkPanel } from "@/components/editor/object-link-panel";
import { CanvasColorThemePanel } from "@/components/editor/canvas-color-theme-panel";
import { ImageVignettePanel } from "@/components/editor/image-vignette-panel";
import { CanvasPresentationTimerPanel } from "@/components/editor/canvas-presentation-timer-panel";
import { ObjectOutlineGlowPanel } from "@/components/editor/object-outline-glow-panel";
import { CanvasPixelArtPanel } from "@/components/editor/canvas-pixel-art-panel";
import { ObjectTextOnShapePanel } from "@/components/editor/object-text-on-shape-panel";
import { ImageHalftonePanel } from "@/components/editor/image-halftone-panel";
import { ImageCropResizePanel } from "@/components/editor/image-crop-resize-panel";
import { CanvasClipboardPanel } from "@/components/editor/canvas-clipboard-panel";
import { ObjectTransformOriginPanel } from "@/components/editor/object-transform-origin-panel";
import { ImageContrastBrightnessPanel } from "@/components/editor/image-contrast-brightness-panel";
import { CanvasLassoSelectPanel } from "@/components/editor/canvas-lasso-select-panel";
import { ObjectFeatherPanel } from "@/components/editor/object-feather-panel";
import { CanvasPaintBucketPanel } from "@/components/editor/canvas-paint-bucket-panel";
import { TextFormattingPanel } from "@/components/editor/text-formatting-panel";
import { ImageSprayEffectPanel } from "@/components/editor/image-spray-effect-panel";
import { CanvasObjectHierarchyPanel } from "@/components/editor/canvas-object-hierarchy-panel";
import { CanvasRulerGuideAdvancedPanel } from "@/components/editor/canvas-ruler-guide-advanced-panel";
import { ImageColorGradingPanel } from "@/components/editor/image-color-grading-panel";
import { CanvasInsertQuickPanel } from "@/components/editor/canvas-insert-quick-panel";
import { ImagePerspectivePanel } from "@/components/editor/image-perspective-panel";
import { TextGlowEffectPanel } from "@/components/editor/text-glow-effect-panel";
import { ObjectStyleCopyPanel } from "@/components/editor/object-style-copy-panel";
import { CanvasDragDropUploadPanel } from "@/components/editor/canvas-drag-drop-upload-panel";
import { ObjectAspectRatioPanel } from "@/components/editor/object-aspect-ratio-panel";
import { CanvasMockupPanel } from "@/components/editor/canvas-mockup-panel";
import { TextTypewriterPanel } from "@/components/editor/text-typewriter-panel";
import { CanvasSmartFitPanel } from "@/components/editor/canvas-smart-fit-panel";
import { CanvasThumbnailTemplatesPanel } from "@/components/editor/canvas-thumbnail-templates-panel";
import { CanvasBackgroundGeneratorPanel } from "@/components/editor/canvas-background-generator-panel";
import { ObjectMultiShadowPanel } from "@/components/editor/object-multi-shadow-panel";
import { CanvasFrameBorderPanel } from "@/components/editor/canvas-frame-border-panel";
import { TextGradientOutlinePanel } from "@/components/editor/text-gradient-outline-panel";
import { CanvasElementRepeaterPanel } from "@/components/editor/canvas-element-repeater-panel";
import { CanvasColorPaletteExtractorPanel } from "@/components/editor/canvas-color-palette-extractor-panel";
import { TextNeonEffectPanel } from "@/components/editor/text-neon-effect-panel";
import { ObjectSnapGridPanel } from "@/components/editor/object-snap-grid-panel";
import { CanvasTextOnImagePanel } from "@/components/editor/canvas-text-on-image-panel";
import { ObjectSkewPanel } from "@/components/editor/object-skew-panel";
import { CanvasExportSocialPanel } from "@/components/editor/canvas-export-social-panel";
import { CanvasCountdownTimerPanel } from "@/components/editor/canvas-countdown-timer-panel";
import { ObjectParticleEffectPanel } from "@/components/editor/object-particle-effect-panel";
import { TextShadow3dPanel } from "@/components/editor/text-shadow-3d-panel";
import { CanvasSpeechBubblePanel } from "@/components/editor/canvas-speech-bubble-panel";
import { ImageNoiseTexturePanel } from "@/components/editor/image-noise-texture-panel";
import { ObjectHighlightGlowPanel } from "@/components/editor/object-highlight-glow-panel";
import CanvasPerspectiveTransformPanel from "@/components/editor/canvas-perspective-transform-panel";
import { CanvasTextMaskPanel } from "@/components/editor/canvas-text-mask-panel";
import { ObjectReflectionAdvancedPanel } from "@/components/editor/object-reflection-advanced-panel";
import { CanvasMockupScenePanel } from "@/components/editor/canvas-mockup-scene-panel";
import { TextKineticAnimationPanel } from "@/components/editor/text-kinetic-animation-panel";
import { CanvasSmartCropPanel } from "@/components/editor/canvas-smart-crop-panel";
import { CanvasColorWheelPanel } from "@/components/editor/canvas-color-wheel-panel";
import { ObjectStickerPackPanel } from "@/components/editor/object-sticker-pack-panel";
import { CanvasAutoLayoutPanel } from "@/components/editor/canvas-auto-layout-panel";
import { CanvasBrandGuidelinesPanel } from "@/components/editor/canvas-brand-guidelines-panel";
import { ObjectOpacityMapPanel } from "@/components/editor/object-opacity-map-panel";
import { CanvasImageOverlayPanel } from "@/components/editor/canvas-image-overlay-panel";
import { CanvasPatternFillPanel } from "@/components/editor/canvas-pattern-fill-panel";
import { TextOutlineShadowPanel } from "@/components/editor/text-outline-shadow-panel";
import { CanvasZoomControlsPanel } from "@/components/editor/canvas-zoom-controls-panel";
import { CanvasBlendModesPanel } from "@/components/editor/canvas-blend-modes-panel";
import { ObjectWaveDistortionPanel } from "@/components/editor/object-wave-distortion-panel";
import { CanvasArtboardPanel } from "@/components/editor/canvas-artboard-panel";
import { CanvasRulerSnapPanel } from "@/components/editor/canvas-ruler-snap-panel";
import { TextBubbleCaptionPanel } from "@/components/editor/text-bubble-caption-panel";
import { CanvasFrameMockupPanel } from "@/components/editor/canvas-frame-mockup-panel";
import { Object3DExtrudePanel } from "@/components/editor/object-3d-extrude-panel";
import { CanvasQuickActionsBarPanel } from "@/components/editor/canvas-quick-actions-bar-panel";
import { TextComicEffectPanel } from "@/components/editor/text-comic-effect-panel";
import { ImageColorIsolatePanel } from "@/components/editor/image-color-isolate-panel";
import { CanvasPageManagerPanel } from "@/components/editor/canvas-page-manager-panel";
import { ObjectDistortGridPanel } from "@/components/editor/object-distort-grid-panel";
import { useEditorStore } from "@/store/editor-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  Home,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Shapes,
  Sticker,
  ImageIcon,
  AlignCenter,
  Type,
  Clock,
  FolderOpen,
  Filter,
  Palette,
  Droplets,
  Zap,
  PenLine,
  Frame,
  LayoutGrid,
  Images,
  Keyboard,
  Smartphone,
  Maximize,
  Expand,
  CheckCircle2,
  QrCode,
  Play,
  Maximize2,
  Crop,
  ImagePlus,
  StickyNote,
  Smile,
  Baseline,
  Eclipse,
  Square,
  Table,
  Grid3X3,
  Wind,
  Download,
  Spline,
  Crosshair,
  Wand2,
  SquareStack,
  Sliders,
  Lock,
  MoveHorizontal,
  RefreshCw,
  Copy,
  Ruler,
  Save,
  Pipette,
  Heart,
  History,
  SearchCheck,
  Blend,
  BarChart3,
  Repeat,
  Scissors,
  Wallpaper,
  FlaskConical,
  TextCursorInput,
  GalleryVerticalEnd,
  ScanEye,
  PackageOpen,
  StretchHorizontal,
  Tag,
  Magnet,
  ZoomIn,
  Clipboard,
  Group,
  Highlighter,
  Replace,
  ALargeSmall,
  LibraryBig,
  FileDown,
  FlipHorizontal2,
  Pilcrow,
  LayoutTemplate,
  Paintbrush2,
  CaseSensitive,
  Radius,
  Eraser,
  SlidersVertical,
  AlignCenterHorizontal,
  SwatchBook,
  Undo2,
  Clapperboard,
  RulerIcon,
  FlipVertical2,
  PackagePlus,
  Hash,
  MessageSquare,
  Sun,
  Grid2X2,
  Printer,
  ArrowLeftRight,
  Camera,
  Variable,
  Activity,
  Shuffle,
  Layers2,
  Gem,
  Waves,
  Target,
  Radio,
  Move,
  Focus,
  Timer,
  Link as LinkIcon,
  Moon,
  Sunrise,
  Disc,
  ScanLine,
  ClipboardCopy,
  Pin,
  Contrast,
  Lasso,
  Feather,
  PaintBucket,
  PencilRuler,
  SprayCan,
  Layers3,
  Gauge,
  TrendingUp,
  Upload,
  Share2,
  Loader2,
  BoxSelect,
  MessageCircle,
  Monitor,
  Bookmark,
  Eye,
  Pencil,
  Box,
  FileStack,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const FabricCanvas = dynamic(
  () => import("@/components/canvas/fabric-canvas").then((m) => m.FabricCanvas),
  { ssr: false }
);

export default function EditorPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [resizeOpen, setResizeOpen] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const { template, lastSavedAt } = useEditorStore();

  const handleCanvasReady = useCallback((canvas: unknown) => {
    fabricRef.current = canvas;
    setFabricCanvas(canvas);
  }, []);

  const handleSelectionChange = useCallback(() => {
    setSelectionVersion((n) => n + 1);
  }, []);

  useKeyboardShortcuts(fabricRef);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") setShortcutsOpen((v) => !v);
      if (e.key === "F" && !e.ctrlKey && !e.metaKey) setFocusMode((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50 flex-shrink-0">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
        >
          <Home className="w-4 h-4" />
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold text-foreground">Editor</h1>
        <div className="ml-auto flex items-center gap-3">
          {lastSavedAt && (
            <span className="flex items-center gap-1 text-[11px] text-green-500/80" title={`Salvo às ${new Date(lastSavedAt).toLocaleTimeString()}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salvo</span>
            </span>
          )}
          {template && (
            <button
              onClick={() => setResizeOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
              title="Redimensionar canvas"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redimensionar</span>
            </button>
          )}
          {template && (
            <button
              onClick={() => setPresentationOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
              title="Modo Apresentação"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apresentar</span>
            </button>
          )}
          <button
            onClick={() => setFocusMode((v) => !v)}
            className={`flex items-center gap-1.5 text-[11px] transition-colors px-2 py-1 rounded hover:bg-accent ${focusMode ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="Modo Foco — esconde painéis laterais (F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{focusMode ? "Foco" : "Foco"}</span>
          </button>
          {fabricCanvas && (
            <button
              onClick={() => {
                const dataUrl = fabricCanvas.toDataURL({ format: "png", multiplier: 1 });
                const link = document.createElement("a");
                link.download = "design.png";
                link.href = dataUrl;
                link.click();
              }}
              className="flex items-center gap-1.5 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-md font-medium"
              title="Exportar PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
          <button
            onClick={() => setShortcutsOpen(true)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
            title="Atalhos de teclado (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atalhos</span>
          </button>
        </div>
        {template && (
          <>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {template.name} — {template.width}×{template.height}px
            </span>
          </>
        )}
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Focus mode toggle */}
        {focusMode && (
          <button
            onClick={() => setFocusMode(false)}
            className="absolute top-2 right-2 z-20 text-[10px] text-white/50 hover:text-white/80 bg-black/40 px-2 py-1 rounded transition-colors"
            title="Sair do modo foco (F)"
          >
            Sair do Foco
          </button>
        )}
        {/* Left sidebar */}
        <aside className={`w-72 flex-shrink-0 border-r border-border bg-card/30 flex flex-col overflow-hidden transition-all duration-300 ${focusMode ? "hidden" : ""}`}>
          <Tabs defaultValue="templates" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid m-2 flex-shrink-0 h-8" style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}>
              <TabsTrigger value="templates" className="text-[9px] px-0.5 gap-0.5" title="Templates">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shapes" className="text-[9px] px-0.5 gap-0.5" title="Formas">
                <Shapes className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="elements" className="text-[9px] px-0.5 gap-0.5" title="Elementos">
                <Sticker className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="vector" className="text-[9px] px-0.5 gap-0.5" title="Vetores (Linhas, Polígonos, Estrelas)">
                <Spline className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="icons" className="text-[9px] px-0.5 gap-0.5" title="Ícones">
                <LayoutGrid className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="emoji" className="text-[9px] px-0.5 gap-0.5" title="Emojis">
                <Smile className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="frames" className="text-[9px] px-0.5 gap-0.5" title="Molduras">
                <Frame className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-[9px] px-0.5 gap-0.5" title="Fotos Stock">
                <Images className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="myimages" className="text-[9px] px-0.5 gap-0.5" title="Minhas Imagens">
                <ImagePlus className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="table" className="text-[9px] px-0.5 gap-0.5" title="Tabela">
                <Table className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textpath" className="text-[9px] px-0.5 gap-0.5" title="Texto em Caminho">
                <Spline className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-[9px] px-0.5 gap-0.5" title="Padrões e Texturas">
                <SquareStack className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="quickstyles" className="text-[9px] px-0.5 gap-0.5" title="Estilos Rápidos">
                <Wand2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="qrcode" className="text-[9px] px-0.5 gap-0.5" title="QR Code">
                <QrCode className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="fonts" className="text-[9px] px-0.5 gap-0.5" title="Fontes">
                <Type className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-[9px] px-0.5 gap-0.5" title="IA">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="draw" className="text-[9px] px-0.5 gap-0.5" title="Desenho Livre">
                <PenLine className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="photoframes" className="text-[9px] px-0.5 gap-0.5" title="Molduras para Fotos">
                <SquareStack className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="projects" className="text-[9px] px-0.5 gap-0.5" title="Projetos">
                <FolderOpen className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <TemplatePicker />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="shapes" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <ShapesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="elements" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <ElementsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="vector" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <VectorElementsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="icons" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <IconsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="frames" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <FramesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="emoji" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <EmojiPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="photos" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <StockPhotosPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="myimages" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <MyImagesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="table" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TablePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textpath" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextOnPathPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="patterns" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PatternsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="quickstyles" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <QuickStylesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="photoframes" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PhotoFramesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="qrcode" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <QRCodePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="fonts" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <GoogleFontsPanel fabricCanvas={fabricCanvas} />
                <div className="border-t border-border">
                  <CustomFontPanel fabricCanvas={fabricCanvas} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4">
                  <AiTemplateGenerator fabricCanvas={fabricCanvas} />
                  <div className="border-t border-border pt-4">
                    <AiSuggestionsPanel />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="draw" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <DrawPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="projects" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ProjectsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <CanvasToolbar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} showRulers={showRulers} onToggleRulers={() => setShowRulers((v) => !v)} />
          <CanvasContextMenu fabricCanvas={fabricCanvas} />
          <div className="flex-1 overflow-hidden bg-[#1a1a1a]">
            <CanvasWithRulers fabricCanvas={fabricCanvas} showRulers={showRulers} onToggleRulers={() => setShowRulers((v) => !v)}>
              <div className="w-full h-full flex items-center justify-center p-8">
                {template ? (
                  <FabricCanvas
                    onCanvasReady={handleCanvasReady}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground text-center max-w-sm">
                    <Layers className="w-12 h-12 opacity-20" />
                    <div>
                      <p className="font-medium text-foreground/60 mb-1">Nenhum template selecionado</p>
                      <p className="text-sm opacity-60">
                        Escolha um template no painel esquerdo para começar a criar sua thumbnail
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CanvasWithRulers>
          </div>
          {template && <PageStrip fabricCanvas={fabricCanvas} />}
        </main>

        {/* Right sidebar */}
        <aside className={`w-64 flex-shrink-0 border-l border-border bg-card/30 flex flex-col overflow-hidden transition-all duration-300 ${focusMode ? "hidden" : ""}`}>
          <Tabs defaultValue="properties" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid m-2 flex-shrink-0 h-8" style={{ gridTemplateColumns: "repeat(189, minmax(0, 1fr))" }}>
              <TabsTrigger value="properties" title="Propriedades" className="px-0.5">
                <SlidersHorizontal className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="text" title="Texto" className="px-0.5">
                <Type className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="gradient" title="Gradiente" className="px-0.5">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="filters" title="Filtros de Imagem" className="px-0.5">
                <Filter className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="crop" title="Recortar Imagem" className="px-0.5">
                <Crop className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="layers" title="Camadas" className="px-0.5">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="align" title="Alinhar" className="px-0.5">
                <AlignCenter className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="background" title="Fundo" className="px-0.5">
                <ImageIcon className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="history" title="Histórico" className="px-0.5">
                <Clock className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="palette" title="Paletas de Cores" className="px-0.5">
                <Droplets className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="effects" title="Efeitos (Sombra e Borda)" className="px-0.5">
                <Zap className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="typography" title="Tipografia" className="px-0.5">
                <Baseline className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shadow" title="Sombra" className="px-0.5">
                <Eclipse className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="border" title="Contorno" className="px-0.5">
                <Square className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="animations" title="Animações" className="px-0.5">
                <Wind className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="grid" title="Grade e Guias" className="px-0.5">
                <Grid3X3 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="notes" title="Notas do Design" className="px-0.5">
                <StickyNote className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="export" title="Exportar" className="px-0.5">
                <Download className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="smartresize" title="Smart Resize" className="px-0.5">
                <Maximize2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="guides" title="Guias e Snap" className="px-0.5">
                <Crosshair className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textfx" title="Efeitos de Texto Avançados" className="px-0.5">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="imgadj" title="Ajustes de Imagem" className="px-0.5">
                <Sliders className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="objlock" title="Bloqueio e Ordenação" className="px-0.5">
                <Lock className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textspacing" title="Espaçamento de Texto" className="px-0.5">
                <MoveHorizontal className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="dropshadow" title="Sombra Avançada" className="px-0.5">
                <Eclipse className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="colorharmony" title="Harmonia de Cores" className="px-0.5">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="transform" title="Transformações" className="px-0.5">
                <RefreshCw className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="strokeadv" title="Contorno Avançado" className="px-0.5">
                <PenLine className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="duplicator" title="Duplicador Inteligente" className="px-0.5">
                <Copy className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="coords" title="Coordenadas Precisas" className="px-0.5">
                <Ruler className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="autosave" title="Salvar / AutoSave" className="px-0.5">
                <Save className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="colorextract" title="Extrair Paleta da Imagem" className="px-0.5">
                <Pipette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="measurement" title="Medidas do Objeto" className="px-0.5">
                <Ruler className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="favorites" title="Favoritos" className="px-0.5">
                <Heart className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="visualhistory" title="Histórico Visual" className="px-0.5">
                <History className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="elementsearch" title="Buscar Elementos" className="px-0.5">
                <SearchCheck className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="quickactions" title="Ações Rápidas (Copiar/Colar/Recortar)" className="px-0.5">
                <Copy className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="distribute" title="Distribuir e Alinhar" className="px-0.5">
                <LayoutGrid className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="blend" title="Composição e Blend" className="px-0.5">
                <Blend className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="margins" title="Margens e Sangria" className="px-0.5">
                <Ruler className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="patterntile" title="Repetição de Padrão" className="px-0.5">
                <Repeat className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="designstats" title="Estatísticas do Design" className="px-0.5">
                <BarChart3 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="cropadv" title="Recorte Avançado de Imagem" className="px-0.5">
                <Scissors className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="bgadv" title="Fundo Avançado (Gradiente/Padrão)" className="px-0.5">
                <Wallpaper className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="inspector" title="Inspetor de Propriedades" className="px-0.5">
                <FlaskConical className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textshadow" title="Sombra de Texto" className="px-0.5">
                <Eclipse className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="gradienttext" title="Gradiente no Texto" className="px-0.5">
                <TextCursorInput className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="rulerguides" title="Guias Manuais" className="px-0.5">
                <GalleryVerticalEnd className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="objvisibility" title="Visibilidade dos Objetos" className="px-0.5">
                <ScanEye className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="exportadv" title="Exportar Avançado" className="px-0.5">
                <PackageOpen className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="smartalign" title="Alinhar Inteligente" className="px-0.5">
                <StretchHorizontal className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textoutline" title="Contorno do Texto" className="px-0.5">
                <PenLine className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="gridoverlay" title="Grade Visual" className="px-0.5">
                <Grid3X3 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="rename" title="Renomear Objetos" className="px-0.5">
                <Tag className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="clipboard" title="Área de Transferência" className="px-0.5">
                <Clipboard className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="snap" title="Snap e Guias" className="px-0.5">
                <Magnet className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="zoom" title="Controle de Zoom" className="px-0.5">
                <ZoomIn className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="aspectlock" title="Proporção e Tamanho" className="px-0.5">
                <Lock className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shortcuts" title="Atalhos de Teclado" className="px-0.5">
                <Keyboard className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="contextual" title="Propriedades Contextuais" className="px-0.5">
                <Wand2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="objgroup" title="Grupos de Objetos" className="px-0.5">
                <Group className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textbg" title="Fundo do Texto" className="px-0.5">
                <Highlighter className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="imgplaceholder" title="Placeholder de Imagem" className="px-0.5">
                <Replace className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="cropinteractive" title="Recorte Interativo" className="px-0.5">
                <Scissors className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="letterspacing" title="Espaçamento de Letras" className="px-0.5">
                <ALargeSmall className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="objtransparency" title="Transparência e Blend" className="px-0.5">
                <Blend className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shapelibrary" title="Biblioteca de Formas" className="px-0.5">
                <LibraryBig className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textpathfx" title="Texto em Caminho" className="px-0.5">
                <Spline className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="exportpreview" title="Exportar com Prévia" className="px-0.5">
                <FileDown className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="flipmirror" title="Espelhar e Rotacionar" className="px-0.5">
                <FlipHorizontal2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="paragraph" title="Parágrafo e Alinhamento de Texto" className="px-0.5">
                <Pilcrow className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="templatesize" title="Tamanho do Canvas / Templates" className="px-0.5">
                <LayoutTemplate className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shadowpreset" title="Presets de Sombra" className="px-0.5">
                <Eclipse className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="colormixer" title="Misturador de Cores" className="px-0.5">
                <Paintbrush2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textcase" title="Transformar Caixa de Texto" className="px-0.5">
                <CaseSensitive className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="watermark" title="Marca d'água" className="px-0.5">
                <Droplets className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="cornerradius" title="Raio dos Cantos" className="px-0.5">
                <Radius className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="bgremove" title="Remover Fundo por Cor" className="px-0.5">
                <Eraser className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="imagefilters" title="Filtros de Imagem" className="px-0.5">
                <SlidersVertical className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="aligndistribute" title="Alinhar e Distribuir" className="px-0.5">
                <AlignCenterHorizontal className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="gridsnap" title="Grade e Magnetismo" className="px-0.5">
                <LayoutGrid className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="gradient" title="Gradiente Avançado" className="px-0.5">
                <SwatchBook className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="layerexport" title="Camadas e Exportação" className="px-0.5">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="history" title="Histórico de Ações" className="px-0.5">
                <Undo2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textarc" title="Texto em Arco" className="px-0.5">
                <Spline className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="pattern" title="Padrões e Texturas" className="px-0.5">
                <Repeat className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="guides" title="Guias Personalizadas" className="px-0.5">
                <Ruler className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="stroke" title="Borda Avançada" className="px-0.5">
                <PenLine className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="colorpalette" title="Paleta do Projeto" className="px-0.5">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="clipmask" title="Máscara de Recorte" className="px-0.5">
                <Scissors className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="keyframes" title="Animação por Keyframes" className="px-0.5">
                <Clapperboard className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="rulersettings" title="Configurações das Réguas" className="px-0.5">
                <RulerIcon className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="texthighlight" title="Marcador de Texto" className="px-0.5">
                <Highlighter className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="reflection" title="Reflexo do Objeto" className="px-0.5">
                <FlipVertical2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="exportbatch" title="Exportação em Lote" className="px-0.5">
                <PackagePlus className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textcounter" title="Contador de Texto" className="px-0.5">
                <Hash className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="neonglow" title="Efeito Neon / Glow" className="px-0.5">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="collaboration" title="Colaboração e Comentários" className="px-0.5">
                <MessageSquare className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="imgsaturation" title="Cor e Saturação" className="px-0.5">
                <Sun className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="mosaic" title="Mosaico e Pixelação" className="px-0.5">
                <Grid2X2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="printsafe" title="Área Segura para Impressão" className="px-0.5">
                <Printer className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textautofit" title="Ajuste Automático de Texto" className="px-0.5">
                <ArrowLeftRight className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="glitch" title="Efeito Glitch" className="px-0.5">
                <Zap className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="snapshot" title="Snapshots do Canvas" className="px-0.5">
                <Camera className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textvariable" title="Variáveis de Texto" className="px-0.5">
                <Variable className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textanimation" title="Animação de Texto" className="px-0.5">
                <Activity className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="patternfill" title="Preenchimento com Padrão" className="px-0.5">
                <Shuffle className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="multipage" title="Múltiplas Páginas" className="px-0.5">
                <Layers2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="duotone" title="Duotone / Bicolor" className="px-0.5">
                <Gem className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="borderanim" title="Borda Animada" className="px-0.5">
                <Waves className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="markers" title="Marcadores no Canvas" className="px-0.5">
                <Target className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="speech" title="Texto para Fala" className="px-0.5">
                <Radio className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="magnet" title="Magneto / Snap" className="px-0.5">
                <Move className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="focus" title="Modo Foco / Camadas" className="px-0.5">
                <Focus className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="timer" title="Timer / Cronômetro" className="px-0.5">
                <Timer className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="links" title="Links nos Objetos" className="px-0.5">
                <LinkIcon className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="theme" title="Temas de Cor" className="px-0.5">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="vignette" title="Vinheta (Vignette)" className="px-0.5">
                <Moon className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="prestimer" title="Timer de Apresentação" className="px-0.5">
                <Sunrise className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="outlineglow" title="Contorno com Brilho" className="px-0.5">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="pixelart" title="Pixel Art" className="px-0.5">
                <Grid2X2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textonshape" title="Texto na Forma" className="px-0.5">
                <Shapes className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="halftone" title="Halftone / Pontilhado" className="px-0.5">
                <Disc className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="cropresizepanel" title="Recortar e Redimensionar Imagem" className="px-0.5">
                <ScanLine className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="canvasclipboard" title="Área de Transferência (Copiar/Colar/Recortar)" className="px-0.5">
                <ClipboardCopy className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="transformorigin" title="Origem da Transformação (Pivot)" className="px-0.5">
                <Pin className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="contrastbrightness" title="Contraste, Brilho, Exposição" className="px-0.5">
                <Contrast className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="lassoselect" title="Seleção Lasso" className="px-0.5">
                <Lasso className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="feather" title="Desfoque de Bordas (Feather)" className="px-0.5">
                <Feather className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="paintbucket" title="Balde de Tinta" className="px-0.5">
                <PaintBucket className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textformatting" title="Formatação Completa de Texto" className="px-0.5">
                <PencilRuler className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="sprayeffect" title="Efeito Spray / Granulado" className="px-0.5">
                <SprayCan className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="objecthierarchy" title="Hierarquia de Objetos (Camadas)" className="px-0.5">
                <Layers3 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="rulerguideadv" title="Réguas e Guias Avançadas" className="px-0.5">
                <Gauge className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="colorgrading" title="Color Grading (Sombras/Meios/Luzes)" className="px-0.5">
                <TrendingUp className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="insertquick" title="Inserção Rápida de Objetos" className="px-0.5">
                <Zap className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="perspective" title="Perspectiva e Warp de Imagem" className="px-0.5">
                <Maximize2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textglow" title="Glow / Neon no Texto" className="px-0.5">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="stylecopy" title="Copiar Estilo" className="px-0.5">
                <Pipette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="dragdrop" title="Upload / Drag & Drop" className="px-0.5">
                <Upload className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="aspectratio" title="Proporção e Posição" className="px-0.5">
                <Lock className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="mockup" title="Mockup de Dispositivo" className="px-0.5">
                <Smartphone className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="typewriter" title="Máquina de Escrever" className="px-0.5">
                <Keyboard className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="smartfit" title="Ajuste Inteligente" className="px-0.5">
                <Maximize className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="thumbtemplates" title="Templates de Thumbnail" className="px-0.5">
                <LayoutTemplate className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="bggenerator" title="Gerador de Fundo" className="px-0.5">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="multishadow" title="Multi-Sombra" className="px-0.5">
                <Layers2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="frameborder" title="Moldura e Borda" className="px-0.5">
                <Frame className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textgradoutline" title="Gradiente e Contorno" className="px-0.5">
                <TextCursorInput className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="elementrepeater" title="Repetidor de Elementos" className="px-0.5">
                <Copy className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="paletteextractor" title="Extrator de Paleta" className="px-0.5">
                <Pipette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textneon" title="Efeito Neon" className="px-0.5">
                <Zap className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="snapgrid" title="Grade e Snap" className="px-0.5">
                <Grid3X3 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textonimage" title="Texto sobre Imagem" className="px-0.5">
                <ImageIcon className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="skew" title="Distorção Skew" className="px-0.5">
                <MoveHorizontal className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="exportsocial" title="Exportar Redes Sociais" className="px-0.5">
                <Share2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="countdowntimer" title="Timer Countdown" className="px-0.5">
                <Timer className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="particleeffect" title="Efeito de Partículas" className="px-0.5">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shadow3d" title="Sombra 3D" className="px-0.5">
                <BoxSelect className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="speechbubble" title="Balão de Fala" className="px-0.5">
                <MessageCircle className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="noisetexture" title="Textura de Ruído" className="px-0.5">
                <FlaskConical className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="highlightglow" title="Highlight e Glow" className="px-0.5">
                <Sun className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="perspectivetransform" title="Perspectiva" className="px-0.5">
                <Maximize2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textmask" title="Texto com Máscara" className="px-0.5">
                <Type className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="reflectionadvanced" title="Reflexo Avançado" className="px-0.5">
                <FlipVertical2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="mockupscene" title="Cena de Mockup" className="px-0.5">
                <Monitor className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="kinetictext" title="Animação Cinética de Texto" className="px-0.5">
                <Clapperboard className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="smartcrop" title="Recorte Inteligente" className="px-0.5">
                <Crop className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="colorwheel" title="Roda de Cores" className="px-0.5">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="stickerpack" title="Pack de Stickers" className="px-0.5">
                <Smile className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="autolayout" title="Auto Layout" className="px-0.5">
                <LayoutGrid className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="brandguidelines" title="Guia de Marca" className="px-0.5">
                <Bookmark className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="opacitymap" title="Mapa de Opacidade" className="px-0.5">
                <Eye className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="imageoverlay" title="Overlay de Imagem" className="px-0.5">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="patternfill" title="Preenchimento com Padrão" className="px-0.5">
                <Grid3X3 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textoutlineshadow" title="Contorno & Sombra" className="px-0.5">
                <Pencil className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="zoomcontrols" title="Zoom & Viewport" className="px-0.5">
                <ZoomIn className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="blendmodes" title="Modos de Blend" className="px-0.5">
                <Blend className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="wavedistortion" title="Distorção de Onda" className="px-0.5">
                <Waves className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="artboard" title="Prancheta" className="px-0.5">
                <Monitor className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="rulersnap" title="Régua & Snap" className="px-0.5">
                <Ruler className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="bubblecaption" title="Balão de Texto" className="px-0.5">
                <MessageSquare className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="framemockup" title="Frame & Moldura" className="px-0.5">
                <Frame className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="extrude3d" title="Extrusão 3D" className="px-0.5">
                <Box className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="quickactionsbar" title="Ações Rápidas" className="px-0.5">
                <Zap className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="comiceffect" title="Efeito Cômico" className="px-0.5">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="colorisolate" title="Isolar Cor" className="px-0.5">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="pagemanager" title="Gerenciador de Páginas" className="px-0.5">
                <FileStack className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="distortgrid" title="Distorção em Grade" className="px-0.5">
                <Grid2X2 className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PositionSizePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                <div className="border-t border-border">
                  <PropertiesPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="text" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextFormatBar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                <div className="border-t border-border">
                  <TextStylesPanel fabricCanvas={fabricCanvas} />
                </div>
                <div className="border-t border-border">
                  <TextEffectsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
                <div className="border-t border-border mt-2">
                  <TextTemplatesPanel fabricCanvas={fabricCanvas} />
                </div>
                <div className="border-t border-border mt-2">
                  <CurvedTextPanel fabricCanvas={fabricCanvas} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="gradient" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <GradientPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="filters" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageFiltersPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="crop" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageCropPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="layers" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <LayersPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="align" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-3 pb-3">
                  <AlignTools fabricCanvas={fabricCanvas} />
                  <div className="mt-4 border-t border-border pt-4">
                    <ImageCropPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <ClipMaskPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="background" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-3 pb-3">
                  <BackgroundPanel fabricCanvas={fabricCanvas} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <HistoryPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="palette" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <BrandKitPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                <div className="border-t border-border">
                  <ColorPalettePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
                <div className="border-t border-border mt-2">
                  <ColorPickerEyedropper fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
                <div className="border-t border-border mt-2">
                  <ColorReplacePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="effects" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <EffectsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                <div className="border-t border-border mt-2">
                  <OpacityBlendPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="typography" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TypographyPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="shadow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ShadowPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="border" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <BorderPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="animations" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <AnimationsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="grid" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <GridSettingsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasNotesPanel />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="export" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <AdvancedExportPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="smartresize" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <SmartResizePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="guides" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <SmartGuidesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textfx" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextEffectsAdvancedPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="imgadj" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageAdjustmentsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="objlock" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectLockPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textspacing" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextSpacingPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dropshadow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <DropShadowAdvancedPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="colorharmony" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ColorHarmonyPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="transform" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TransformPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="strokeadv" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <StrokeOutlinePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="duplicator" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectDuplicatorPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="coords" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PreciseCoordsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="autosave" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <AutosaveProjectPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="colorextract" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageColorExtractorPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="measurement" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <SmartMeasurementPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="favorites" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <FavoritesPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="visualhistory" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <VisualHistoryPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="elementsearch" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ElementSearchPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="quickactions" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <QuickActionsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="distribute" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <AutoDistributePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="blend" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectBlendPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="margins" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <MarginBleedPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="patterntile" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PatternTilePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="designstats" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <DesignStatsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="cropadv" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageCropAdvancedPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="bgadv" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasBackgroundAdvancedPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="inspector" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectPropertiesInspectorPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textshadow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextShadowPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="gradienttext" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ColorGradientTextPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="rulerguides" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasRulerGuidePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="objvisibility" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectVisibilityPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="exportadv" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasExportSettingsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="smartalign" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <SmartAlignDistributePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textoutline" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextOutlinePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="gridoverlay" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasGridOverlayPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="rename" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectRenamePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="clipboard" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ClipboardPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="snap" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <SnapSettingsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="zoom" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ZoomControlsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="aspectlock" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <AspectRatioLockPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="shortcuts" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <KeyboardShortcutsPanel />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="contextual" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ContextualToolbarPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="objgroup" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectGroupPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textbg" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextBackgroundPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="imgplaceholder" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImagePlaceholderPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="cropinteractive" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CropInteractivePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="letterspacing" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextLetterSpacingPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="objtransparency" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectTransparencyPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="shapelibrary" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ShapeLibraryPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textpathfx" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextPathEffectPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="exportpreview" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasExportPreviewPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="flipmirror" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectFlipMirrorPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="paragraph" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextParagraphPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="templatesize" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasTemplateSizePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="shadowpreset" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectShadowPresetPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="colormixer" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ColorMixerPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textcase" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextCaseTransformPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="watermark" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasWatermarkPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="cornerradius" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectCornerRadiusPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="bgremove" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageBgColorRemovePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="imagefilters" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageFilterPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="aligndistribute" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectAlignDistributePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="gridsnap" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasGridSnapPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="gradient" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectGradientPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="layerexport" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasLayerExportPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="history" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasHistoryPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textarc" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextArcPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="pattern" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasPatternPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="guides" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasGuidesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="stroke" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectStrokePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="colorpalette" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ProjectColorPalettePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="clipmask" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectClipMaskPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="keyframes" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectPositionAnimationPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="rulersettings" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasRulerSettingsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="texthighlight" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextHighlightPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="reflection" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectReflectionPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="exportbatch" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasExportBatchPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textcounter" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextCounterPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="neonglow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectNeonGlowPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="collaboration" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasCollaborationPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="imgsaturation" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageSaturationPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="mosaic" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectMosaicPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="printsafe" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasPrintSafePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textautofit" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextAutofitPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="glitch" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectGlitchEffectPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="snapshot" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasSnapshotPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textvariable" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextVariablePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textanimation" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextAnimationPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="patternfill" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectPatternFillPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="multipage" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasMultiPagePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="duotone" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageDuotonePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="borderanim" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectBorderAnimPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="markers" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasMarkerPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="speech" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextSpeechPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="magnet" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectMagnetPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="focus" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasFocusModePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="timer" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasTimerPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="links" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectLinkPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="theme" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasColorThemePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="vignette" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageVignettePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="prestimer" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasPresentationTimerPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="outlineglow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectOutlineGlowPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="pixelart" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasPixelArtPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textonshape" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectTextOnShapePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="halftone" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageHalftonePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="cropresizepanel" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageCropResizePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="canvasclipboard" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasClipboardPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="transformorigin" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectTransformOriginPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="contrastbrightness" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageContrastBrightnessPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="lassoselect" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasLassoSelectPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="feather" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectFeatherPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="paintbucket" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasPaintBucketPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textformatting" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextFormattingPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="sprayeffect" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageSprayEffectPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="objecthierarchy" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasObjectHierarchyPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="rulerguideadv" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasRulerGuideAdvancedPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="colorgrading" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageColorGradingPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insertquick" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasInsertQuickPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="perspective" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImagePerspectivePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textglow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextGlowEffectPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stylecopy" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectStyleCopyPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dragdrop" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasDragDropUploadPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="aspectratio" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectAspectRatioPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="mockup" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasMockupPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="typewriter" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextTypewriterPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="smartfit" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasSmartFitPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="thumbtemplates" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasThumbnailTemplatesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bggenerator" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasBackgroundGeneratorPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="multishadow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectMultiShadowPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="frameborder" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasFrameBorderPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textgradoutline" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextGradientOutlinePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="elementrepeater" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasElementRepeaterPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="paletteextractor" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasColorPaletteExtractorPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textneon" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextNeonEffectPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="snapgrid" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectSnapGridPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textonimage" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasTextOnImagePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="skew" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectSkewPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="exportsocial" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasExportSocialPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="countdowntimer" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasCountdownTimerPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="particleeffect" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectParticleEffectPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="shadow3d" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextShadow3dPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="speechbubble" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasSpeechBubblePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="noisetexture" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageNoiseTexturePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="highlightglow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectHighlightGlowPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="perspectivetransform" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasPerspectiveTransformPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textmask" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasTextMaskPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="reflectionadvanced" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectReflectionAdvancedPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="mockupscene" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasMockupScenePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="kinetictext" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextKineticAnimationPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="smartcrop" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasSmartCropPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="colorwheel" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasColorWheelPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="stickerpack" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectStickerPackPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="autolayout" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasAutoLayoutPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="brandguidelines" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasBrandGuidelinesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="opacitymap" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectOpacityMapPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="imageoverlay" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasImageOverlayPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="patternfill" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasPatternFillPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="textoutlineshadow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextOutlineShadowPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="zoomcontrols" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasZoomControlsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="blendmodes" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasBlendModesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="wavedistortion" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectWaveDistortionPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="artboard" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasArtboardPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="rulersnap" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasRulerSnapPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="bubblecaption" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextBubbleCaptionPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="framemockup" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasFrameMockupPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="extrude3d" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <Object3DExtrudePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="quickactionsbar" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasQuickActionsBarPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="comiceffect" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextComicEffectPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="colorisolate" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageColorIsolatePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="pagemanager" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasPageManagerPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="distortgrid" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectDistortGridPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      <FloatingToolbar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
      <MultiSelectPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
      <CanvasStatusBar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {presentationOpen && fabricCanvas && (
        <PresentationMode fabricCanvas={fabricCanvas} onClose={() => setPresentationOpen(false)} />
      )}
      <ResizeCanvasDialog open={resizeOpen} onClose={() => setResizeOpen(false)} fabricCanvas={fabricCanvas} />
    </div>
  );
}
