import jsPDF from 'jspdf';

export const exportSvgToPdf = async (
  svgSources: (SVGElement | string)[], 
  titles: string[],
  filename: string, 
  footerText: string
) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 10;
  const availableWidth = pdfWidth - (margin * 2); // 190mm
  const availableHeight = pdfHeight - (margin * 2) - 15; // 262mm

  for (let i = 0; i < svgSources.length; i++) {
    if (i > 0) pdf.addPage();
    
    const source = svgSources[i];
    let svgString: string;
    
    if (typeof source === 'string') {
      svgString = source;
    } else {
      const clone = source.cloneNode(true) as SVGElement;
      if (!clone.getAttribute('width')) clone.setAttribute('width', '900');
      if (!clone.getAttribute('height')) clone.setAttribute('height', '1200');
      const serializer = new XMLSerializer();
      svgString = serializer.serializeToString(clone);
    }

    // Ensure svg has xml declaration and proper namespaces
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        // High-DPI canvas for ultra-sharp architectural blueprint printing
        const canvas = document.createElement('canvas');
        const targetW = 1800;
        const targetH = img.height > 0 && img.width > 0 ? Math.round((img.height * targetW) / img.width) : 2400;
        canvas.width = targetW;
        canvas.height = targetH;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        // Calculate fitting on A4 page
        const imgAspect = canvas.width / canvas.height;
        let printW = availableWidth;
        let printH = printW / imgAspect;

        if (printH > availableHeight) {
          printH = availableHeight;
          printW = printH * imgAspect;
        }

        const posX = margin + (availableWidth - printW) / 2;
        const posY = margin + 5;
        
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
          pdf.addImage(dataUrl, 'JPEG', posX, posY, printW, printH, undefined, 'FAST');
        } catch (e) {
          console.error('Error adding architectural image to PDF', e);
        }
        
        // Footer watermark & verification
        // Chân trang: vẽ chữ thành ảnh (font của trình duyệt có đủ dấu tiếng Việt; font mặc định của jsPDF thì không)
        try {
          const fc = document.createElement('canvas');
          fc.width = 2400; fc.height = 44;
          const g = fc.getContext('2d')!;
          g.fillStyle = '#ffffff'; g.fillRect(0, 0, fc.width, fc.height);
          g.fillStyle = '#64748b'; g.font = '26px Arial, "Helvetica Neue", sans-serif'; g.textBaseline = 'middle';
          g.fillText(`${footerText} - Bản vẽ ${i + 1}/${svgSources.length}`, 0, fc.height / 2, fc.width);
          pdf.addImage(fc.toDataURL('image/png'), 'PNG', margin, pdfHeight - 9, availableWidth, availableWidth * fc.height / fc.width, undefined, 'FAST');
        } catch { /* bỏ qua chân trang nếu lỗi */ }
        
        URL.revokeObjectURL(url);
        resolve();
      };

      img.onerror = (err) => {
        console.error('Error loading SVG for PDF export:', err);
        URL.revokeObjectURL(url);
        resolve();
      };

      img.src = url;
    });
  }
  
  pdf.save(filename);
};

