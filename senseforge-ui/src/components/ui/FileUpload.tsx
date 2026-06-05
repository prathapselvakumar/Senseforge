"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelect?: (file: File) => void;
  accept?: string;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ className, onFileSelect, accept = ".pt,.yaml,.bag,.png,.jpg", ...props }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect?.(e.dataTransfer.files[0]);
      }
    };

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect?.(e.target.files[0]);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed border-default rounded-lg bg-surface transition-colors cursor-pointer",
          isDragOver ? "border-accent bg-accent-muted" : "hover:border-accent hover:bg-accent-muted",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        {...props}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
        <Upload className="h-6 w-6 text-secondary mb-2" />
        <p className="text-sm text-secondary font-medium">Drop files here or click to upload</p>
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

export { FileUpload };
