"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Download, Loader2, ImageIcon, CheckCircle, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [resultSize, setResultSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    setResultImage(null);
    setResultSize(0);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("请上传 JPG、PNG 或 WebP 格式的图片");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("文件大小不能超过 10MB");
      return;
    }

    setOriginalSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemoveBackground = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: originalImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "处理失败，请重试");
      }

      setResultImage(data.result);
      setResultSize(data.size);
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `removed-bg-${Date.now()}.png`;
    link.click();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setOriginalSize(0);
    setResultSize(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">图像背景去除</h1>
          <p className="text-gray-600 mt-1">简单、快速、免费的在线背景去除工具</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!originalImage ? (
          /* Upload Area */
          <div
            className={`dropzone rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragging ? "active" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              点击或拖拽上传图片
            </p>
            <p className="text-sm text-gray-600">
              支持 JPG、PNG、WebP 格式，最大 10MB
            </p>
          </div>
        ) : (
          /* Preview & Process Area */
          <div className="space-y-6">
            {/* Image Previews */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original Image */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-700">原图</span>
                </div>
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  文件大小: {formatFileSize(originalSize)}
                </p>
              </div>

              {/* Result Image */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  {resultImage ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-medium text-gray-700">去除背景</span>
                </div>
                <div
                  className={`relative rounded-lg overflow-hidden ${
                    resultImage ? "checkerboard" : "bg-gray-100"
                  }`}
                >
                  {resultImage ? (
                    <img
                      src={resultImage}
                      alt="Result"
                      className="w-full h-auto"
                    />
                  ) : isProcessing ? (
                    <div className="aspect-square flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center">
                      <p className="text-gray-400 text-sm">等待处理</p>
                    </div>
                  )}
                </div>
                {resultImage && (
                  <p className="text-sm text-gray-600 mt-2">
                    文件大小: {formatFileSize(resultSize)}
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              {!resultImage ? (
                <button
                  onClick={handleRemoveBackground}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      去除背景
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  下载 PNG
                </button>
              )}

              <button
                onClick={handleReset}
                className="px-8 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                处理新图片
              </button>
            </div>

            {/* Tips */}
            <p className="text-center text-sm text-gray-600">
              💡 处理后的图片为透明背景 PNG 格式
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>隐私保护：图片仅在服务器处理，不存储，不分享</p>
        </div>
      </footer>
    </div>
  );
}
