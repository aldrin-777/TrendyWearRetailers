"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { FiX } from "react-icons/fi";
import { getCroppedImageBlob } from "@/lib/getCroppedImageBlob";

type Props = {
  imageSrc: string;
  fileName: string;
  onClose: () => void;
  onApply: (file: File) => void;
};

export function ProductImageCropModal({
  imageSrc,
  fileName,
  onClose,
  onApply,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      const base =
        fileName.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "_") || "image";
      const file = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
      onApply(file);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-[#1C1D21]">Crop & rotate</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
            aria-label="Close"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="relative h-[min(55vh,320px)] w-full bg-[#1a1a1a]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#C1121F]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Rotate (°)
            </label>
            <input
              type="range"
              min={0}
              max={360}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-[#C1121F]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !croppedAreaPixels}
              onClick={handleApply}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#C1121F] text-white hover:bg-red-800 disabled:opacity-50"
            >
              {busy ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
