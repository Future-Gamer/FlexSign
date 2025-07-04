
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ProcessingResult {
  blob: Blob;
  filename: string;
}

export const mergePDFs = async (files: FileList): Promise<ProcessingResult> => {
  const mergedPdf = await PDFDocument.create();
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
  }
  
  const pdfBytes = await mergedPdf.save();
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: 'merged-document.pdf'
  };
};

export const splitPDF = async (file: File, pageRanges?: string): Promise<ProcessingResult[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  const results: ProcessingResult[] = [];
  
  // If no ranges specified, split into individual pages
  if (!pageRanges) {
    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdf, [i]);
      newPdf.addPage(copiedPage);
      
      const pdfBytes = await newPdf.save();
      results.push({
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        filename: `${file.name.replace('.pdf', '')}-page-${i + 1}.pdf`
      });
    }
  }
  
  return results;
};

export const compressPDF = async (file: File): Promise<ProcessingResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  // Basic compression by re-saving the PDF
  const pdfBytes = await pdf.save({
    useObjectStreams: false,
    addDefaultPage: false,
  });
  
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `compressed-${file.name}`
  };
};

export const pdfToWord = async (file: File): Promise<ProcessingResult> => {
  // Simulate PDF to Word conversion
  const text = `Converted content from ${file.name}\n\nThis is a simulated conversion. In a real implementation, you would use a PDF parsing library to extract text and formatting.`;
  
  return {
    blob: new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    filename: `${file.name.replace('.pdf', '')}.docx`
  };
};

export const pdfToPowerPoint = async (file: File): Promise<ProcessingResult> => {
  // Simulate PDF to PowerPoint conversion
  const content = `Converted presentation from ${file.name}`;
  
  return {
    blob: new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
    filename: `${file.name.replace('.pdf', '')}.pptx`
  };
};

export const pdfToExcel = async (file: File): Promise<ProcessingResult> => {
  // Simulate PDF to Excel conversion
  const csvContent = `Data from ${file.name}\nColumn1,Column2,Column3\nValue1,Value2,Value3`;
  
  return {
    blob: new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename: `${file.name.replace('.pdf', '')}.xlsx`
  };
};

export const wordToPDF = async (file: File): Promise<ProcessingResult> => {
  // Simulate Word to PDF conversion
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  page.drawText(`Converted from ${file.name}`, {
    x: 50,
    y: 700,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('This is a simulated conversion from Word to PDF.', {
    x: 50,
    y: 680,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdf.save();
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `${file.name.replace(/\.(doc|docx)$/, '')}.pdf`
  };
};

export const powerPointToPDF = async (file: File): Promise<ProcessingResult> => {
  // Simulate PowerPoint to PDF conversion
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  page.drawText(`Converted from ${file.name}`, {
    x: 50,
    y: 700,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('This is a simulated conversion from PowerPoint to PDF.', {
    x: 50,
    y: 680,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdf.save();
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `${file.name.replace(/\.(ppt|pptx)$/, '')}.pdf`
  };
};

export const excelToPDF = async (file: File): Promise<ProcessingResult> => {
  // Simulate Excel to PDF conversion
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  page.drawText(`Converted from ${file.name}`, {
    x: 50,
    y: 700,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('This is a simulated conversion from Excel to PDF.', {
    x: 50,
    y: 680,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdf.save();
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `${file.name.replace(/\.(xls|xlsx)$/, '')}.pdf`
  };
};

export const editPDF = async (file: File, edits?: any): Promise<ProcessingResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  // Add a simple edit - watermark or text
  const pages = pdf.getPages();
  const firstPage = pages[0];
  
  firstPage.drawText('EDITED', {
    x: firstPage.getWidth() - 100,
    y: firstPage.getHeight() - 50,
    size: 12,
    font,
    color: rgb(0.7, 0.7, 0.7),
  });
  
  const pdfBytes = await pdf.save();
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `edited-${file.name}`
  };
};
