import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { ArrowLeft, Save, Trash2, Eye, Type, QrCode, Image } from 'lucide-react';
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
          size: isPlacing === 'qr' ? 300 : undefined,
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
      alert('Card design saved successfully!');
      // Don't navigate away, stay on the page so user can continue editing
    } else {
      alert('Failed to save: ' + (events.error || 'Unknown error'));
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    if (templateConfig) {
      setTemplateConfig({
        ...templateConfig,
        baseImage: url,
      });
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
    
    const field = element.field || '';
    const parts = field.split('.');
    let value: any = previewData;
    for (const part of parts) {
      value = value?.[part];
    }
    return value?.toString() || field;
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
                <Label>Image URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/your-card-design.jpg"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Enter the URL of your card design image. Make sure it's publicly accessible.
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
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Card design"
                      className="w-full h-full object-contain"
                      draggable={false}
                      onError={() => {
                        alert('Failed to load image. Please check the URL.');
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Image className="mx-auto mb-2 h-12 w-12" />
                        <p>Enter an image URL above to get started</p>
                      </div>
                    </div>
                  )}

                  {/* Render elements */}
                  {templateConfig?.elements.map((element) => {
                    const style: React.CSSProperties = {
                      position: 'absolute',
                      left: `${element.position.x}%`,
                      top: `${element.position.y}%`,
                      transform: getTransform(element.position.anchor),
                      pointerEvents: 'none',
                    };

                    if (element.type === 'text') {
                      const content = previewMode
                        ? renderPreviewContent(element)
                        : element.field || 'Text';
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...style,
                            fontFamily: element.style.fontFamily || 'Arial',
                            fontSize: `${element.style.fontSize || 24}px`,
                            fontWeight: element.style.fontWeight || 'normal',
                            color: element.style.color || '#000000',
                            textAlign: element.style.textAlign || 'center',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            backgroundColor:
                              selectedElement === element.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            border:
                              selectedElement === element.id ? '2px solid #3b82f6' : '1px dashed #94a3b8',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            minWidth: '100px',
                          }}
                          onClick={(e) => handleElementClick(element.id, e)}
                        >
                          {content}
                        </div>
                      );
                    } else {
                      // QR code placeholder
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...style,
                            width: `${element.style.size || 200}px`,
                            height: `${element.style.size || 200}px`,
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            backgroundColor:
                              selectedElement === element.id
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(255, 255, 255, 0.8)',
                            border:
                              selectedElement === element.id ? '2px solid #3b82f6' : '1px dashed #94a3b8',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: '#666',
                          }}
                          onClick={(e) => handleElementClick(element.id, e)}
                        >
                          {previewMode ? 'QR Code' : 'QR'}
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

function getTransform(anchor?: string): string {
  switch (anchor) {
    case 'left':
      return 'translateY(-50%)';
    case 'right':
      return 'translate(-100%, -50%)';
    case 'top':
      return 'translateX(-50%)';
    case 'bottom':
      return 'translate(-50%, -100%)';
    default:
      return 'translate(-50%, -50%)';
  }
}

