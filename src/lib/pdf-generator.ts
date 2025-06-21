import jsPDF from 'jspdf';
import { marked } from 'marked';

export async function generatePDFFromMarkdown(markdown: string, title: string): Promise<void> {
  // Convert markdown to HTML
  const html = await marked.parse(markdown);
  
  // Create a new jsPDF instance
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set font
  doc.setFontSize(12);
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 20, 20);
  
  // Parse HTML and add content
  // Since jsPDF doesn't natively support HTML, we'll extract text content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  let yPosition = 40;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;
  const maxWidth = 170; // A4 width minus margins
  
  // Process each element
  const elements = tempDiv.querySelectorAll('h1, h2, h3, p, li, strong');
  
  elements.forEach((element) => {
    const text = element.textContent || '';
    const lines = doc.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    // Set font size based on element type
    if (element.tagName === 'H1') {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
    } else if (element.tagName === 'H2') {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
    } else if (element.tagName === 'H3') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
    } else if (element.tagName === 'STRONG') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
    }
    
    // Add text
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
    
    // Add extra space after headings
    if (['H1', 'H2', 'H3'].includes(element.tagName)) {
      yPosition += 5;
    }
  });
  
  // Save the PDF
  doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`);
}