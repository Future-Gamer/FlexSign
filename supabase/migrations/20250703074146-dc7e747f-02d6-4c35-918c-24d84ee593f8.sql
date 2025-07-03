-- Add signature_data column to signature_fields table
ALTER TABLE public.signature_fields 
ADD COLUMN signature_data TEXT;