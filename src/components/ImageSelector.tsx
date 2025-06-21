import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageSelectorProps {
  src: string;
  alt: string;
  isSelectionMode: boolean;
  onSelectionComplete: (selection: SelectionArea, croppedImage: string) => void;
  children?: React.ReactNode;
}

export function ImageSelector({ src, alt, isSelectionMode, onSelectionComplete, children }: ImageSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] = useState<SelectionArea | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getRelativePosition = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isSelectionMode) return;

    e.preventDefault();
    const pos = getRelativePosition(e);
    setStartPos(pos);
    setIsSelecting(true);
    setCurrentSelection(null);
  }, [isSelectionMode, getRelativePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !isSelectionMode) return;

    const currentPos = getRelativePosition(e);
    const selection: SelectionArea = {
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y),
    };

    setCurrentSelection(selection);
  }, [isSelecting, isSelectionMode, startPos, getRelativePosition]);

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || !currentSelection || !isSelectionMode) return;

    setIsSelecting(false);

    // Only process selections with meaningful size
    if (currentSelection.width < 10 || currentSelection.height < 10) {
      setCurrentSelection(null);
      return;
    }

    // Create cropped image
    try {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Create a temporary image to get actual dimensions
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // Calculate the actual displayed image dimensions within the container
        const imageAspectRatio = img.naturalWidth / img.naturalHeight;
        const containerAspectRatio = containerRect.width / containerRect.height;

        let displayedWidth, displayedHeight, offsetX, offsetY;

        if (imageAspectRatio > containerAspectRatio) {
          // Image is wider - fits to container width
          displayedWidth = containerRect.width;
          displayedHeight = containerRect.width / imageAspectRatio;
          offsetX = 0;
          offsetY = (containerRect.height - displayedHeight) / 2;
        } else {
          // Image is taller - fits to container height
          displayedWidth = containerRect.height * imageAspectRatio;
          displayedHeight = containerRect.height;
          offsetX = (containerRect.width - displayedWidth) / 2;
          offsetY = 0;
        }

        // Adjust selection coordinates to account for the image offset
        const adjustedSelection = {
          x: Math.max(0, currentSelection.x - offsetX),
          y: Math.max(0, currentSelection.y - offsetY),
          width: currentSelection.width,
          height: currentSelection.height,
        };

        // Clamp selection to displayed image bounds
        adjustedSelection.x = Math.min(adjustedSelection.x, displayedWidth);
        adjustedSelection.y = Math.min(adjustedSelection.y, displayedHeight);
        adjustedSelection.width = Math.min(adjustedSelection.width, displayedWidth - adjustedSelection.x);
        adjustedSelection.height = Math.min(adjustedSelection.height, displayedHeight - adjustedSelection.y);

        // Calculate scale factors based on displayed dimensions
        const scaleX = img.naturalWidth / displayedWidth;
        const scaleY = img.naturalHeight / displayedHeight;

        // Calculate actual crop area in image coordinates
        const cropArea = {
          x: adjustedSelection.x * scaleX,
          y: adjustedSelection.y * scaleY,
          width: adjustedSelection.width * scaleX,
          height: adjustedSelection.height * scaleY,
        };

        // Debug logging
        console.log('ImageSelector Debug:', {
          containerRect,
          naturalDimensions: { width: img.naturalWidth, height: img.naturalHeight },
          displayedDimensions: { displayedWidth, displayedHeight },
          offsets: { offsetX, offsetY },
          originalSelection: currentSelection,
          adjustedSelection,
          scales: { scaleX, scaleY },
          cropArea,
        });

        // Set canvas size to crop area
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw cropped portion
        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, cropArea.width, cropArea.height
        );

        // Convert to data URL
        const croppedDataUrl = canvas.toDataURL('image/png');
        console.log('ImageSelector generated cropped image:', {
          dataUrlLength: croppedDataUrl.length,
          dataUrlPreview: croppedDataUrl.substring(0, 50) + '...',
          cropArea,
          adjustedSelection
        });
        onSelectionComplete(currentSelection, croppedDataUrl);
      };

      img.src = src;
    } catch (error) {
      console.error('Error creating cropped image:', error);
    }

    setCurrentSelection(null);
  }, [isSelecting, currentSelection, isSelectionMode, src, onSelectionComplete]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className={`relative w-full h-full ${isSelectionMode ? 'cursor-crosshair select-none' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          draggable={false}
        />

        {/* Selection overlay */}
        {currentSelection && isSelectionMode && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
            style={{
              left: currentSelection.x,
              top: currentSelection.y,
              width: currentSelection.width,
              height: currentSelection.height,
            }}
          />
        )}

        {children}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}