
-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signature fields table (for signature positions)
CREATE TABLE public.signature_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  signer_email TEXT NOT NULL,
  x_position FLOAT NOT NULL,
  y_position FLOAT NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  width FLOAT DEFAULT 150,
  height FLOAT DEFAULT 50,
  field_type TEXT DEFAULT 'signature' CHECK (field_type IN ('signature', 'date', 'text')),
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signatures table (actual signature data)
CREATE TABLE public.signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_field_id UUID REFERENCES public.signature_fields(id) ON DELETE CASCADE NOT NULL,
  signer_email TEXT NOT NULL,
  signature_data TEXT, -- Base64 encoded signature image or text
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create document shares table (for sharing documents via links)
CREATE TABLE public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  recipient_email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for signature fields
CREATE POLICY "Users can view signature fields for their documents" ON public.signature_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signature_fields.document_id 
      AND documents.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can create signature fields for their documents" ON public.signature_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = signature_fields.document_id 
      AND documents.owner_id = auth.uid()
    )
  );

-- RLS Policies for signatures
CREATE POLICY "Users can view signatures for their documents" ON public.signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.signature_fields sf
      JOIN public.documents d ON sf.document_id = d.id
      WHERE sf.id = signatures.signature_field_id 
      AND d.owner_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can create signatures via shared links" ON public.signatures
  FOR INSERT WITH CHECK (true);

-- RLS Policies for document shares
CREATE POLICY "Users can view shares for their documents" ON public.document_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_shares.document_id 
      AND documents.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can create shares for their documents" ON public.document_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_shares.document_id 
      AND documents.owner_id = auth.uid()
    )
  );

-- RLS Policies for audit logs
CREATE POLICY "Users can view audit logs for their documents" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = audit_logs.document_id 
      AND documents.owner_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
