import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, FileText, User, Building, Type } from 'lucide-react';

interface FieldInputDialogProps {
  isOpen: boolean;
  fieldType: 'initials' | 'name' | 'date' | 'text' | 'company';
  onClose: () => void;
  onComplete: (value: string) => void;
}

export const FieldInputDialog: React.FC<FieldInputDialogProps> = ({
  isOpen,
  fieldType,
  onClose,
  onComplete,
}) => {
  const [value, setValue] = useState('');

  const getFieldConfig = () => {
    switch (fieldType) {
      case 'initials':
        return {
          title: 'Enter Initials',
          placeholder: 'Enter your initials (e.g., JD)',
          icon: Type,
          maxLength: 5,
        };
      case 'name':
        return {
          title: 'Enter Full Name',
          placeholder: 'Enter your full name',
          icon: User,
          maxLength: 50,
        };
      case 'date':
        return {
          title: 'Enter Date',
          placeholder: 'Enter date (e.g., 01/01/2024)',
          icon: Calendar,
          maxLength: 20,
        };
      case 'text':
        return {
          title: 'Enter Text',
          placeholder: 'Enter text',
          icon: FileText,
          maxLength: 100,
        };
      case 'company':
        return {
          title: 'Enter Company Name',
          placeholder: 'Enter company name',
          icon: Building,
          maxLength: 50,
        };
      default:
        return {
          title: 'Enter Value',
          placeholder: 'Enter value',
          icon: FileText,
          maxLength: 50,
        };
    }
  };

  const config = getFieldConfig();
  const Icon = config.icon;

  const handleComplete = () => {
    if (value.trim()) {
      onComplete(value.trim());
      setValue('');
      onClose();
    }
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleComplete();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {config.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-value">Value</Label>
            <Input
              id="field-value"
              type={fieldType === 'date' ? 'date' : 'text'}
              placeholder={config.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={config.maxLength}
              autoFocus
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleComplete} 
              disabled={!value.trim()}
              className="flex-1"
            >
              Add Field
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};