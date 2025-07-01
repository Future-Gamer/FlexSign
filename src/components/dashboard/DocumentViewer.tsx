
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Share2, PenTool, Save, Users } from 'lucide-react';

interface SignatureField {
  id?: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  signer_email: string;
  page_number: number;
}

export const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

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

  // Get PDF URL
  useEffect(() => {
    if (document?.file_path) {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(document.file_path);
      setPdfUrl(data.publicUrl);
    }
  }, [document]);

  // Load existing signature fields
  useEffect(() => {
    if (existingFields) {
      setSignatureFields(existingFields);
    }
  }, [existingFields]);

  // Save signature fields mutation
  const saveFieldsMutation = useMutation({
    mutationFn: async (fields: SignatureField[]) => {
      // Delete existing fields
      await supabase
        .from('signature_fields')
        .delete()
        .eq('document_id', id);

      // Insert new fields
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
            }))
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Signature Fields Saved',
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

  const handlePdfClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingField || !newSignerEmail.trim()) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newField: SignatureField = {
      x_position: x,
      y_position: y,
      width: 150,
      height: 50,
      signer_email: newSignerEmail.trim(),
      page_number: 1,
    };

    setSignatureFields([...signatureFields, newField]);
    setIsAddingField(false);
  };

  const removeField = (index: number) => {
    setSignatureFields(signatureFields.filter((_, i) => i !== index));
  };

  const saveFields = () => {
    saveFieldsMutation.mutate(signatureFields);
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
                Signature Fields
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
              
              <Button
                onClick={() => {
                  if (newSignerEmail.trim()) {
                    setIsAddingField(true);
                    toast({
                      title: 'Click on PDF',
                      description: 'Click where you want to place the signature field.',
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
                {isAddingField ? 'Click on PDF...' : 'Add Signature Field'}
              </Button>

              {signatureFields.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Current Fields ({signatureFields.length})
                  </h4>
                  {signatureFields.map((field, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{field.signer_email}</p>
                          <p className="text-xs text-gray-600">
                            Position: {Math.round(field.x_position)}%, {Math.round(field.y_position)}%
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PDF Viewer */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div 
                className="relative bg-gray-100 min-h-[600px] cursor-crosshair"
                onClick={handlePdfClick}
              >
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-[600px] border-0"
                    title="PDF Viewer"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[600px]">
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                )}
                
                {/* Signature Field Overlays */}
                {signatureFields.map((field, index) => (
                  <div
                    key={index}
                    className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-50 flex items-center justify-center text-xs font-medium text-blue-700"
                    style={{
                      left: `${field.x_position}%`,
                      top: `${field.y_position}%`,
                      width: `${(field.width / 800) * 100}%`,
                      height: `${(field.height / 600) * 100}%`,
                    }}
                  >
                    {field.signer_email}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
