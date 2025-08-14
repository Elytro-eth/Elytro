import React, { useState, useRef } from 'react';
import { FileKey, UploadIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/shadcn/utils';

interface RecoveryFileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpload: (file: File) => void;
}

export default function RecoveryFileUploadDialog({ open, onOpenChange, onFileUpload }: RecoveryFileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDone = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
      onOpenChange(false);
      setSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          '!left-1/2 !right-auto !top-1/2 !-translate-x-1/2 !-translate-y-1/2',
          'max-w-md w-[calc(100vw-2rem)] min-w-[320px]',
          'overflow-hidden'
        )}
      >
        <DialogHeader>
          <DialogTitle>Upload your recovery file</DialogTitle>
          <DialogDescription>You should have this as you opted for Privacy mode</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {/* File Upload Area */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
              'flex items-center justify-center',
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            {selectedFile ? (
              // File Selected State
              <div className="flex items-center justify-center space-x-3 w-full">
                <FileKey className="w-6 h-6" />
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              </div>
            ) : (
              <div className="flex flex-row items-center p-md gap-x-sm">
                <UploadIcon className="w-6 h-6 stroke-gray-600" />
                <p className="text-sm text-gray-600">Upload recovery file</p>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input ref={fileInputRef} type="file" accept=".json,.txt" className="hidden" onChange={handleFileChange} />
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleDone}
            disabled={!selectedFile}
            className={cn(
              'flex-1',
              selectedFile
                ? 'bg-primary hover:bg-primary/90 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
