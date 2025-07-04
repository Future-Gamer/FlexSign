
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Merge, Split, FileArchive, FileText, FileText as Word, FileSpreadsheet, FileType, Edit } from 'lucide-react';

const pdfTools = [
  {
    icon: Merge,
    title: 'Merge PDF',
    description: 'Combine PDFs in the order you want with the easiest PDF merger available.',
    color: 'bg-red-500',
    iconBg: 'bg-red-100'
  },
  {
    icon: Split,
    title: 'Split PDF',
    description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    color: 'bg-red-500',
    iconBg: 'bg-red-100'
  },
  {
    icon: FileArchive,
    title: 'Compress PDF',
    description: 'Reduce file size while optimizing for maximal PDF quality.',
    color: 'bg-green-500',
    iconBg: 'bg-green-100'
  },
  {
    icon: Word,
    title: 'PDF to Word',
    description: 'Easily convert your PDF files into easy to edit DOC and DOCX documents. The converted WORD document is almost 100% accurate.',
    color: 'bg-blue-500',
    iconBg: 'bg-blue-100'
  },
  {
    icon: FileType,
    title: 'PDF to PowerPoint',
    description: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.',
    color: 'bg-orange-500',
    iconBg: 'bg-orange-100'
  },
  {
    icon: FileSpreadsheet,
    title: 'PDF to Excel',
    description: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.',
    color: 'bg-green-600',
    iconBg: 'bg-green-100'
  },
  {
    icon: Word,
    title: 'Word to PDF',
    description: 'Make DOC and DOCX files easy to read by converting them to PDF.',
    color: 'bg-blue-500',
    iconBg: 'bg-blue-100'
  },
  {
    icon: FileType,
    title: 'PowerPoint to PDF',
    description: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.',
    color: 'bg-orange-500',
    iconBg: 'bg-orange-100'
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel to PDF',
    description: 'Make EXCEL spreadsheets easy to read by converting them to PDF.',
    color: 'bg-green-600',
    iconBg: 'bg-green-100'
  },
  {
    icon: Edit,
    title: 'Edit PDF',
    description: 'Add text, images, shapes or freehand annotations to a PDF document. Edit the size, font, and color of the added content.',
    color: 'bg-purple-500',
    iconBg: 'bg-purple-100',
    isNew: true
  }
];

export const PDFTools = () => {
  const navigate = useNavigate();

  const handleToolClick = () => {
    navigate('/dashboard/pdf-tools');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Every tool you need to work with PDFs in one place
        </h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, 
          split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {pdfTools.map((tool, index) => {
          const IconComponent = tool.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleToolClick}>
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative">
                  <div className={`w-16 h-16 ${tool.iconBg} rounded-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`h-8 w-8 text-${tool.color.replace('bg-', '')}`} />
                  </div>
                  {tool.isNew && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      New!
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
