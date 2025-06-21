import React, { useState } from 'react';
import { SquareDashedMousePointer, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { generatePDFFromMarkdown } from '@/lib/pdf-generator';

interface DiagramToolbarProps {
  isInspectMode: boolean;
  onInspectToggle: () => void;
  hasAnalysis: boolean;
  analysisContent?: string;
  analysisTitle?: string;
}

export function DiagramToolbar({ 
  isInspectMode, 
  onInspectToggle, 
  hasAnalysis, 
  analysisContent,
  analysisTitle = 'Architecture Analysis'
}: DiagramToolbarProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  console.log('DiagramToolbar - hasAnalysis:', hasAnalysis, 'analysisContent length:', analysisContent?.length);

  const handleDownloadPDF = async () => {
    if (!analysisContent) return;
    
    setIsGeneratingPDF(true);
    try {
      await generatePDFFromMarkdown(analysisContent, analysisTitle);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isInspectMode ? "default" : "ghost"}
              size="sm"
              onClick={onInspectToggle}
              className={`w-9 h-9 p-0 rounded-lg ${
                isInspectMode 
                  ? "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900" 
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <SquareDashedMousePointer className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Inspect Components</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadPDF}
              className={`w-9 h-9 p-0 rounded-lg ${
                hasAnalysis && !isGeneratingPDF
                  ? "hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
              disabled={!hasAnalysis || isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasAnalysis ? 'Download Analysis as PDF' : 'Analysis required for PDF download'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}