import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCardDesigns } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';
import { X, Check, Edit } from 'lucide-react';

interface CardDesignGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (designId: string) => void;
  selectedDesignId?: string;
}

export function CardDesignGallery({ isOpen, onClose, onSelect, selectedDesignId }: CardDesignGalleryProps) {
  const navigate = useNavigate();
  const sdk = useSDK();
  const cardDesigns = useCardDesigns(sdk.cardDesigns);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      cardDesigns.reloadDesigns();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-900">Select Card Design</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cardDesigns.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          )}

          {cardDesigns.error && (
            <Alert variant="error" className="mb-4">
              {cardDesigns.error}
            </Alert>
          )}

          {!cardDesigns.isLoading && cardDesigns.designs.length === 0 && (
            <Alert variant="info" className="text-center">
              No card designs available. Please contact support to add designs.
            </Alert>
          )}

          {cardDesigns.designs.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cardDesigns.designs.map((design) => {
                const isSelected = selectedDesignId === design.id;
                const isHovered = hoveredId === design.id;

                return (
                  <Card
                    key={design.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-slate-900 ring-offset-2'
                        : isHovered
                        ? 'ring-2 ring-slate-300'
                        : ''
                    }`}
                    onMouseEnter={() => setHoveredId(design.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onSelect(design.id)}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-slate-100">
                      <img
                        src={design.thumbnailUrl}
                        alt={design.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600"%3E%3Crect fill="%23e2e8f0" width="400" height="600"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="18"%3E' +
                            encodeURIComponent(design.name) +
                            '%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                          <div className="rounded-full bg-slate-900 p-2">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">{design.name}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/template-builder/${design.id}`);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedDesignId && (
            <Button onClick={() => onSelect(selectedDesignId)}>Confirm Selection</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

