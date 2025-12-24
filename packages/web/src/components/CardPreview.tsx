import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { TemplateConfig, Guest } from '@inviteme/shared';
import { calculateElementPosition, calculateScaledStyles, resolveElementContent, getVerificationUrl } from '@inviteme/shared';

interface CardPreviewProps {
  baseImageUrl: string;
  templateConfig: TemplateConfig;
  guest: Guest;
  verificationUrl: string;
}

export function CardPreview({ baseImageUrl, templateConfig, guest, verificationUrl }: CardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${apiUrl}${url}`;
  };

  // Load image and get dimensions
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.onerror = () => {
      setError('Failed to load image');
    };
    img.src = getImageUrl(baseImageUrl);
  }, [baseImageUrl, apiUrl]);

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!imageLoaded) {
    return <div className="p-4">Loading preview...</div>;
  }

  // Calculate aspect ratio for responsive sizing
  const aspectRatio = imageSize.width / imageSize.height;
  const maxWidth = 600;
  const displayWidth = Math.min(maxWidth, imageSize.width);
  const displayHeight = displayWidth / aspectRatio;

  // Create render context
  const renderContext = {
    imageWidth: imageSize.width,
    imageHeight: imageSize.height,
    displayWidth,
    displayHeight,
    guest,
    verificationUrl: verificationUrl || getVerificationUrl(guest.code),
  };

  return (
    <div 
      ref={containerRef}
      className="relative inline-block bg-slate-100"
      style={{ 
        width: `${displayWidth}px`, 
        height: `${displayHeight}px`, 
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Base Image */}
      <img
        src={getImageUrl(baseImageUrl)}
        alt="Card preview"
        style={{ 
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          display: 'block',
          zIndex: 1,
          objectFit: 'contain',
          objectPosition: 'top left',
        }}
      />
      
      {/* Overlay Elements */}
      {templateConfig.elements.map((element) => {
        const position = calculateElementPosition(element, renderContext);
        const scaledStyles = calculateScaledStyles(element, renderContext);
        
        if (element.type === 'text') {
          const text = resolveElementContent(element, renderContext);
          
          const fontSize = scaledStyles.displayFontSize || element.style?.fontSize || 24;
          const fontFamily = element.style?.fontFamily || 'Arial';
          const fontWeight = element.style?.fontWeight || 'normal';
          const color = element.style?.color || '#000000';
          const textAlign = element.style?.textAlign || 'center';

          return (
            <div
              key={element.id}
              style={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                transform: position.transform,
                fontSize: `${fontSize}px`,
                fontFamily,
                fontWeight,
                color,
                textAlign: textAlign as any,
                whiteSpace: 'nowrap',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              {text}
            </div>
          );
        } else if (element.type === 'qr') {
          const size = element.style?.size || 200;
          const displaySize = scaledStyles.displaySize || Math.max(80, size * (displayWidth / imageSize.width));
          
          console.log('Rendering QR code:', {
            elementId: element.id,
            position,
            size,
            displaySize,
            imageSize,
            displayWidth,
            verificationUrl: renderContext.verificationUrl,
          });

          return (
            <div
              key={element.id}
              style={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                transform: position.transform,
                width: `${displaySize}px`,
                height: `${displaySize}px`,
                minWidth: `${displaySize}px`,
                minHeight: `${displaySize}px`,
                backgroundColor: 'white',
                padding: '4px',
                borderRadius: '4px',
                border: '2px solid #3b82f6',
                zIndex: 10,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              }}
            >
              <QRCodeSVG
                value={renderContext.verificationUrl}
                size={Math.max(72, displaySize - 8)} // Account for padding, ensure minimum
                level="L"
                includeMargin={false}
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

