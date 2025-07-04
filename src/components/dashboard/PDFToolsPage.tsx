
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Merge, 
  Split, 
  FileArchive, 
  FileText, 
  FileType, 
  FileSpreadsheet, 
  Edit,
  Upload,
  Download
} from 'lucide-react';
import {
  mergePDFs,
  splitPDF,
  compressPDF,
  pdfToWord,
  pdfToPowerPoint,
  pdfToExcel,
  wordToPDF,
  powerPointToPDF,
  excelToPDF,
  editPDF,
  ProcessingResult
} from '@/utils/pdfProcessors';

export const PDFToolsPage = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [processingTool, setProcessingTool] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const downloadFile = (result: ProcessingResult) => {
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadMultipleFiles = (results: ProcessingResult[]) => {
    results.forEach(result => {
      setTimeout(() => downloadFile(result), 100);
    });
  };

  const processFile = async (operation: string, toolName: string) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select files to process.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProcessingTool(toolName);
    
    toast({
      title: 'Processing...',
      description: `${operation} operation in progress...`,
    });

    try {
      const file = selectedFiles[0];
      let result: ProcessingResult | ProcessingResult[];

      switch (operation) {
        case 'merge':
          if (selectedFiles.length < 2) {
            throw new Error('Please select at least 2 PDF files to merge');
          }
          result = await mergePDFs(selectedFiles);
          downloadFile(result as ProcessingResult);
          break;
          
        case 'split':
          result = await splitPDF(file);
          downloadMultipleFiles(result as ProcessingResult[]);
          break;
          
        case 'compress':
          result = await compressPDF(file);
          downloadFile(result as ProcessingResult);
          break;
          
        case 'pdf-to-word':
          result = await pdfToWord(file);
          downloadFile(result as ProcessingResult);
          break;
          
        case 'pdf-to-powerpoint':
          result = await pdfToPowerPoint(file);
          downloadFile(result as ProcessingResult);
          break;
          
        case 'pdf-to-excel':
          result = await pdfToExcel(file);
          downloadFile(result as ProcessingResult);
          break;
          
        case 'word-to-pdf':
          result = await wordToPDF(file);
          downloadFile(result as ProcessingResult);
          break;
          
        case 'powerpoint-to-pdf':
          result = await powerPointToPDF(file);
          downloadFile(result as ProcessingResult);
          break;
          
        case 'excel-to-pdf':
          result = await excelToPDF(file);
          downloadFile(result as ProcessingResult);
          break;
          
        case 'edit':
          result = await editPDF(file);
          downloadFile(result as ProcessingResult);
          break;
          
        default:
          throw new Error('Unknown operation');
      }

      toast({
        title: 'Success!',
        description: `${toolName} completed successfully. File(s) downloaded.`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${operation}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProcessingTool('');
    }
  };

  const tools = [
    {
      icon: Merge,
      title: 'Merge PDF',
      description: 'Combine multiple PDFs into one document',
      color: 'bg-red-500',
      iconBg: 'bg-red-100',
      action: () => processFile('merge', 'Merge PDF'),
      acceptMultiple: true,
      acceptedTypes: '.pdf'
    },
    {
      icon: Split,
      title: 'Split PDF',
      description: 'Split a PDF into separate pages',
      color: 'bg-red-500',
      iconBg: 'bg-red-100',
      action: () => processFile('split', 'Split PDF'),
      acceptMultiple: false,
      acceptedTypes: '.pdf'
    },
    {
      icon: FileArchive,
      title: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      color: 'bg-green-500',
      iconBg: 'bg-green-100',
      action: () => processFile('compress', 'Compress PDF'),
      acceptMultiple: false,
      acceptedTypes: '.pdf'
    },
    {
      icon: FileText,
      title: 'PDF to Word',
      description: 'Convert PDF to editable DOC/DOCX format',
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      action: () => processFile('pdf-to-word', 'PDF to Word'),
      acceptMultiple: false,
      acceptedTypes: '.pdf'
    },
    {
      icon: FileType,
      title: 'PDF to PowerPoint',
      description: 'Convert PDF to PPT/PPTX presentation',
      color: 'bg-orange-500',
      iconBg: 'bg-orange-100',
      action: () => processFile('pdf-to-powerpoint', 'PDF to PowerPoint'),
      acceptMultiple: false,
      acceptedTypes: '.pdf'
    },
    {
      icon: FileSpreadsheet,
      title: 'PDF to Excel',
      description: 'Extract data from PDF to Excel spreadsheet',
      color: 'bg-green-600',
      iconBg: 'bg-green-100',
      action: () => processFile('pdf-to-excel', 'PDF to Excel'),
      acceptMultiple: false,
      acceptedTypes: '.pdf'
    },
    {
      icon: FileText,
      title: 'Word to PDF',
      description: 'Convert DOC/DOCX to PDF format',
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      action: () => processFile('word-to-pdf', 'Word to PDF'),
      acceptMultiple: false,
      acceptedTypes: '.doc,.docx'
    },
    {
      icon: FileType,
      title: 'PowerPoint to PDF',
      description: 'Convert PPT/PPTX to PDF format',
      color: 'bg-orange-500',
      iconBg: 'bg-orange-100',
      action: () => processFile('powerpoint-to-pdf', 'PowerPoint to PDF'),
      acceptMultiple: false,
      acceptedTypes: '.ppt,.pptx'
    },
    {
      icon: FileSpreadsheet,
      title: 'Excel to PDF',
      description: 'Convert Excel spreadsheets to PDF',
      color: 'bg-green-600',
      iconBg: 'bg-green-100',
      action: () => processFile('excel-to-pdf', 'Excel to PDF'),
      acceptMultiple: false,
      acceptedTypes: '.xls,.xlsx'
    },
    {
      icon: Edit,
      title: 'Edit PDF',
      description: 'Add text, images, and annotations to PDF',
      color: 'bg-purple-500',
      iconBg: 'bg-purple-100',
      action: () => processFile('edit', 'Edit PDF'),
      acceptMultiple: false,
      acceptedTypes: '.pdf'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Professional PDF Tools
        </h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Complete PDF solution for all your document needs. Merge, split, compress, convert, 
          and edit PDFs with professional quality results.
        </p>
      </div>

      {/* File Upload Section */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Click to upload files
              </p>
              <p className="text-sm text-gray-600">
                Supports PDF, Word, PowerPoint, and Excel files
              </p>
            </label>
          </div>
          
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Files:</h4>
              {Array.from(selectedFiles).map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {tools.map((tool, index) => {
          const IconComponent = tool.icon;
          const isProcessingThis = isProcessing && processingTool === tool.title;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow group">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative">
                  <div className={`w-16 h-16 ${tool.iconBg} rounded-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`h-8 w-8 text-gray-700`} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                
                <Button
                  onClick={tool.action}
                  disabled={isProcessing || !selectedFiles || selectedFiles.length === 0}
                  className="w-full"
                  size="sm"
                >
                  {isProcessingThis ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Process
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">How to Use</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Step 1: Upload Files</h4>
              <p className="text-sm text-gray-600 mb-4">
                Select the files you want to process. You can upload multiple files for merging operations.
              </p>
              
              <h4 className="font-medium mb-2">Step 2: Choose Tool</h4>
              <p className="text-sm text-gray-600">
                Click on any tool to process your files. The processed file will be automatically downloaded.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Supported Formats</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PDF files (.pdf)</li>
                <li>• Word documents (.doc, .docx)</li>
                <li>• PowerPoint presentations (.ppt, .pptx)</li>
                <li>• Excel spreadsheets (.xls, .xlsx)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
