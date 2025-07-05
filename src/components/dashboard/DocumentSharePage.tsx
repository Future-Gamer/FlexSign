
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Share2, Copy, Mail, Users, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const DocumentSharePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);

  // Fetch document details
  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      console.log('Fetching document with id:', id);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching document:', error);
        throw error;
      }
      console.log('Document fetched:', data);
      return data;
    },
  });

  // Fetch existing shares
  const { data: shares, refetch: refetchShares } = useQuery({
    queryKey: ['document-shares', id],
    queryFn: async () => {
      console.log('Fetching shares for document:', id);
      const { data, error } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching shares:', error);
        throw error;
      }
      console.log('Shares fetched:', data);
      return data;
    },
    enabled: !!id,
  });

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: async ({ email, expiresIn }: { email: string; expiresIn: number }) => {
      console.log('Creating share for email:', email, 'expires in:', expiresIn, 'days');
      
      const shareToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      const shareData = {
        document_id: id!,
        recipient_email: email,
        share_token: shareToken,
        expires_at: expiresAt.toISOString(),
      };
      
      console.log('Inserting share data:', shareData);

      const { data, error } = await supabase
        .from('document_shares')
        .insert(shareData)
        .select()
        .single();

      if (error) {
        console.error('Error creating share:', error);
        throw error;
      }
      
      console.log('Share created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Share Created',
        description: `Document shared with ${data.recipient_email}`,
      });
      setRecipientEmail('');
      refetchShares();
    },
    onError: (error) => {
      console.error('Create share mutation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      });
    },
  });

  // Delete share mutation
  const deleteShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      console.log('Deleting share:', shareId);
      const { error } = await supabase
        .from('document_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        console.error('Error deleting share:', error);
        throw error;
      }
      console.log('Share deleted successfully');
    },
    onSuccess: () => {
      toast({
        title: 'Share Removed',
        description: 'Share link has been removed',
      });
      refetchShares();
    },
    onError: (error) => {
      console.error('Delete share mutation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove share link',
        variant: 'destructive',
      });
    },
  });

  const handleCreateShare = () => {
    if (!recipientEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter a recipient email address',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    createShareMutation.mutate({
      email: recipientEmail.trim(),
      expiresIn: expiresInDays,
    });
  };

  const copyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Link Copied',
        description: 'Share link copied to clipboard',
      });
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/dashboard/document/${id}`)}>
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
          <Button variant="ghost" onClick={() => navigate(`/dashboard/document/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Share Document</h1>
            <p className="text-gray-600">{document.title}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create New Share */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Create Share Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient Email</label>
              <Input
                type="email"
                placeholder="Enter recipient email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expires In (Days)</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
              />
            </div>

            <Button
              onClick={handleCreateShare}
              disabled={createShareMutation.isPending}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {createShareMutation.isPending ? 'Creating...' : 'Create Share Link'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Shares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Shares ({shares?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shares && shares.length > 0 ? (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{share.recipient_email}</span>
                        {share.is_signed && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Signed
                          </Badge>
                        )}
                        {isExpired(share.expires_at) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created: {format(new Date(share.created_at!), 'MMM d, yyyy')}
                        </div>
                        {share.expires_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires: {format(new Date(share.expires_at), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyShareLink(share.share_token)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteShareMutation.mutate(share.id)}
                        disabled={deleteShareMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No shares created yet</p>
                <p className="text-sm">Create a share link to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
