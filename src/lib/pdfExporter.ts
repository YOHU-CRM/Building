import jsPDF from 'jspdf';

export const exportSvgToPdf = async (
  svgSources: (SVGElement | string)[], 
  titles: string[],
  filename: string, 
  footerText: string
) => {
  // Mỗi trang tự chọn A4 NGANG hoặc DỌC theo dáng hình (mặt bằng nhà ngang → trang ngang, chữ & nét to hơn)
  let pdf: jsPDF | null = null;
  const margin = 8;

  for (let i = 0; i < svgSources.length; i++) {
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
        const landscape = img.width > 0 && img.height > 0 && img.width / img.height > 1.05;
        if (!pdf) pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
        else pdf.addPage('a4', landscape ? 'landscape' : 'portrait');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = pdfHeight - (margin * 2) - 6;
        // High-DPI canvas for ultra-sharp architectural blueprint printing
        // Vẽ SVG ra ảnh ở độ phân giải cao (≈ 3 lần khổ gốc, ~450 dpi trên A4) để chữ nhỏ vẫn nét khi in / phóng to trên điện thoại
        const canvas = document.createElement('canvas');
        const targetW = Math.min(4200, Math.max(3300, Math.round((img.width || 1120) * 3)));
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
        const posY = margin;
        
        try {
          // PNG (không nén mất nét như JPEG): bản vẽ nhiều nét mảnh + chữ nhỏ, màu phẳng → PNG nét hơn và dung lượng vẫn nhỏ
          let dataUrl = '';
          try { dataUrl = canvas.toDataURL('image/png'); } catch { dataUrl = ''; }
          if (dataUrl && dataUrl.length < 14_000_000) pdf.addImage(dataUrl, 'PNG', posX, posY, printW, printH, undefined, 'FAST');
          else pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', posX, posY, printW, printH, undefined, 'FAST');
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
  
  if (pdf) (pdf as jsPDF).save(filename);
};

