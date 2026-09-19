"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling, {
  Options,
  DrawType,
  DotType,
  CornerSquareType,
  CornerDotType,
  FileExtension,
  ShapeType
} from "qr-code-styling";

export type QRShape = "square" | "circle" | "rounded";

function isLikelyUrl(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (/^https?:\/\//i.test(trimmed)) return true;
  return /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed) || /^www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(trimmed);
}

const DEFAULT_OPTIONS: Options = {
  width: 400,
  height: 400,
  margin: 10,
  type: "canvas" as DrawType,
  shape: "square" as ShapeType,
  data: "https://styledqr.onrender.com",
  image: "",
  dotsOptions: {
    color: "#000000",
    type: "rounded" as DotType
  },
  backgroundOptions: {
    color: "#ffffff",
    round: 0
  },
  cornersSquareOptions: {
    color: "#000000",
    type: "extra-rounded" as CornerSquareType
  },
  cornersDotOptions: {
    color: "#000000",
    type: "dot" as CornerDotType
  },
  imageOptions: {
    crossOrigin: "anonymous",
    margin: 10,
    imageSize: 0.35,
    hideBackgroundDots: true
  }
};

const COLOR_PRESETS = [
  { name: "Classic", dot: "#000000", square: "#000000", cornerDot: "#000000", bg: "#ffffff" },
  { name: "Indigo", dot: "#3b82f6", square: "#1d4ed8", cornerDot: "#2563eb", bg: "#ffffff" },
  { name: "Emerald", dot: "#10b981", square: "#047857", cornerDot: "#059669", bg: "#ffffff" },
  { name: "Violet", dot: "#8b5cf6", square: "#6d28d9", cornerDot: "#7c3aed", bg: "#ffffff" },
  { name: "Rose", dot: "#f43f5e", square: "#be123c", cornerDot: "#e11d48", bg: "#ffffff" },
  { name: "Night", dot: "#f4f4f5", square: "#e4e4e7", cornerDot: "#38bdf8", bg: "#18181b" }
];

const SHAPE_OPTIONS: { id: QRShape; name: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "square",
    name: "Square",
    description: "Classic full-coverage QR matrix",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    )
  },
  {
    id: "circle",
    name: "Circle",
    description: "Circular dot matrix and silhouette",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  },
  {
    id: "rounded",
    name: "Rounded",
    description: "iOS-style squircle with smooth corners",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="6" />
      </svg>
    )
  }
];

function getCssClipPath(shape: QRShape): string {
  switch (shape) {
    case "circle":
      return "circle(50% at 50% 50%)";
    default:
      return "none";
  }
}

function clipCanvasToShape(
  ctx: CanvasRenderingContext2D,
  shape: QRShape,
  width: number,
  height: number
) {
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
  } else if (shape === "rounded") {
    const r = width * 0.16;
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, width, height, r);
    } else {
      ctx.moveTo(r, 0);
      ctx.lineTo(width - r, 0);
      ctx.quadraticCurveTo(width, 0, width, r);
      ctx.lineTo(width, height - r);
      ctx.quadraticCurveTo(width, height, width - r, height);
      ctx.lineTo(r, height);
      ctx.quadraticCurveTo(0, height, 0, height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
    }
  } else {
    ctx.rect(0, 0, width, height);
  }
  ctx.closePath();
  ctx.clip();
}

