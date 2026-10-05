"use client";

import React, { useRef } from "react";
import { FaImage } from "react-icons/fa";
import { compressImage } from "@/utils/imageCompressor";
import { logger } from "@/utils/logger";

const ACCENTS = {
  blue: { tile: "bg-blue-50", text: "text-[#3A76F0]" },
  purple: { tile: "bg-purple-50", text: "text-[#CB30E0]" },
} as const;

interface Props {
  /** The current image as a data URL, or an empty string. */
  value?: string;
  /** Called with the compressed image data URL, or "" when the image is removed. */
  onChange: (imageUrl: string) => void;
  accent?: keyof typeof ACCENTS;
}

/** Optional event image picker with drag and drop. Images are compressed before use. */
export const EventImageUpload: React.FC<Props> = ({ value, onChange, accent = "blue" }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = ACCENTS[accent];

  const accept = (file?: File) => {
    if (!file) return;
    compressImage(file)
      .then(onChange)
      .catch((err) => logger.error("Compression failed:", err));
  };

  const overlayButton =
    "text-xs font-bold px-4 py-2 rounded-full shadow transition-all active:scale-95 cursor-pointer";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-600">Upload Event Image (optional)</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          accept(e.dataTransfer.files?.[0]);
        }}
        onClick={() => {
          if (!value) inputRef.current?.click();
        }}
        className={`relative bg-white border-2 border-dashed border-gray-250/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors shadow-sm ${
          value ? "h-64 border-solid" : "p-6 hover:bg-gray-50/55"
        }`}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={(e) => accept(e.target.files?.[0])}
          accept="image/*"
          className="hidden"
        />
        {value ? (
          <div className="relative w-full h-full group">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL preview */}
            <img src={value} alt="Event Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className={`bg-white/95 hover:bg-white text-gray-800 ${overlayButton}`}
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className={`bg-red-500 hover:bg-red-600 text-white ${overlayButton}`}
              >
                Remove Image
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`w-12 h-12 ${colors.tile} rounded-2xl flex items-center justify-center mb-3`}>
              <FaImage className={`w-6 h-6 ${colors.text}`} />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Drag and drop image file, or <span className={`${colors.text} hover:underline`}>Upload File</span>
            </p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Supports PNG, JPG, JPEG (Max file size: 5MB)</p>
          </>
        )}
      </div>
    </div>
  );
};
