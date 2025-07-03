import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

export const generatePDFWithFields = async (
  originalPdfUrl: string,
  fields: SignatureField[],
  fileName: string
): Promise<void> => {
  try {
    // Fetch the original PDF
    const response = await fetch(originalPdfUrl);
    const pdfBytes = await response.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Process each field
    for (const field of fields) {
      if (!field.signature_data) continue;
      
      const pageIndex = (field.page_number || 1) - 1;
      if (pageIndex >= pages.length) continue;
      
      const page = pages[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      // Calculate field position (convert from percentage to PDF coordinates)
      const x = (field.x_position / 100) * pageWidth;
      const y = pageHeight - ((field.y_position / 100) * pageHeight) - (field.height * 0.75); // Adjust for PDF coordinate system
      const width = field.width * 0.75; // Convert to PDF units
      const height = field.height * 0.75;
      
      if (field.field_type === 'signature' && field.signature_data.startsWith('data:image')) {
        try {
          // Handle signature image
          const base64Data = field.signature_data.split(',')[1];
          const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          let image;
          if (field.signature_data.includes('data:image/png')) {
            image = await pdfDoc.embedPng(imageBytes);
          } else if (field.signature_data.includes('data:image/jpeg') || field.signature_data.includes('data:image/jpg')) {
            image = await pdfDoc.embedJpg(imageBytes);
          } else {
            // Try PNG as fallback
            image = await pdfDoc.embedPng(imageBytes);
          }
          
          page.drawImage(image, {
            x,
            y,
            width,
            height,
          });
        } catch (error) {
          console.error('Error embedding signature image:', error);
          // Fallback to text if image fails
          page.drawText('SIGNATURE', {
            x,
            y: y + height / 2,
            size: 10,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
          });
        }
      } else {
        // Handle text fields
        const fontSize = Math.min(height * 0.6, 14); // Adaptive font size
        const text = field.signature_data || '';
        
        // Choose font based on field type
        const font = field.field_type === 'signature' ? helveticaBoldFont : helveticaFont;
        
        // Draw background for better visibility
        page.drawRectangle({
          x: x - 2,
          y: y - 2,
          width: width + 4,
          height: height + 4,
          color: rgb(1, 1, 1),
          opacity: 0.8,
        });
        
        // Draw border
        page.drawRectangle({
          x: x - 1,
          y: y - 1,
          width: width + 2,
          height: height + 2,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });
        
        // Draw text
        page.drawText(text, {
          x: x + 4,
          y: y + height / 2 - fontSize / 2,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth: width - 8,
        });
      }
    }
    
    // Generate the final PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Create download link
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error generating PDF with fields:', error);
    throw new Error('Failed to generate PDF with fields');
  }
};