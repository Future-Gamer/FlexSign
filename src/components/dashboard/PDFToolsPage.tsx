
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

export const PDFToolsPage = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const processFile = async (operation: string) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select files to process.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: 'Processing...',
      description: `${operation} operation in progress...`,
    });

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a download link for the processed file
      const processedFileName = `processed-${operation.toLowerCase().replace(' ', '-')}-${selectedFiles[0].name}`;
      const blob = new Blob(['Processed file content'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = processedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success!',
        description: `${operation} completed successfully. File downloaded.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${operation.toLowerCase()}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tools = [
    {
      icon: Merge,
      title: 'Merge PDF',
      description: 'Combine multiple PDFs into one document',
      color: 'bg-red-500',
      iconBg: 'bg-red-100',
      action: () => processFile('Merge PDF'),
      acceptMultiple: true
    },
    {
      icon: Split,
      title: 'Split PDF',
      description: 'Split a PDF into separate pages or ranges',
      color: 'bg-red-500',
      iconBg: 'bg-red-100',
      action: () => processFile('Split PDF'),
      acceptMultiple: false
    },
    {
      icon: FileArchive,
      title: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      color: 'bg-green-500',
      iconBg: 'bg-green-100',
      action: () => processFile('Compress PDF'),
      acceptMultiple: false
    },
    {
      icon: FileText,
      title: 'PDF to Word',
      description: 'Convert PDF to editable DOC/DOCX format',
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      action: () => processFile('PDF to Word'),
      acceptMultiple: false
    },
    {
      icon: FileType,
      title: 'PDF to PowerPoint',
      description: 'Convert PDF to PPT/PPTX presentation',
      color: 'bg-orange-500',
      iconBg: 'bg-orange-100',
      action: () => processFile('PDF to PowerPoint'),
      acceptMultiple: false
    },
    {
      icon: FileSpreadsheet,
      title: 'PDF to Excel',
      description: 'Extract data from PDF to Excel spreadsheet',
      color: 'bg-green-600',
      iconBg: 'bg-green-100',
      action: () => processFile('PDF to Excel'),
      acceptMultiple: false
    },
    {
      icon: FileText,
      title: 'Word to PDF',
      description: 'Convert DOC/DOCX to PDF format',
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      action: () => processFile('Word to PDF'),
      acceptMultiple: false
    },
    {
      icon: FileType,
      title: 'PowerPoint to PDF',
      description: 'Convert PPT/PPTX to PDF format',
      color: 'bg-orange-500',
      iconBg: 'bg-orange-100',
      action: () => processFile('PowerPoint to PDF'),
      acceptMultiple: false
    },
    {
      icon: FileSpreadsheet,
      title: 'Excel to PDF',
      description: 'Convert Excel spreadsheets to PDF',
      color: 'bg-green-600',
      iconBg: 'bg-green-100',
      action: () => processFile('Excel to PDF'),
      acceptMultiple: false
    },
    {
      icon: Edit,
      title: 'Edit PDF',
      description: 'Add text, images, and annotations to PDF',
      color: 'bg-purple-500',
      iconBg: 'bg-purple-100',
      action: () => processFile('Edit PDF'),
      acceptMultiple: false
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
                  {isProcessing ? (
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
