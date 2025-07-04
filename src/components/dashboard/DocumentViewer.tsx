import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Share2, PenTool, Save, Users, Type, Calendar, FileText, User, Building, AlertCircle, Download } from 'lucide-react';
import { SignatureCapture } from './SignatureCapture';
import { FieldInputDialog } from './FieldInputDialog';
import { generatePDFWithFields } from '@/utils/pdfGenerator';

interface SignatureField {
  id?: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  signer_email: string;
  page_number: number;
  field_type: 'signature' | 'date' | 'text' | 'name' | 'initials' | 'company';
  is_required: boolean;
  signature_data?: string;
}

const fieldTypes = [
  { value: 'signature', label: 'Signature', icon: PenTool, color: 'bg-blue-500' },
  { value: 'initials', label: 'Initials', icon: Type, color: 'bg-green-500' },
  { value: 'name', label: 'Full Name', icon: User, color: 'bg-purple-500' },
  { value: 'date', label: 'Date', icon: Calendar, color: 'bg-orange-500' },
  { value: 'text', label: 'Text Field', icon: FileText, color: 'bg-gray-500' },
  { value: 'company', label: 'Company', icon: Building, color: 'bg-indigo-500' },
];

export const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [selectedFieldType, setSelectedFieldType] = useState<string>('signature');
  const [isAddingField, setIsAddingField] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');
  const [showSignatureCapture, setShowSignatureCapture] = useState(false);
  const [showFieldInputDialog, setShowFieldInputDialog] = useState(false);
  const [pendingSignaturePosition, setPendingSignaturePosition] = useState<{ x: number; y: number; page: number } | null>(null);
  const [pendingFieldPosition, setPendingFieldPosition] = useState<{ x: number; y: number; page: number } | null>(null);
  const [draggingField, setDraggingField] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pdfPageCount, setPdfPageCount] = useState<number>(1);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Fetch document details
  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch signature fields
  const { data: existingFields } = useQuery({
    queryKey: ['signature-fields', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signature_fields')
        .select('*')
        .eq('document_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Get PDF URL with better error handling - use signed URL for private bucket
  useEffect(() => {
    if (document?.file_path) {
      const getPdfUrl = async () => {
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(document.file_path, 3600); // 1 hour expiry
          
          if (error) {
            console.error('Error getting signed URL:', error);
            setPdfError('Failed to load PDF file: ' + error.message);
            return;
          }
          
          console.log('PDF URL:', data.signedUrl);
          setPdfUrl(data.signedUrl);
          setPdfError('');
        } catch (error) {
          console.error('Error getting PDF URL:', error);
          setPdfError('Failed to load PDF file');
        }
      };
      
      getPdfUrl();
    }
  }, [document]);

  // Load existing signature fields
  useEffect(() => {
    if (existingFields) {
      setSignatureFields(existingFields.map(field => ({
        ...field,
        field_type: field.field_type as SignatureField['field_type'],
        signature_data: (field as any).signature_data || undefined
      })));
    }
  }, [existingFields]);

  // Detect PDF page count when iframe loads
  useEffect(() => {
    if (iframeLoaded && iframeRef.current) {
      const iframe = iframeRef.current;
      
      // Try to detect page count from PDF viewer
      const detectPageCount = () => {
        try {
          // This is a rough estimation - in a real app you might use a PDF parsing library
          // For now, we'll estimate based on content height
          const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDocument) {
            const body = iframeDocument.body;
            if (body) {
              const totalHeight = body.scrollHeight;
              const viewportHeight = body.clientHeight;
              const estimatedPages = Math.max(1, Math.ceil(totalHeight / viewportHeight));
              console.log('Estimated page count:', estimatedPages);
              setPdfPageCount(Math.min(estimatedPages, 20)); // Cap at 20 pages for safety
            }
          }
        } catch (error) {
          console.warn('Could not detect page count:', error);
          setPdfPageCount(10); // Default fallback
        }
      };

      // Delay detection to allow PDF to fully load
      setTimeout(detectPageCount, 2000);
    }
  }, [iframeLoaded]);

  // Save signature fields mutation
  const saveFieldsMutation = useMutation({
    mutationFn: async (fields: SignatureField[]) => {
      await supabase
        .from('signature_fields')
        .delete()
        .eq('document_id', id);

      if (fields.length > 0) {
        const { error } = await supabase
          .from('signature_fields')
          .insert(
            fields.map(field => ({
              document_id: id,
              signer_email: field.signer_email,
              x_position: field.x_position,
              y_position: field.y_position,
              width: field.width,
              height: field.height,
              page_number: field.page_number,
              field_type: field.field_type,
              is_required: field.is_required,
              signature_data: field.signature_data,
            }))
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Fields Saved',
        description: 'The signature fields have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['signature-fields', id] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save signature fields.',
        variant: 'destructive',
      });
    },
  });

  // Improved page detection based on click position and scroll state
  const detectClickedPage = (clickY: number, containerRect: DOMRect): number => {
    try {
      let scrollTop = 0;
      
      // Try to get scroll position from iframe
      if (iframeRef.current?.contentWindow) {
        scrollTop = iframeRef.current.contentWindow.pageYOffset || 0;
      }
      
      // Calculate total position considering scroll
      const totalClickPosition = scrollTop + clickY;
      const containerHeight = containerRect.height;
      
      // Estimate page height (PDF pages are typically around 800-1200px in height when rendered)
      const estimatedPageHeight = Math.max(800, containerHeight);
      
      // Calculate which page based on position
      const pageNumber = Math.floor(totalClickPosition / estimatedPageHeight) + 1;
      
      // Ensure page number is within valid range
      const detectedPage = Math.max(1, Math.min(pageNumber, pdfPageCount));
      
      console.log('Page detection:', {
        clickY,
        scrollTop,
        totalClickPosition,
        estimatedPageHeight,
        pageNumber,
        detectedPage,
        pdfPageCount
      });
      
      return detectedPage;
    } catch (error) {
      console.warn('Error detecting page:', error);
      return 1; // Default to page 1 if detection fails
    }
  };

  const handlePdfClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingField || !newSignerEmail.trim()) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Calculate relative position as percentage
    const x = (clickX / rect.width) * 100;
    const y = (clickY / rect.height) * 100;
    
    // Detect which page was clicked
    const detectedPage = detectClickedPage(clickY, rect);

    console.log('PDF clicked:', { 
      clickX, 
      clickY, 
      x: Math.round(x), 
      y: Math.round(y), 
      detectedPage,
      rectWidth: rect.width,
      rectHeight: rect.height
    });

    if (selectedFieldType === 'signature') {
      setPendingSignaturePosition({ x, y, page: detectedPage });
      setShowSignatureCapture(true);
    } else {
      setPendingFieldPosition({ x, y, page: detectedPage });
      setShowFieldInputDialog(true);
    }
  };

  const addField = (x: number, y: number, page: number, fieldData?: string) => {
    const fieldWidth = selectedFieldType === 'signature' ? 150 : 
                      selectedFieldType === 'initials' ? 80 : 120;
    const fieldHeight = selectedFieldType === 'signature' ? 50 : 30;

    const newField: SignatureField = {
      x_position: x,
      y_position: y,
      width: fieldWidth,
      height: fieldHeight,
      signer_email: newSignerEmail.trim(),
      page_number: page,
      field_type: selectedFieldType as SignatureField['field_type'],
      is_required: true,
      signature_data: fieldData,
    };

    console.log('Adding field:', newField);
    setSignatureFields([...signatureFields, newField]);
    setIsAddingField(false);
  };

  const handleSignatureComplete = (signatureData: string) => {
    if (pendingSignaturePosition) {
      addField(pendingSignaturePosition.x, pendingSignaturePosition.y, pendingSignaturePosition.page, signatureData);
      setPendingSignaturePosition(null);
    }
  };

  const handleFieldInputComplete = (value: string) => {
    if (pendingFieldPosition) {
      addField(pendingFieldPosition.x, pendingFieldPosition.y, pendingFieldPosition.page, value);
      setPendingFieldPosition(null);
    }
  };

  const removeField = (index: number) => {
    setSignatureFields(signatureFields.filter((_, i) => i !== index));
  };

  const saveFields = () => {
    saveFieldsMutation.mutate(signatureFields);
  };

  const getFieldDisplayInfo = (fieldType: string) => {
    return fieldTypes.find(f => f.value === fieldType) || fieldTypes[0];
  };

  const handleFieldMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (parentRect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setDraggingField(index);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingField !== null) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
      
      const updatedFields = [...signatureFields];
      updatedFields[draggingField] = {
        ...updatedFields[draggingField],
        x_position: Math.max(0, Math.min(100 - (updatedFields[draggingField].width / 8), x)),
        y_position: Math.max(0, Math.min(100 - (updatedFields[draggingField].height / 6), y)),
      };
      setSignatureFields(updatedFields);
    }
  };

  const handleMouseUp = () => {
    setDraggingField(null);
  };

  const downloadDocument = async () => {
    if (!pdfUrl || !document) return;

    try {
      toast({
        title: 'Generating PDF',
        description: 'Please wait while we prepare your document with all the fields...',
      });

      await generatePDFWithFields(
        pdfUrl,
        signatureFields,
        document.file_name || 'document.pdf'
      );

      toast({
        title: 'Download Complete',
        description: 'Your document with all fields has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to generate the document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Calculate field position for display on overlay
  const getFieldDisplayPosition = (field: SignatureField) => {
    // For multi-page PDFs, we need to consider which page the field is on
    // and adjust the Y position accordingly
    const pageOffset = (field.page_number - 1) * 100; // Each page takes 100% of viewport height
    return {
      left: `${field.x_position}%`,
      top: `${field.y_position + pageOffset}%`,
      width: `${(field.width / 800) * 100}%`,
      height: `${(field.height / 600) * 100}%`,
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Document not found.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <Badge className={`${
                document.status === 'completed' ? 'bg-green-100 text-green-800' :
                document.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-600">{document.file_name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={downloadDocument}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/document/${id}/share`)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={saveFields} disabled={saveFieldsMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveFieldsMutation.isPending ? 'Saving...' : 'Save Fields'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Signature Fields Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Signature Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Signer Email</label>
                <Input
                  type="email"
                  placeholder="Enter signer email"
                  value={newSignerEmail}
                  onChange={(e) => setNewSignerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Field Type</label>
                <Select value={selectedFieldType} onValueChange={setSelectedFieldType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={() => {
                  if (newSignerEmail.trim()) {
                    setIsAddingField(true);
                    toast({
                      title: 'Click on PDF',
                      description: `Click on any page where you want to place the ${getFieldDisplayInfo(selectedFieldType).label.toLowerCase()}.`,
                    });
                  } else {
                    toast({
                      title: 'Email Required',
                      description: 'Please enter a signer email first.',
                      variant: 'destructive',
                    });
                  }
                }}
                className="w-full"
                disabled={isAddingField}
              >
                {isAddingField ? 'Click on PDF...' : `Add ${getFieldDisplayInfo(selectedFieldType).label}`}
              </Button>

              {/* Field Type Legend */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Field Types</h4>
                <div className="grid grid-cols-2 gap-2">
                  {fieldTypes.map((type) => (
                    <div
                      key={type.value}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-xs"
                    >
                      <div className={`w-3 h-3 rounded ${type.color}`}></div>
                      <span>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {signatureFields.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Current Fields ({signatureFields.length})
                  </h4>
                  <ScrollArea className="max-h-60">
                    <div className="space-y-2 pr-2">
                      {signatureFields.map((field, index) => {
                        const fieldInfo = getFieldDisplayInfo(field.field_type);
                        const FieldIcon = fieldInfo.icon;
                        return (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <FieldIcon className="h-3 w-3" />
                                  <span className="text-xs font-medium">{fieldInfo.label}</span>
                                </div>
                                <p className="text-xs text-gray-600 truncate">{field.signer_email}</p>
                                <p className="text-xs text-gray-500">
                                  Page {field.page_number} - {Math.round(field.x_position)}%, {Math.round(field.y_position)}%
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeField(index)}
                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PDF Viewer */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                {pdfError ? (
                  <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <div className="text-center">
                      <p className="text-red-600 font-medium">PDF Loading Error</p>
                      <p className="text-gray-600 text-sm mt-1">{pdfError}</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <div className="relative">
                    <div 
                      ref={overlayRef}
                      className="relative"
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      style={{ height: `${Math.max(90, pdfPageCount * 100)}vh` }}
                    >
                      <iframe
                        ref={iframeRef}
                        src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH&zoom=page-width`}
                        className="w-full h-full border-0 rounded-lg"
                        title="PDF Viewer"
                        onLoad={() => {
                          console.log('PDF iframe loaded');
                          setIframeLoaded(true);
                        }}
                        onError={() => setPdfError('Failed to load PDF file')}
                        style={{ 
                          minHeight: '100%'
                        }}
                        allow="fullscreen"
                        loading="lazy"
                      />
                      
                      {/* Click overlay for adding fields */}
                      <div 
                        className={`absolute inset-0 w-full h-full ${
                          isAddingField ? 'cursor-crosshair bg-blue-50 bg-opacity-10' : 
                          draggingField !== null ? 'cursor-grabbing' : 'cursor-default'
                        }`}
                        onClick={handlePdfClick}
                        style={{ 
                          pointerEvents: draggingField !== null ? 'none' : isAddingField ? 'auto' : 'none',
                          zIndex: isAddingField ? 10 : 1
                        }}
                      />
                      
                      <div className="absolute top-2 right-2 z-20">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 shadow-lg"
                        >
                          Open in new tab
                        </a>
                      </div>
                      
                      {/* Signature Field Overlays */}
                      {signatureFields.map((field, index) => {
                        const fieldInfo = getFieldDisplayInfo(field.field_type);
                        const FieldIcon = fieldInfo.icon;
                        const displayPosition = getFieldDisplayPosition(field);
                        
                        return (
                          <div
                            key={index}
                            className={`absolute border-2 ${fieldInfo.color.replace('bg-', 'border-')} bg-opacity-20 ${fieldInfo.color} flex items-center justify-center text-xs font-medium text-white shadow-sm cursor-grab hover:shadow-lg transition-shadow ${draggingField === index ? 'cursor-grabbing z-50' : 'z-30'}`}
                            style={{
                              left: displayPosition.left,
                              top: displayPosition.top,
                              width: displayPosition.width,
                              height: displayPosition.height,
                              minWidth: '60px',
                              minHeight: '25px',
                            }}
                            onMouseDown={(e) => handleFieldMouseDown(e, index)}
                            title={`Page ${field.page_number} - ${fieldInfo.label} for ${field.signer_email}`}
                          >
                            {field.signature_data ? (
                              field.field_type === 'signature' ? (
                                <img 
                                  src={field.signature_data} 
                                  alt="Signature" 
                                  className="w-full h-full object-contain"
                                  style={{ pointerEvents: 'none' }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-black bg-white bg-opacity-90 rounded text-xs font-medium" style={{ pointerEvents: 'none' }}>
                                  {field.signature_data}
                                </div>
                              )
                            ) : (
                              <div className="flex items-center gap-1 pointer-events-none">
                                <FieldIcon className="h-3 w-3" />
                                <span className="truncate text-xs">
                                  P{field.page_number} {field.field_type === 'signature' ? 'Sign' :
                                   field.field_type === 'initials' ? 'Init' :
                                   field.field_type === 'name' ? 'Name' :
                                   field.field_type === 'date' ? 'Date' :
                                   field.field_type === 'company' ? 'Co.' : 'Text'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[600px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading PDF...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signature Capture Dialog */}
      <SignatureCapture
        isOpen={showSignatureCapture}
        onClose={() => {
          setShowSignatureCapture(false);
          setPendingSignaturePosition(null);
        }}
        onSignatureComplete={handleSignatureComplete}
      />

      {/* Field Input Dialog */}
      <FieldInputDialog
        isOpen={showFieldInputDialog}
        fieldType={selectedFieldType as 'initials' | 'name' | 'date' | 'text' | 'company'}
        onClose={() => {
          setShowFieldInputDialog(false);
          setPendingFieldPosition(null);
        }}
        onComplete={handleFieldInputComplete}
      />
    </div>
  );
};