export default function QRCodeGenerator() {
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const [qrShape, setQrShape] = useState<QRShape>("square");
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState("");
  const [shortenSuccess, setShortenSuccess] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadCooldown, setDownloadCooldown] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [isDraggingOverPreview, setIsDraggingOverPreview] = useState(false);

  useEffect(() => {
    if (!qrCodeRef.current) {
      const qr = new QRCodeStyling({
        ...options,
        width: 400,
        height: 400
      });
      qrCodeRef.current = qr;
      if (ref.current) {
        ref.current.innerHTML = "";
        qr.append(ref.current);
      }
    } else {
      qrCodeRef.current.update({
        ...options,
        width: 400,
        height: 400
      });
    }
  }, [options]);

  const handleShapeChange = (newShape: QRShape) => {
    setQrShape(newShape);
    setOptions((prev) => {
      const isCircle = newShape === "circle";
      const margin = newShape === "rounded" ? 14 : 10;
      const round = newShape === "circle" ? 1 : newShape === "rounded" ? 0.25 : 0;

      return {
        ...prev,
        shape: isCircle ? ("circle" as ShapeType) : ("square" as ShapeType),
        margin,
        backgroundOptions: {
          ...prev.backgroundOptions,
          round
        }
      };
    });
  };

  const handleUndoShorten = () => {
    if (originalUrl) {
      setOptions((prev) => ({ ...prev, data: originalUrl }));
      setOriginalUrl(null);
      setShortenSuccess(null);
      setShortenError("");
    }
  };

  const handleShorten = async () => {
    const raw = String(options.data || "").trim();
    if (!raw) {
      setShortenError("Please enter a URL to shorten");
      return;
    }

    // Auto-normalize protocol
    const targetUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    try {
      const parsed = new URL(targetUrl);
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        setShortenError("Please enter a valid web domain (e.g. example.com)");
        return;
      }
    } catch {
      setShortenError("Invalid URL format. Please check the address.");
      return;
    }

    setIsShortening(true);
    setShortenError("");
    setShortenSuccess(null);

    // 1. Primary: Server API route (Parallel race: TinyURL, CleanURI, da.gd, clck.ru, Spoo.me, is.gd)
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
        signal: AbortSignal.timeout(6000)
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.shortUrl) {
        setOriginalUrl(raw);
        setOptions((prev) => ({ ...prev, data: data.shortUrl }));
        setShortenSuccess(`Shortened via ${data.provider || "service"}`);
        setIsShortening(false);
        return;
      } else if (data.error && response.status < 500) {
        setShortenError(data.error);
        setIsShortening(false);
        return;
      }
    } catch {
      // Server timed out or network error; fall through to direct client-side fallback
    }

    // 2. Client-side fallback: da.gd (Fast open shortener with CORS)
    try {
      const res = await fetch(`https://da.gd/s?url=${encodeURIComponent(targetUrl)}`, {
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const short = (await res.text()).trim();
        if (short && short.startsWith("http")) {
          setOriginalUrl(raw);
          setOptions((prev) => ({ ...prev, data: short }));
          setShortenSuccess("Shortened via da.gd");
          setIsShortening(false);
          return;
        }
      }
    } catch {
      // Fall through to next fallback
    }

    // 3. Client-side fallback: clck.ru (Global shortener with CORS)
    try {
      const res = await fetch(`https://clck.ru/--?url=${encodeURIComponent(targetUrl)}`, {
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const short = (await res.text()).trim();
        if (short && short.startsWith("http")) {
          setOriginalUrl(raw);
          setOptions((prev) => ({ ...prev, data: short }));
          setShortenSuccess("Shortened via clck.ru");
          setIsShortening(false);
          return;
        }
      }
    } catch {
      // Fallback failed
    }

    setShortenError("Could not reach shortening services. Please check your connection or try again.");
    setIsShortening(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(String(options.data) || "");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const onDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setOptions((prev) => ({
      ...prev,
      data: val
    }));
    if (shortenError) setShortenError("");
    if (shortenSuccess) {
      setShortenSuccess(null);
      setOriginalUrl(null);
    }
  };

  const onColorChange = (value: string, target: "dots" | "background" | "cornersSquare" | "cornersDot") => {
    setOptions((prev) => {
      const newOptions = { ...prev };
      if (target === "dots") newOptions.dotsOptions = { ...prev.dotsOptions, color: value };
      if (target === "background") newOptions.backgroundOptions = { ...prev.backgroundOptions, color: value };
      if (target === "cornersSquare") newOptions.cornersSquareOptions = { ...prev.cornersSquareOptions, color: value };
      if (target === "cornersDot") newOptions.cornersDotOptions = { ...prev.cornersDotOptions, color: value };
      return newOptions;
    });
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setOptions((prev) => ({
      ...prev,
      backgroundOptions: { ...prev.backgroundOptions, color: preset.bg },
      dotsOptions: { ...prev.dotsOptions, color: preset.dot },
      cornersSquareOptions: { ...prev.cornersSquareOptions, color: preset.square },
      cornersDotOptions: { ...prev.cornersDotOptions, color: preset.cornerDot }
    }));
  };

  const onStyleChange = (event: React.ChangeEvent<HTMLSelectElement>, target: "dots" | "cornersSquare" | "cornersDot") => {
    const value = event.target.value;
    setOptions((prev) => {
      const newOptions = { ...prev };
      if (target === "dots") newOptions.dotsOptions = { ...prev.dotsOptions, type: value as DotType };
      if (target === "cornersSquare") newOptions.cornersSquareOptions = { ...prev.cornersSquareOptions, type: value as CornerSquareType };
      if (target === "cornersDot") newOptions.cornersDotOptions = { ...prev.cornersDotOptions, type: value as CornerDotType };
      return newOptions;
    });
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOptions((prev) => ({
          ...prev,
          image: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverPreview(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverPreview(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverPreview(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      image: event.target.value
    }));
  };

  const onImageOptionsChange = (event: React.ChangeEvent<HTMLInputElement>, target: string) => {
    const value = event.target.type === "checkbox" ? event.target.checked : parseFloat(event.target.value);
    setOptions((prev) => ({
      ...prev,
      imageOptions: {
        ...prev.imageOptions,
        [target]: value
      }
    }));
  };

  const triggerCooldown = () => {
    setDownloadCooldown(2);
    const timer = setInterval(() => {
      setDownloadCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDownload = (ext: FileExtension = "png") => {
    if (!qrCodeRef.current || downloadCooldown > 0) return;

    if (ext === "png" && qrShape !== "square") {
      // Export custom shaped canvas with transparent background
      const canvas = ref.current?.querySelector("canvas");
      if (canvas) {
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const ctx = exportCanvas.getContext("2d");
        if (ctx) {
          ctx.save();
          clipCanvasToShape(ctx, qrShape, canvas.width, canvas.height);
          ctx.drawImage(canvas, 0, 0);
          ctx.restore();

          exportCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `custom-qr-${qrShape}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }, "image/png");

          triggerCooldown();
          return;
        }
      }
    }

    // Standard download
    qrCodeRef.current.download({
      name: `custom-qr-${qrShape}`,
      extension: ext
    });
    triggerCooldown();
  };

  const clearLogo = () => {
    setOptions((prev) => ({ ...prev, image: "" }));
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetToDefaults = () => {
    setQrShape("square");
    setOptions(DEFAULT_OPTIONS);
    setFileName("");
    setShortenError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      {/* LEFT SIDE: Compact Customize QR Code Controls */}
      <div className="lg:col-span-5 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Customize QR Code</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Configure shape, style, colors & logo</p>
          </div>
          <button
            onClick={resetToDefaults}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-2.5 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* 1. Shape Selection Feature (Square, Circle, Rounded) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              QR Shape
            </label>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 capitalize">
              {qrShape}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {SHAPE_OPTIONS.map((shape) => {
              const isSelected = qrShape === shape.id;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => handleShapeChange(shape.id)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer text-center
                    ${isSelected
                      ? "border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs ring-2 ring-blue-500/20"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }
                  `}
                >
                  <div className="mb-1.5">{shape.icon}</div>
                  <span className="text-xs font-semibold">{shape.name}</span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 line-clamp-1 mt-0.5">{shape.id === "square" ? "Classic" : shape.id === "circle" ? "Circular" : "Squircle"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Content Input */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              QR Content (URL or Text)
            </label>
            {originalUrl && shortenSuccess ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {shortenSuccess}
                </span>
                <button
                  type="button"
                  onClick={handleUndoShorten}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline cursor-pointer"
                  title="Revert to original full URL"
                >
                  Undo
                </button>
              </div>
            ) : isLikelyUrl(String(options.data || "")) ? (
              <button
                type="button"
                onClick={handleShorten}
                disabled={isShortening}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline disabled:opacity-50 cursor-pointer transition-colors"
                title="Shorten URL to reduce QR code density for easier scanning"
              >
                {isShortening ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Shortening...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Shorten URL
                  </>
                )}
              </button>
            ) : null}
          </div>
          <div className="relative">
            <input
              type="text"
              value={options.data}
              onChange={onDataChange}
              className="w-full pl-3 pr-10 py-2 text-sm border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:bg-zinc-800/60 dark:text-white transition-all"
              placeholder="https://example.com/your-page-link"
            />
            {options.data && (
              <button
                onClick={handleCopy}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Copy to clipboard"
              >
                {copySuccess ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
              </button>
            )}
          </div>
          {shortenError && (
            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {shortenError}
            </p>
          )}
          {originalUrl && shortenSuccess && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1">
              <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Reduced from {originalUrl.length} to {String(options.data || "").length} characters. Simpler QR code is easier to scan!
            </p>
          )}
        </div>

        {/* 3. Shape Styles Grid */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Dots & Pattern Style
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Dots Style</label>
              <select
                onChange={(e) => onStyleChange(e, "dots")}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700/80 rounded-lg dark:bg-zinc-800/60 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                value={options.dotsOptions?.type}
              >
                <option value="rounded">Rounded</option>
                <option value="dots">Dots</option>
                <option value="classy">Classy</option>
                <option value="classy-rounded">Classy Rounded</option>
                <option value="square">Square</option>
                <option value="extra-rounded">Extra Rounded</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Corner Square</label>
              <select
                onChange={(e) => onStyleChange(e, "cornersSquare")}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700/80 rounded-lg dark:bg-zinc-800/60 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                value={options.cornersSquareOptions?.type}
              >
                <option value="extra-rounded">Extra Rounded</option>
                <option value="square">Square</option>
                <option value="dot">Dot</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Corner Dot</label>
              <select
                onChange={(e) => onStyleChange(e, "cornersDot")}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700/80 rounded-lg dark:bg-zinc-800/60 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                value={options.cornersDotOptions?.type}
              >
                <option value="dot">Dot</option>
                <option value="square">Square</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Color Controls */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Colors & Background
            </span>
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 transition-transform hover:scale-110 shadow-xs cursor-pointer"
                  style={{ backgroundColor: p.dot }}
                  title={`${p.name} palette`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Dots Color */}
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Dots Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={options.dotsOptions?.color}
                  onChange={(e) => onColorChange(e.target.value, "dots")}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                />
                <input
                  type="text"
                  value={options.dotsOptions?.color}
                  onChange={(e) => onColorChange(e.target.value, "dots")}
                  className="flex-1 min-w-0 px-2 py-1 text-xs uppercase font-mono border border-zinc-200 dark:border-zinc-700 rounded-md dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Corner Square Color */}
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Corner Square</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={options.cornersSquareOptions?.color}
                  onChange={(e) => onColorChange(e.target.value, "cornersSquare")}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                />
                <input
                  type="text"
                  value={options.cornersSquareOptions?.color}
                  onChange={(e) => onColorChange(e.target.value, "cornersSquare")}
                  className="flex-1 min-w-0 px-2 py-1 text-xs uppercase font-mono border border-zinc-200 dark:border-zinc-700 rounded-md dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Corner Dot Color */}
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Corner Dot</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={options.cornersDotOptions?.color}
                  onChange={(e) => onColorChange(e.target.value, "cornersDot")}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                />
                <input
                  type="text"
                  value={options.cornersDotOptions?.color}
                  onChange={(e) => onColorChange(e.target.value, "cornersDot")}
                  className="flex-1 min-w-0 px-2 py-1 text-xs uppercase font-mono border border-zinc-200 dark:border-zinc-700 rounded-md dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={options.backgroundOptions?.color}
                  onChange={(e) => onColorChange(e.target.value, "background")}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                />
                <input
                  type="text"
                  value={options.backgroundOptions?.color}
                  onChange={(e) => onColorChange(e.target.value, "background")}
                  className="flex-1 min-w-0 px-2 py-1 text-xs uppercase font-mono border border-zinc-200 dark:border-zinc-700 rounded-md dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Logo Options */}
        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Logo Options
            </span>
            {options.image && (
              <button
                onClick={clearLogo}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear Logo
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Logo Image URL
            </label>
            <input
              type="text"
              value={options.image}
              onChange={onImageChange}
              className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:bg-zinc-800/60 dark:text-white transition-all"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                <span>Logo Size</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {Math.round((options.imageOptions?.imageSize || 0.35) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={options.imageOptions?.imageSize}
                onChange={(e) => onImageOptionsChange(e, "imageSize")}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                <span>Logo Margin</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {options.imageOptions?.margin}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={options.imageOptions?.margin}
                onChange={(e) => onImageOptionsChange(e, "margin")}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="hideDots"
              checked={options.imageOptions?.hideBackgroundDots}
              onChange={(e) => onImageOptionsChange(e, "hideBackgroundDots")}
              className="w-3.5 h-3.5 text-blue-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="hideDots" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              Hide Dots Behind Logo
            </label>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Bigger Live Preview & Drag and Drop */}
      <div className="lg:col-span-7 w-full">
        <div className="lg:sticky lg:top-8 w-full flex flex-col items-center gap-5">
          <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl p-6 sm:p-8 flex flex-col items-center">
          {/* Header with Shape Badge */}
          <div className="w-full flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Live Preview</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-full capitalize">
                {qrShape}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                400 × 400
              </span>
            </div>
          </div>

          {/* Big QR Code Canvas with Shape Mask & Drag & Drop Overlay */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative w-full max-w-[430px] aspect-square rounded-2xl p-4 sm:p-5
              bg-zinc-50 dark:bg-zinc-950 border-2 transition-all duration-200
              flex items-center justify-center overflow-hidden
              ${isDraggingOverPreview
                ? "border-blue-500 ring-4 ring-blue-500/20 shadow-2xl scale-[1.01]"
                : "border-zinc-200/80 dark:border-zinc-800 shadow-inner"
              }
            `}
          >
            {/* The QR Canvas wrapper clipped to selected shape */}
            <div
              className={`
                w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300
                ${qrShape === "rounded" ? "rounded-3xl" : ""}
              `}
              style={{ clipPath: getCssClipPath(qrShape) }}
            >
              <div
                ref={ref}
                className="w-full h-full flex items-center justify-center [&_canvas]:max-w-full [&_canvas]:h-auto [&_canvas]:shadow-xs [&_svg]:max-w-full [&_svg]:h-auto transition-all"
              />
            </div>

            {/* Shape Outline Frame SVG Overlay for Circle / Rounded */}
            {qrShape !== "square" && (
              <svg
                viewBox="0 0 400 400"
                className="absolute inset-4 sm:inset-5 w-[calc(100%-2rem)] sm:w-[calc(100%-2.5rem)] h-[calc(100%-2rem)] sm:h-[calc(100%-2.5rem)] pointer-events-none z-10"
              >
                {qrShape === "circle" && (
                  <circle cx="200" cy="200" r="198" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-300 dark:text-zinc-700 opacity-60" />
                )}
                {qrShape === "rounded" && (
                  <rect x="2" y="2" width="396" height="396" rx="64" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-300 dark:text-zinc-700 opacity-60" />
                )}
              </svg>
            )}

            {/* Hover / Drag Overlay on the Live Preview */}
            {isDraggingOverPreview && (
              <div className="absolute inset-0 z-20 bg-blue-600/90 dark:bg-blue-600/95 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-150">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3 animate-bounce">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p className="text-base font-bold">Drop Logo Here</p>
                <p className="text-xs text-blue-100 mt-0.5">Embeds automatically inside QR</p>
              </div>
            )}
          </div>

          {/* Dedicated Drag and Drop Zone below the preview */}
          <div className="w-full max-w-[430px] mt-5">
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                cursor-pointer border-2 border-dashed rounded-xl p-3.5
                transition-all duration-200 flex items-center justify-between gap-3
                ${isDraggingOverPreview
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                  : "border-zinc-300 dark:border-zinc-700/80 hover:border-blue-400 dark:hover:border-blue-500 bg-zinc-50/70 dark:bg-zinc-800/40"
                }
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                {options.image ? (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={options.image} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                    {options.image
                      ? (fileName ? `Logo: ${fileName}` : "Custom Logo Active")
                      : "Drag & Drop Logo Image Here"}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {options.image ? "Click to replace logo" : "or click to browse (PNG, SVG, JPG)"}
                  </p>
                </div>
              </div>

              {options.image && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearLogo();
                  }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                  title="Remove logo"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Download and Export Buttons */}
          <div className="w-full max-w-[430px] grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => handleDownload("png")}
              disabled={downloadCooldown > 0}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {downloadCooldown > 0 ? `Wait ${downloadCooldown}s` : "Download PNG"}
            </button>

            <button
              onClick={() => handleDownload("svg")}
              disabled={downloadCooldown > 0}
              className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Download SVG
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
