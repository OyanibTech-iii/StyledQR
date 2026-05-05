"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling, {
  Options,
  DrawType,
  DotType,
  CornerSquareType,
  CornerDotType,
  FileExtension
} from "qr-code-styling";

const QRCodeGenerator = () => {
  const [options, setOptions] = useState<Options>({
    width: 300,
    height: 300,
    type: 'canvas' as DrawType,
    data: "https://google.com",
    image: "",
    dotsOptions: {
      color: "#000000",
      type: "rounded" as DotType
    },
    backgroundOptions: {
      color: "#ffffff",
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
      imageSize: 0.4,
      hideBackgroundDots: true
    }
  });

  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadCooldown, setDownloadCooldown] = useState(0);

  const handleShorten = async () => {
    if (!options.data || !String(options.data).startsWith('http')) {
      setShortenError("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    setIsShortening(true);
    setShortenError("");
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: options.data }),
      });
      const data = await response.json();
      if (data.shortUrl) {
        setOptions(prev => ({ ...prev, data: data.shortUrl }));
      } else {
        setShortenError(data.error || "Failed to shorten URL");
      }
    } catch {
      setShortenError("An error occurred. Please try again.");
    } finally {
      setIsShortening(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(String(options.data) || "");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  useEffect(() => {
    if (!qrCodeRef.current) {
      const qr = new QRCodeStyling({
        ...options,
        width: 300,
        height: 300
      });
      qrCodeRef.current = qr;
      if (ref.current) {
        ref.current.innerHTML = "";
        qr.append(ref.current);
      }
    } else {
      qrCodeRef.current.update(options);
    }
  }, [options]);

  const onDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      data: event.target.value
    }));
  };

  const onColorChange = (event: React.ChangeEvent<HTMLInputElement>, target: string) => {
    const value = event.target.value;
    setOptions((prev) => {
      const newOptions = { ...prev };
      if (target === 'dots') newOptions.dotsOptions = { ...prev.dotsOptions, color: value };
      if (target === 'background') newOptions.backgroundOptions = { ...prev.backgroundOptions, color: value };
      if (target === 'cornersSquare') newOptions.cornersSquareOptions = { ...prev.cornersSquareOptions, color: value };
      if (target === 'cornersDot') newOptions.cornersDotOptions = { ...prev.cornersDotOptions, color: value };
      return newOptions;
    });
  };

  const onStyleChange = (event: React.ChangeEvent<HTMLSelectElement>, target: string) => {
    const value = event.target.value;
    setOptions((prev) => {
      const newOptions = { ...prev };
      if (target === 'dots') newOptions.dotsOptions = { ...prev.dotsOptions, type: value as DotType };
      if (target === 'cornersSquare') newOptions.cornersSquareOptions = { ...prev.cornersSquareOptions, type: value as CornerSquareType };
      if (target === 'cornersDot') newOptions.cornersDotOptions = { ...prev.cornersDotOptions, type: value as CornerDotType };
      return newOptions;
    });
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      image: event.target.value
    }));
  };

  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
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

  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const onImageOptionsChange = (event: React.ChangeEvent<HTMLInputElement>, target: string) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : parseFloat(event.target.value);
    setOptions((prev) => ({
      ...prev,
      imageOptions: {
        ...prev.imageOptions,
        [target]: value
      }
    }));
  };

  const onDownloadClick = () => {
    if (!qrCodeRef.current || downloadCooldown > 0) return;
    
    qrCodeRef.current.download({
      extension: "png" as FileExtension
    });

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

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
      {/* Settings Side */}
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Customize QR Code</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">QR Content (URL or Text)</label>
              {options.data && String(options.data).startsWith('http') && !String(options.data).includes('tinyurl.com') && (
                <button 
                  onClick={handleShorten}
                  disabled={isShortening}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isShortening ? "Shortening..." : "Shorten URL"}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={options.data}
                onChange={onDataChange}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:text-white pr-10"
                placeholder="https://example.com"
              />
              {options.data && (
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  title="Copy to clipboard"
                >
                  {copySuccess ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  )}
                </button>
              )}
            </div>
            {shortenError && <p className="mt-1 text-xs text-red-500">{shortenError}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Dots Style</label>
              <select
                onChange={(e) => onStyleChange(e, 'dots')}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md dark:bg-zinc-800 dark:text-white"
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
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Dots Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={options.dotsOptions?.color}
                  onChange={(e) => onColorChange(e, 'dots')}
                  className="h-10 w-12 border-none p-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={options.dotsOptions?.color}
                  onChange={(e) => onColorChange(e, 'dots')}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Corner Square Style</label>
              <select
                onChange={(e) => onStyleChange(e, 'cornersSquare')}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md dark:bg-zinc-800 dark:text-white"
                value={options.cornersSquareOptions?.type}
              >
                <option value="square">Square</option>
                <option value="dot">Dot</option>
                <option value="extra-rounded">Extra Rounded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Corner Square Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={options.cornersSquareOptions?.color}
                  onChange={(e) => onColorChange(e, 'cornersSquare')}
                  className="h-10 w-12 border-none p-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={options.cornersSquareOptions?.color}
                  onChange={(e) => onColorChange(e, 'cornersSquare')}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Corner Dot Style</label>
              <select
                onChange={(e) => onStyleChange(e, 'cornersDot')}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md dark:bg-zinc-800 dark:text-white"
                value={options.cornersDotOptions?.type}
              >
                <option value="square">Square</option>
                <option value="dot">Dot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Corner Dot Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={options.cornersDotOptions?.color}
                  onChange={(e) => onColorChange(e, 'cornersDot')}
                  className="h-10 w-12 border-none p-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={options.cornersDotOptions?.color}
                  onChange={(e) => onColorChange(e, 'cornersDot')}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={options.backgroundOptions?.color}
                onChange={(e) => onColorChange(e, 'background')}
                className="h-10 w-12 border-none p-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={options.backgroundOptions?.color}
                onChange={(e) => onColorChange(e, 'background')}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Logo Options</h3>
              {options.image && (
                <button 
                  onClick={() => {
                    setOptions(prev => ({ ...prev, image: "" }));
                    setFileName("");
                  }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                >
                  Clear Logo
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Logo Image URL</label>
                <input
                  type="text"
                  value={options.image}
                  onChange={onImageChange}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:text-white"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">OR</span>
                  <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                </div>
                
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`
                    relative group cursor-pointer
                    border-2 border-dashed rounded-lg p-4 
                    transition-all duration-200 ease-in-out
                    flex flex-col items-center justify-center gap-2
                    ${isDragging 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
                    }
                  `}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />
                  <div className={`
                    p-2 rounded-full transition-colors
                    ${isDragging ? "bg-blue-100 dark:bg-blue-800" : "bg-zinc-100 dark:bg-zinc-700 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-600"}
                  `}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDragging ? "text-blue-600" : "text-zinc-500"}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                      {isDragging 
                        ? "Drop image here" 
                        : fileName 
                          ? `Selected: ${fileName}` 
                          : "Click or drag logo image"
                      }
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                      {fileName ? "Click to change" : "PNG, JPG, SVG up to 5MB"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Logo Size ({Math.round((options.imageOptions?.imageSize || 0.4) * 100)}%)</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={options.imageOptions?.imageSize}
                  onChange={(e) => onImageOptionsChange(e, 'imageSize')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Logo Margin ({options.imageOptions?.margin}px)</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={options.imageOptions?.margin}
                  onChange={(e) => onImageOptionsChange(e, 'margin')}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hideDots"
                checked={options.imageOptions?.hideBackgroundDots}
                onChange={(e) => onImageOptionsChange(e, 'hideBackgroundDots')}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="hideDots" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Hide Dots Behind Logo
              </label>
            </div>
          </div>
        </div>
      </div>


      {/* Preview Side */}
      <div className="lg:w-96 flex flex-col items-center justify-start gap-6 p-6 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white text-center w-full">Live Preview</h3>
        <div className="relative bg-white p-2 rounded-lg shadow-inner flex items-center justify-center overflow-hidden border border-zinc-200" style={{ width: '318px', height: '318px' }}>
          <div 
            ref={ref} 
            className="flex items-center justify-center"
            style={{ width: '300px', height: '300px' }}
          />
        </div>
        <button
          onClick={onDownloadClick}
          disabled={downloadCooldown > 0}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {downloadCooldown > 0 ? `Wait ${downloadCooldown}s...` : "Download PNG"}
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
