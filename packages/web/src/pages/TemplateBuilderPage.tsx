import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents, getTransform, resolveElementContent } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import { ArrowLeft, Save, Trash2, Eye, Type, QrCode, Image, Upload } from 'lucide-react';
import type { TemplateElement, TemplateConfig } from '@inviteme/shared';

export function TemplateBuilderPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const sdk = useSDK();
  const events = useEvents(sdk.events);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState<'text' | 'qr' | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, size: 0 });
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Helper to get full image URL
  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    // If it's a relative path, use the API URL (backend serves static files)
    return `${apiUrl}${url}`;
  };

  const currentEvent = eventId ? events.getEventById(eventId) : null;

  // Load events when component mounts
  useEffect(() => {
    if (eventId && !currentEvent && !events.isLoading) {
      events.reloadEvents();
    }
  }, [eventId, currentEvent, events]);

  // Load saved design when event data is available
  useEffect(() => {
    if (currentEvent) {
      // Only set image URL if we don't have one or it's different
      if (currentEvent.cardDesignImageUrl && currentEvent.cardDesignImageUrl !== imageUrl) {
        setImageUrl(currentEvent.cardDesignImageUrl);
      }
      
      // Only set template config if we don't have one or it's different from what we have
      if (currentEvent.cardTemplateConfig) {
        const savedConfigStr = JSON.stringify(currentEvent.cardTemplateConfig);
        const currentConfigStr = templateConfig ? JSON.stringify(templateConfig) : '';
        if (savedConfigStr !== currentConfigStr) {
          setTemplateConfig(currentEvent.cardTemplateConfig);
        }
      } else if (currentEvent.cardDesignImageUrl && !templateConfig) {
        // Initialize empty template config if image exists but no config
        setTemplateConfig({
          version: '1.0',
          baseImage: currentEvent.cardDesignImageUrl,
          elements: [],
        });
      } else if (!currentEvent.cardDesignImageUrl && !templateConfig) {
        // No image yet, initialize empty
        setTemplateConfig({
          version: '1.0',
          baseImage: '',
          elements: [],
        });
      }
    }
  }, [currentEvent?.id, currentEvent?.cardDesignImageUrl, currentEvent?.cardTemplateConfig]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't place if we're dragging or resizing
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      return;
    }
    
    if (!isPlacing || !canvasRef.current || !templateConfig || !imageUrl) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if element type already exists
    const existingElement = templateConfig.elements.find(el => el.type === isPlacing);
    
    if (existingElement) {
      // Update existing element position
      updateElement(existingElement.id, { position: { x, y, anchor: 'center' } });
      setSelectedElement(existingElement.id);
    } else {
      // Create new element
      const newElement: TemplateElement = {
        id: `element-${Date.now()}`,
        type: isPlacing,
        field: isPlacing === 'text' ? 'guest.name' : 'verificationUrl',
        position: { x, y, anchor: 'center' },
        style: {
          fontFamily: 'Arial',
          fontSize: isPlacing === 'text' ? 50 : undefined,
          fontWeight: 'bold',
          color: '#000000',
          textAlign: 'center',
          size: isPlacing === 'qr' ? 200 : undefined,
        },
        dynamic: true,
      };

      setTemplateConfig({
        ...templateConfig,
        elements: [...templateConfig.elements, newElement],
      });
      setSelectedElement(newElement.id);
    }
    
    setIsPlacing(null);
  };

  const handleElementMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvasRef.current || !templateConfig) return;
    
    const element = templateConfig.elements.find(el => el.id === elementId);
    if (!element) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setDragStart({
      x: startX,
      y: startY,
      elementX: element.position.x,
      elementY: element.position.y,
    });
    setIsDragging(true);
    setSelectedElement(elementId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && !isResizing) return;
    if (!canvasRef.current || !templateConfig || !selectedElement) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (isDragging) {
      const deltaX = ((currentX - dragStart.x) / rect.width) * 100;
      const deltaY = ((currentY - dragStart.y) / rect.height) * 100;
      
      const newX = Math.max(0, Math.min(100, dragStart.elementX + deltaX));
      const newY = Math.max(0, Math.min(100, dragStart.elementY + deltaY));
      
      updateElement(selectedElement, { position: { x: newX, y: newY, anchor: templateConfig.elements.find(el => el.id === selectedElement)?.position.anchor || 'center' } });
    } else if (isResizing) {
      const element = templateConfig.elements.find(el => el.id === selectedElement);
      if (!element || element.type !== 'qr') return;
      
      const deltaX = currentX - resizeStart.x;
      const deltaY = currentY - resizeStart.y;
      const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
      const newSize = Math.max(50, Math.min(500, resizeStart.size + (deltaX > 0 ? delta : -delta)));
      
      updateElement(selectedElement, { style: { ...element.style, size: newSize } });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!templateConfig) return;
    
    const element = templateConfig.elements.find(el => el.id === elementId);
    if (!element || element.type !== 'qr') return;
    
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      size: element.style.size || 200,
    });
    setIsResizing(true);
    setSelectedElement(elementId);
  };

  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  };

  const handleDeleteElement = (elementId: string) => {
    if (!templateConfig) return;
    setTemplateConfig({
      ...templateConfig,
      elements: templateConfig.elements.filter(el => el.id !== elementId),
    });
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  const updateElement = (elementId: string, updates: Partial<TemplateElement>) => {
    if (!templateConfig) return;
    setTemplateConfig({
      ...templateConfig,
      elements: templateConfig.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success && data.data?.url) {
        const uploadedUrl = data.data.url;
        console.log('Upload successful, URL:', uploadedUrl);
        setImageUrl(uploadedUrl);
        if (templateConfig) {
          setTemplateConfig({
            ...templateConfig,
            baseImage: uploadedUrl,
          });
        }
      } else {
        console.error('Upload failed:', data);
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!eventId || !templateConfig || !imageUrl) {
      alert('Please upload an image and configure placement before saving.');
      return;
    }

    const updated = await events.updateEvent(eventId, {
      cardDesignImageUrl: imageUrl,
      cardTemplateConfig: templateConfig as any,
    });
    
    if (updated) {
      // Reload events to get updated data
      await events.reloadEvents();
      console.log('Design saved, events reloaded. Updated event:', updated);
      alert('Card design saved successfully!');
      // Navigate back to guests page to see the preview
      navigate(`/events/${eventId}`);
    } else {
      alert('Failed to save: ' + (events.error || 'Unknown error'));
    }
  };


  const selectedElementData = templateConfig?.elements.find(el => el.id === selectedElement);

  // Sample data for preview
  const previewData = {
    guest: { name: 'John Doe', type: 'Single', code: '12345' },
    event: {
      groomName: 'George Sechu',
      brideName: 'Violet Macha',
      date: 'Saturday, 15 November 2025',
      churchName: 'St. Raphael Parish',
      churchAddress: '558 Kanisani Rd, Dar es Salaam',
      churchTime: '9:00 AM',
      receptionName: 'White Sands Hotel',
      receptionAddress: 'Africana Road, Dar es Salaam',
      receptionTime: '11:00 PM',
    },
    verificationUrl: 'http://46.62.209.58/c/12345',
  };

  const renderPreviewContent = (element: TemplateElement): string => {
    if (!element.dynamic) return element.content || '';
    if (element.type === 'qr') return 'QR';

    // Use SDK utility for resolving content
    // Create a minimal render context for preview
    const renderContext: any = {
      imageWidth: 1,
      imageHeight: 1,
      displayWidth: 1,
      displayHeight: 1,
      ...previewData, // Spread preview data so fields are accessible
    };
    return resolveElementContent(element, renderContext);
  };

  if (!eventId || !currentEvent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert variant="error">Event not found</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Card Design Setup</h1>
              <p className="text-sm text-slate-600">{currentEvent.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={handleSave} disabled={!imageUrl || !templateConfig}>
              <Save className="mr-2 h-4 w-4" />
              Save Design
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Design</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </>
                  )}
                </Button>
                {imageUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-2">Current image:</p>
                    <img
                      src={getImageUrl(imageUrl)}
                      alt="Preview"
                      className="w-full h-32 object-contain rounded border border-slate-200"
                      onError={(e) => {
                        console.error('Preview image load error:', {
                          imageUrl,
                          fullUrl: getImageUrl(imageUrl),
                        });
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Upload a JPG, PNG, or WebP image (max 10MB)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Place Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsPlacing(isPlacing === 'text' ? null : 'text')}
                  disabled={!imageUrl}
                >
                  <Type className="mr-2 h-4 w-4" />
                  Place Guest Name
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsPlacing(isPlacing === 'qr' ? null : 'qr')}
                  disabled={!imageUrl}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Place QR Code
                </Button>
                {isPlacing && (
                  <Alert variant="info" className="text-sm">
                    Click on the image to place {isPlacing === 'text' ? 'guest name' : 'QR code'}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {selectedElementData && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Element</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedElementData.type === 'text' && (
                    <>
                      {selectedElementData.type === 'text' && (
                        <Alert variant="info" className="text-sm">
                          This element will display the guest's name.
                        </Alert>
                      )}
                      <div className="space-y-2">
                        <Label>Font Family</Label>
                        <Select
                          value={selectedElementData.style.fontFamily || 'Arial'}
                          onChange={(e) =>
                            updateElement(selectedElementData.id, {
                              style: { ...selectedElementData.style, fontFamily: e.target.value },
                            })
                          }
                        >
                          <option value="Arial">Arial</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Playfair Display">Playfair Display</option>
                          <option value="Roboto">Roboto</option>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Font Size</Label>
                          <Input
                            type="number"
                            value={selectedElementData.style.fontSize || 24}
                            onChange={(e) =>
                              updateElement(selectedElementData.id, {
                                style: {
                                  ...selectedElementData.style,
                                  fontSize: parseInt(e.target.value) || 24,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Font Weight</Label>
                          <Select
                            value={selectedElementData.style.fontWeight || 'normal'}
                            onChange={(e) =>
                              updateElement(selectedElementData.id, {
                                style: {
                                  ...selectedElementData.style,
                                  fontWeight: e.target.value as any,
                                },
                              })
                            }
                          >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="lighter">Light</option>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <Input
                          type="color"
                          value={selectedElementData.style.color || '#000000'}
                          onChange={(e) =>
                            updateElement(selectedElementData.id, {
                              style: { ...selectedElementData.style, color: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Text Align</Label>
                        <Select
                          value={selectedElementData.style.textAlign || 'center'}
                          onChange={(e) =>
                            updateElement(selectedElementData.id, {
                              style: {
                                ...selectedElementData.style,
                                textAlign: e.target.value as any,
                              },
                            })
                          }
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedElementData.type === 'qr' && (
                    <div className="space-y-2">
                      <Label>QR Code Size</Label>
                      <Input
                        type="number"
                        value={selectedElementData.style.size || 200}
                        onChange={(e) =>
                          updateElement(selectedElementData.id, {
                            style: {
                              ...selectedElementData.style,
                              size: parseInt(e.target.value) || 200,
                            },
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>X Position (%)</Label>
                      <Input
                        type="number"
                        value={selectedElementData.position.x.toFixed(1)}
                        onChange={(e) =>
                          updateElement(selectedElementData.id, {
                            position: {
                              ...selectedElementData.position,
                              x: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y Position (%)</Label>
                      <Input
                        type="number"
                        value={selectedElementData.position.y.toFixed(1)}
                        onChange={(e) =>
                          updateElement(selectedElementData.id, {
                            position: {
                              ...selectedElementData.position,
                              y: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Anchor</Label>
                    <Select
                      value={selectedElementData.position.anchor || 'center'}
                      onChange={(e) =>
                        updateElement(selectedElementData.id, {
                          position: {
                            ...selectedElementData.position,
                            anchor: e.target.value as any,
                          },
                        })
                      }
                    >
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </Select>
                  </div>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDeleteElement(selectedElementData.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Element
                  </Button>
                </CardContent>
              </Card>
            )}

            {templateConfig && templateConfig.elements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Elements ({templateConfig.elements.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {templateConfig.elements.map((el) => (
                      <div
                        key={el.id}
                        className={`flex items-center justify-between rounded p-2 cursor-pointer ${
                          selectedElement === el.id
                            ? 'bg-slate-200'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                        onClick={() => setSelectedElement(el.id)}
                      >
                        <div className="flex items-center gap-2">
                          {el.type === 'text' ? (
                            <Type className="h-4 w-4" />
                          ) : (
                            <QrCode className="h-4 w-4" />
                          )}
                          <span className="text-sm">{el.field || 'Static'}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement(el.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <div
                  ref={canvasRef}
                  className="relative bg-slate-100 cursor-crosshair"
                  style={{ aspectRatio: '2/3', maxHeight: '90vh' }}
                  onClick={handleCanvasClick}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {imageUrl ? (
                    <img
                      src={getImageUrl(imageUrl)}
                      alt="Card design"
                      className="w-full h-full object-contain"
                      draggable={false}
                      onError={() => {
                        const fullUrl = getImageUrl(imageUrl);
                        console.error('Image load error:', {
                          imageUrl,
                          fullUrl,
                          apiUrl,
                        });
                        alert(`Failed to load image from: ${fullUrl}\n\nPlease check:\n1. Server is running on ${apiUrl}\n2. File exists at ${imageUrl}\n3. Static file serving is configured`);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', getImageUrl(imageUrl));
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Image className="mx-auto mb-2 h-12 w-12" />
                        <p>Upload an image above to get started</p>
                      </div>
                    </div>
                  )}

                  {/* Render elements */}
                  {templateConfig?.elements.map((element) => {
                    const textAlign = element.type === 'text' ? element.style.textAlign || 'center' : undefined;
                    const anchor = element.position.anchor || 'center';
                    
                    // Calculate position based on alignment
                    let left = `${element.position.x}%`;
                    // QR codes should always be centered, regardless of text alignment
                    let transform = element.type === 'qr' 
                      ? getTransform(anchor, 'center') 
                      : getTransform(anchor, textAlign);
                    
                    // For centered text, x is the center point
                    // For left-aligned, x is the left edge
                    // For right-aligned, x is the right edge
                    
                    const baseStyle: React.CSSProperties = {
                      position: 'absolute',
                      left,
                      top: `${element.position.y}%`,
                      transform,
                      pointerEvents: 'none',
                      zIndex: 10,
                    };

                    if (element.type === 'text') {
                      const content = previewMode
                        ? renderPreviewContent(element)
                        : element.field || 'Text';
                      return (
                        <div
                          key={element.id}
                          ref={(el) => {
                            if (el) elementRefs.current.set(element.id, el);
                            else elementRefs.current.delete(element.id);
                          }}
                          style={{
                            ...baseStyle,
                            fontFamily: element.style.fontFamily || 'Arial',
                            fontSize: `${element.style.fontSize || 24}px`,
                            fontWeight: element.style.fontWeight || 'normal',
                            color: element.style.color || '#000000',
                            textAlign: textAlign as any,
                            cursor: isDragging ? 'grabbing' : 'grab',
                            pointerEvents: 'auto',
                            userSelect: 'none',
                            backgroundColor:
                              selectedElement === element.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            border:
                              selectedElement === element.id ? '2px solid #3b82f6' : '1px dashed #94a3b8',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseDown={(e) => handleElementMouseDown(element.id, e)}
                          onClick={(e) => {
                            if (!isDragging) handleElementClick(element.id, e);
                          }}
                        >
                          {content}
                        </div>
                      );
                    } else {
                      // QR code placeholder with resize handle
                      const size = element.style.size || 200;
                      // Ensure minimum size for visibility - use a larger minimum
                      const minSize = 120;
                      const actualSize = Math.max(size, minSize);
                      
                      return (
                        <div
                          key={element.id}
                          ref={(el) => {
                            if (el) elementRefs.current.set(element.id, el);
                            else elementRefs.current.delete(element.id);
                          }}
                          style={{
                            ...baseStyle,
                            width: `${actualSize}px`,
                            height: `${actualSize}px`,
                            minWidth: `${minSize}px`,
                            minHeight: `${minSize}px`,
                            cursor: isDragging ? 'grabbing' : 'grab',
                            pointerEvents: 'auto',
                            userSelect: 'none',
                            backgroundColor:
                              selectedElement === element.id
                                ? 'rgba(59, 130, 246, 0.4)'
                                : 'rgba(255, 255, 255, 1)',
                            border:
                              selectedElement === element.id 
                                ? '3px solid #3b82f6' 
                                : '3px dashed #64748b',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: selectedElement === element.id ? '#1e40af' : '#475569',
                            position: 'absolute',
                            boxShadow: selectedElement === element.id 
                              ? '0 4px 8px rgba(59, 130, 246, 0.4)' 
                              : '0 2px 6px rgba(0, 0, 0, 0.2)',
                            zIndex: selectedElement === element.id ? 20 : 10,
                          }}
                          onMouseDown={(e) => {
                            // Check if clicking on resize handle
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const clickY = e.clientY - rect.top;
                            const handleSize = 16;
                            
                            // Bottom-right corner resize handle
                            if (clickX > actualSize - handleSize && clickY > actualSize - handleSize) {
                              handleResizeMouseDown(element.id, e);
                            } else {
                              handleElementMouseDown(element.id, e);
                            }
                          }}
                          onClick={(e) => {
                            if (!isDragging && !isResizing) handleElementClick(element.id, e);
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '6px',
                            pointerEvents: 'none',
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                          }}>
                            <QrCode size={Math.min(actualSize * 0.4, 80)} strokeWidth={2.5} />
                            <span style={{ 
                              fontSize: Math.min(actualSize * 0.08, 14),
                              fontWeight: 'bold',
                              textAlign: 'center',
                            }}>
                              {previewMode ? 'QR Code' : 'QR Code'}
                            </span>
                          </div>
                          {selectedElement === element.id && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#3b82f6',
                                border: '2px solid white',
                                borderRadius: '3px',
                                cursor: 'nwse-resize',
                                pointerEvents: 'auto',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleResizeMouseDown(element.id, e);
                              }}
                            />
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// getTransform is now imported from @inviteme/shared

