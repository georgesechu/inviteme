/**
 * Template and card generation utilities
 * This module contains all the logic for template calculations, positioning, and rendering
 * that can be shared between web and mobile applications.
 */

import type { TemplateConfig, TemplateElement, Guest } from '../types';

export interface ElementPosition {
  left: string; // CSS value (percentage or pixels)
  top: string; // CSS value (percentage or pixels)
  transform: string; // CSS transform
}

export interface ElementStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  size?: number; // For QR codes
}

export interface ScaledElementStyle extends ElementStyle {
  displayFontSize?: number;
  displaySize?: number;
}

export interface RenderContext {
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  guest?: Guest;
  verificationUrl?: string;
}

/**
 * Calculate CSS transform based on anchor point and text alignment
 */
export function getTransform(anchor?: string, textAlign?: string): string {
  // For centered text, we want the x position to be the center
  if (textAlign === 'center') {
    switch (anchor) {
      case 'left':
        return 'translateY(-50%)';
      case 'right':
        return 'translateY(-50%)';
      case 'top':
        return 'translateX(-50%)';
      case 'bottom':
        return 'translate(-50%, -100%)';
      default:
        return 'translate(-50%, -50%)';
    }
  }
  
  // For left/right aligned text, x is the edge
  switch (anchor) {
    case 'left':
      return 'translateY(-50%)';
    case 'right':
      return 'translate(-100%, -50%)';
    case 'top':
      return textAlign === 'left' ? 'translateY(0)' : textAlign === 'right' ? 'translate(-100%, 0)' : 'translateX(-50%)';
    case 'bottom':
      return textAlign === 'left' ? 'translateY(-100%)' : textAlign === 'right' ? 'translate(-100%, -100%)' : 'translate(-50%, -100%)';
    default:
      return textAlign === 'left' ? 'translateY(-50%)' : textAlign === 'right' ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)';
  }
}

/**
 * Calculate element position for rendering
 */
export function calculateElementPosition(
  element: TemplateElement,
  _context?: RenderContext // Context is reserved for future use (e.g., responsive scaling)
): ElementPosition {
  const anchor = element.position.anchor || 'center';
  const textAlign = element.type === 'text' ? element.style.textAlign || 'center' : undefined;
  
  // Position is already in percentage (0-100)
  const x = element.position.x;
  const y = element.position.y;
  
  // Calculate transform based on anchor and alignment
  const transform = element.type === 'qr' 
    ? getTransform(anchor, 'center') 
    : getTransform(anchor, textAlign);
  
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform,
  };
}

/**
 * Calculate scaled styles for an element based on display size
 */
export function calculateScaledStyles(
  element: TemplateElement,
  context: RenderContext
): ScaledElementStyle {
  const scale = context.displayWidth / context.imageWidth;
  const baseStyle = element.style || {};
  
  const scaled: ScaledElementStyle = { ...baseStyle };
  
  if (element.type === 'text' && baseStyle.fontSize) {
    scaled.displayFontSize = baseStyle.fontSize * scale;
  }
  
  if (element.type === 'qr' && baseStyle.size) {
    scaled.displaySize = Math.max(80, baseStyle.size * scale);
  }
  
  return scaled;
}

/**
 * Resolve dynamic field values (e.g., 'guest.name' -> actual guest name)
 */
export function resolveElementContent(
  element: TemplateElement,
  context: RenderContext
): string {
  if (!element.dynamic || !element.field) {
    return element.content || '';
  }
  
  // Handle nested field paths like 'guest.name'
  const fieldPath = element.field.split('.');
  let value: any = context;
  
  for (const part of fieldPath) {
    value = value?.[part];
    if (value === undefined || value === null) {
      break;
    }
  }
  
  return value?.toString() || element.field;
}

/**
 * Get verification URL for a guest
 */
export function getVerificationUrl(code: string, baseUrl: string = 'http://46.62.209.58'): string {
  return `${baseUrl}/c/${code}`;
}

/**
 * Calculate minimum display size for an element
 */
export function getMinimumDisplaySize(element: TemplateElement, context: RenderContext): number {
  if (element.type === 'qr') {
    const size = element.style?.size || 200;
    const scale = context.displayWidth / context.imageWidth;
    return Math.max(80, size * scale);
  }
  // For non-QR elements, return 0 (no minimum size requirement)
  return 0;
}

/**
 * Validate template configuration
 */
export function validateTemplateConfig(config: TemplateConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.baseImage) {
    errors.push('Base image is required');
  }
  
  if (!config.elements || config.elements.length === 0) {
    errors.push('At least one element is required');
  }
  
  config.elements?.forEach((element, index) => {
    if (element.position.x < 0 || element.position.x > 100) {
      errors.push(`Element ${index}: X position must be between 0 and 100`);
    }
    if (element.position.y < 0 || element.position.y > 100) {
      errors.push(`Element ${index}: Y position must be between 0 and 100`);
    }
    if (element.type === 'text' && !element.field && !element.content) {
      errors.push(`Element ${index}: Text element must have either field or content`);
    }
    if (element.type === 'qr' && (!element.style?.size || element.style.size < 50)) {
      errors.push(`Element ${index}: QR code must have a size of at least 50px`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a default template configuration
 */
export function createDefaultTemplateConfig(baseImageUrl: string): TemplateConfig {
  return {
    version: '1.0',
    baseImage: baseImageUrl,
    elements: [],
  };
}

/**
 * Create a default text element
 */
export function createDefaultTextElement(
  x: number,
  y: number,
  field: string = 'guest.name'
): TemplateElement {
  return {
    id: `element-${Date.now()}`,
    type: 'text',
    field,
    position: { x, y, anchor: 'center' },
    style: {
      fontFamily: 'Arial',
      fontSize: 50,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
    },
    dynamic: true,
  };
}

/**
 * Create a default QR code element
 */
export function createDefaultQRElement(
  x: number,
  y: number,
  size: number = 200
): TemplateElement {
  return {
    id: `element-${Date.now()}`,
    type: 'qr',
    field: 'verificationUrl',
    position: { x, y, anchor: 'center' },
    style: {
      size,
    },
    dynamic: true,
  };
}

