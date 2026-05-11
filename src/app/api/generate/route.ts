import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY não configurada no .env.local" },
      { status: 500 }
    );
  }

  let body: { prompt?: string; width?: number; height?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { prompt, width = 1280, height = 720 } = body;
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Campo 'prompt' é obrigatório" }, { status: 400 });
  }

  // Determina o aspect ratio mais próximo que o Imagen 3 suporta
  const ratio = width / height;
  let aspectRatio: string;
  if (ratio >= 1.7) {
    aspectRatio = "16:9"; // YouTube, Twitter
  } else if (ratio >= 1.3) {
    aspectRatio = "4:3";
  } else if (ratio >= 0.9 && ratio <= 1.1) {
    aspectRatio = "1:1"; // Instagram square
  } else if (ratio < 0.9) {
    aspectRatio = "9:16"; // Stories
  } else {
    aspectRatio = "16:9";
  }

  // Enriquece o prompt para thumbnails profissionais
  const enrichedPrompt = `${prompt}. Professional thumbnail image, high quality, vibrant colors, sharp details, photorealistic, marketing photography style, 4K resolution.`;

  const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

  // @ts-expect-error — generateImages não está nos tipos estáveis ainda
  const result = await model.generateImages({
    prompt: enrichedPrompt,
    number_of_images: 1,
    aspect_ratio: aspectRatio,
    safety_filter_level: "block_only_high",
    person_generation: "allow_adult",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generatedImages: any[] = result?.images ?? result?.generatedImages ?? [];

  if (!generatedImages || generatedImages.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma imagem gerada. Tente um prompt diferente." },
      { status: 500 }
    );
  }

  const imgData = generatedImages[0];
  const base64 =
    imgData.imageBytes ?? imgData.image?.imageBytes ?? imgData.bytesBase64Encoded;

  if (!base64) {
    return NextResponse.json(
      { error: "Formato de resposta inesperado da API Imagen." },
      { status: 500 }
    );
  }

  const dataUrl = `data:image/png;base64,${base64}`;
  return NextResponse.json({ image: dataUrl, aspectRatio });
}
