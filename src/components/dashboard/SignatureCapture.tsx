import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, RotateCcw, Check } from 'lucide-react';

interface SignatureCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureComplete: (signatureData: string) => void;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  isOpen,
  onClose,
  onSignatureComplete,
}) => {
  const [activeTab, setActiveTab] = useState('draw');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const signatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleSaveDrawnSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData = signatureRef.current.toDataURL();
      onSignatureComplete(signatureData);
      onClose();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUploadedSignature = () => {
    if (uploadedImage) {
      onSignatureComplete(uploadedImage);
      onClose();
    }
  };

  const handleClose = () => {
    clearSignature();
    setUploadedImage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Signature</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">Draw Signature</TabsTrigger>
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 400,
                      height: 200,
                      className: 'signature-canvas w-full h-full',
                    }}
                    backgroundColor="white"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Sign above using your mouse or finger
                </p>
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearSignature} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button onClick={handleSaveDrawnSignature} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Save Signature
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedImage ? (
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded signature" 
                      className="max-h-32 mx-auto"
                    />
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload signature image
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, or GIF
                      </p>
                    </div>
                  )}
                </div>
                
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
            
            <Button 
              onClick={handleSaveUploadedSignature} 
              disabled={!uploadedImage}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Use This Signature
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};