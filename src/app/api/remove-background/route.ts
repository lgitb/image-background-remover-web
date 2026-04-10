import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "请提供图片" }, { status: 400 });
    }

    if (!REMOVE_BG_API_KEY) {
      return NextResponse.json(
        { error: "服务器未配置 API 密钥" },
        { status: 500 }
      );
    }

    // Convert base64 to Uint8Array (Edge-compatible)
    const base64Data = image.split(",")[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Call Remove.bg API
    const formData = new FormData();
    formData.append("image_file", new Blob([bytes]), "image.png");
    formData.append("size", "auto");
    formData.append("format", "png");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg API error:", errorText);

      if (response.status === 402) {
        return NextResponse.json(
          { error: "API 配额已用完，请联系管理员" },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: "背景去除失败，请重试" },
        { status: response.status }
      );
    }

    // Get result as blob
    const resultBuffer = await response.arrayBuffer();
    const resultBytes = new Uint8Array(resultBuffer);
    let resultBinary = "";
    for (let i = 0; i < resultBytes.length; i++) {
      resultBinary += String.fromCharCode(resultBytes[i]);
    }
    const resultBase64 = btoa(resultBinary);
    const resultDataUrl = `data:image/png;base64,${resultBase64}`;

    return NextResponse.json({
      result: resultDataUrl,
      size: resultBuffer.byteLength,
    });
  } catch (error) {
    console.error("Background removal error:", error);
    return NextResponse.json(
      { error: "处理失败，请重试" },
      { status: 500 }
    );
  }
}
