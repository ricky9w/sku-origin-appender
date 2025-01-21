'use client';

import React, { useState } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const PDFProcessor = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>("");
  const [fileQueue, setFileQueue] = useState<File[]>([]);

  const processPDF = async (file: File) => {
    try {
      setCurrentFile(file.name);
      setProcessing(true);
      setProgress(20);

      const arrayBuffer = await file.arrayBuffer();
      setProgress(40);
      
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      setProgress(50);

      const pages = pdfDoc.getPages();
      
      pages.forEach((page, index) => {
        const { width } = page.getSize();
        const text = "Made In China";
        const fontSize = 6;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);

        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: fontSize * 1.5,
          size: fontSize,
          font: helveticaFont
        });
        
        setProgress(50 + Math.floor((index + 1) / pages.length * 30));
      });

      const modifiedPdfBytes = await pdfDoc.save();
      setProgress(90);

      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.pdf', '')}-processed.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);
      setTimeout(() => {
        setProcessing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert(`处理PDF文件 ${file.name} 时发生错误, 请重试`);
    }
  };

  const processFiles = async (files: File[]) => {
    setProcessing(true);
    setFileQueue(files);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        await processPDF(file);
      } else {
        alert(`文件 ${file.name} 不是有效的PDF文件。`);
      }
    }
    
    setProcessing(false);
    setFileQueue([]);
    setCurrentFile("");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>亚马逊 SKU 标签原产国信息添加工具</CardTitle>
          <CardDescription>
            在标签底部添加 &ldquo;Made In China&rdquo; 文本
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                拖拽一个或多个 PDF 文件到这里, 或者
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={processing}
              >
                选择文件
              </Button>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {processing && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500 mt-2 text-center">
                正在处理: {currentFile} ({fileQueue.length} 个文件待处理)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFProcessor;
