/**
 * Professional Technical Document Formatter for Yohu Build AI
 * Formats unstructured AI / template text into clean, hierarchical HTML
 * with distinct subsection headings, indented bullet lists, and paragraphs.
 * Fully cleans separated Vietnamese unicode combining diacritics and markdown artifacts.
 * Fully compatible with screen display, PDF rendering, and Microsoft Word import.
 */

/**
 * Cleans separated Vietnamese combining diacritics and normalizes text to Unicode NFC.
 * Fixes issues where AI or fonts output broken decomposed accents like:
 * "THIÊ ́ T KÊ ́" -> "THIẾT KẾ"
 * "đâ ̀ u" -> "đầu"
 * "tâ ̀ ng" -> "tầng"
 * "Tô ́ i" -> "Tối"
 * "kê ́ t nô ́ i" -> "kết nối"
 * "nhu câ ̀ u" -> "nhu cầu"
 * "chi tiê ́ t" -> "chi tiết"
 * "hô ̀ sơ" -> "hồ sơ"
 */
export function cleanAndNormalizeVietnameseText(input: string): string {
  if (!input) return '';

  let str = input;

  // 0. Clean LaTeX math formatting and stray dollar signs (e.g. $110mm$, $200 \times 300$, $100m²$, $$...$$)
  // Fixes user-reported font glitch where text appears with $ like "$110mm$"
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, '$1'); // Double dollar block math
  str = str.replace(/\$([^\$\n]+)\$/g, '$1'); // Single dollar inline math (e.g. $110mm$ -> 110mm)
  
  // Replace LaTeX math symbols with clean unicode symbols
  str = str.replace(/\\times/g, '×')
           .replace(/\\cdot/g, '·')
           .replace(/\\approx/g, '≈')
           .replace(/\\le\b/g, '≤')
           .replace(/\\ge\b/g, '≥')
           .replace(/\\pm/g, '±')
           .replace(/\\ne\b/g, '≠')
           .replace(/\\degree/g, '°')
           .replace(/\^\\circ/g, '°')
           .replace(/\\%/g, '%')
           .replace(/\\_/g, '_')
           .replace(/\\\$/g, '$');
  
  // Clean stray isolated dollar signs around dimensions or measurements like $ 110mm or 110mm $
  str = str.replace(/\$\s*(\d+(?:[.,]\d+)?\s*(?:mm|cm|m|m²|m³|kg|tấn|công|bộ|viên|lít|md|bar|%|đ|VNĐ|VND|tỷ|triệu))\b/gi, '$1');
  str = str.replace(/\b(\d+(?:[.,]\d+)?\s*(?:mm|cm|m|m²|m³|kg|tấn|công|bộ|viên|lít|md|bar|%|đ|VNĐ|VND|tỷ|triệu))\s*\$/gi, '$1');

  // 1. Remove space, zero-width space, or non-breaking space before combining diacritical marks
  // Combining Diacritical Marks: U+0300 to U+036F, U+1DC0 to U+1DFF, U+20D0 to U+20FF, U+FE20 to U+FE2F
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0\uFEFF]+([\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F])/g, '$1$2');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0\uFEFF]+([\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F])/g, '$1$2');

  // 2. Replace standalone accent marks / modifier accents after base letters with combining equivalents
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u00B4\u02CA]/g, '$1\u0301');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u0060\u02CB]/g, '$1\u0300');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u02C6]/g, '$1\u0302');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u02DC~]/g, '$1\u0303');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u02D9\u00B7]/g, '$1\u0323');

  // 3. Normalize to Unicode NFC (Precomposed characters)
  str = str.normalize('NFC');

  return str;
}

/**
 * Strips raw markdown tokens into clean plain text for clipboard copying or text exports.
 */
export function cleanMarkdownForPlainText(rawText: string): string {
  if (!rawText) return '';

  const clean = cleanAndNormalizeVietnameseText(rawText);
  return clean
    .split('\n')
    .map(line => {
      let l = line.trim();
      // Remove heading markdown hashes and asterisks
      if (/^#{1,6}\s+/.test(l)) {
        l = l.replace(/^#{1,6}\s+/, '').replace(/^\*\*|\*\*$/g, '').replace(/^\*|\*$/g, '').trim();
      }
      // Standardize bullet points
      if (/^[-*+•❖✔✓]\s+/.test(l)) {
        l = '- ' + l.replace(/^[-*+•❖✔✓]\s+/, '');
      }
      // Remove bold and italic asterisks
      l = l.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`([^`]+)`/g, '$1');
      return l;
    })
    .join('\n');
}

/**
 * Parses raw text into structured HTML with proper typographic hierarchy,
 * indented lists, and clean paragraph breaks.
 */
export function formatSectionContentToHtml(rawText: string, isWordExport: boolean = false): string {
  if (!rawText) return '';

  // Clean Vietnamese diacritics first
  const sanitizedText = cleanAndNormalizeVietnameseText(rawText);

  const lines = sanitizedText.split('\n');
  const htmlParts: string[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length === 0) return;

    if (isWordExport) {
      // Word-compatible list styling
      htmlParts.push(`
        <ul style="margin: 6pt 0 10pt 20pt; padding-left: 8pt; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #1e293b;">
          ${currentListItems.map(item => `<li style="margin-bottom: 4pt; text-align: justify;">${item}</li>`).join('')}
        </ul>
      `);
    } else {
      // Modern web / print styling
      htmlParts.push(`
        <ul class="my-3 ml-5 space-y-1.5 list-disc text-slate-800 dark:text-slate-200">
          ${currentListItems.map(item => `<li class="leading-relaxed pl-1">${item}</li>`).join('')}
        </ul>
      `);
    }
    currentListItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    let line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // 1. Detect Markdown Headings (###, ####, ##, #) or Numbered Subheadings (1.1, 1.2, a), b), etc.)
    const isMarkdownHeading = /^#{1,6}\s+/.test(line);
    const isNumberedSubheading = /^(?:\d+\.\d+|\b[a-zA-Z]\)|\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\.\d+)\s+/.test(line);
    const isKeywordSubheading = /^(?:Giai đoạn \d+|Hạng mục \d+|Phần \d+|Bước \d+|Tiêu chí \d+|Phương án \d+):/i.test(line);

    if (isMarkdownHeading || isNumberedSubheading || isKeywordSubheading) {
      flushList();
      
      // Strip heading hashes and any surrounding bold/italic asterisks from title
      let cleanTitle = line
        .replace(/^#{1,6}\s+/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^\*|\*$/g, '')
        .trim();

      // Inline format any sub-bolding in title if present
      cleanTitle = formatInlineFormatting(cleanTitle);

      if (isWordExport) {
        htmlParts.push(`
          <h4 style="font-family: Arial, sans-serif; font-size: 11.5pt; font-weight: bold; color: #7f1d1d; margin-top: 14pt; margin-bottom: 5pt; border-bottom: 1px solid #fca5a5; padding-bottom: 2pt;">
            ${cleanTitle}
          </h4>
        `);
      } else {
        htmlParts.push(`
          <h4 class="text-sm sm:text-base font-bold text-red-900 dark:text-red-300 mt-4 mb-2 pb-1 border-b border-red-200 dark:border-red-900/50 flex items-center gap-2">
            <span class="w-1.5 h-3.5 bg-red-700 rounded-sm inline-block"></span>
            <span>${cleanTitle}</span>
          </h4>
        `);
      }
      continue;
    }

    // 2. Detect Bullet Lists (-, *, +, •, ❖, ✔, ✓)
    const bulletMatch = line.match(/^[-*+•❖✔✓]\s+(.+)/);
    if (bulletMatch) {
      currentListItems.push(formatInlineFormatting(bulletMatch[1]));
      continue;
    }

    // 3. Detect Numbered List (1. , 2. , 3. ...)
    const numberedMatch = line.match(/^(\d+)\.\s+([^-*+•].+)/);
    if (numberedMatch && !isNumberedSubheading) {
      currentListItems.push(formatInlineFormatting(numberedMatch[2]));
      continue;
    }

    // 4. Regular Paragraph / Text block
    flushList();

    const formattedLine = formatInlineFormatting(line);

    if (isWordExport) {
      htmlParts.push(`
        <p style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.65; margin-bottom: 8pt; text-align: justify; color: #1e293b;">
          ${formattedLine}
        </p>
      `);
    } else {
      htmlParts.push(`
        <p class="mb-2.5 leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
          ${formattedLine}
        </p>
      `);
    }
  }

  flushList();

  return htmlParts.join('\n');
}

/**
 * Formats inline bold (**text** or __text__), italics (*text* or _text_), and highlighted code parameters.
 */
function formatInlineFormatting(text: string): string {
  if (!text) return '';

  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; color:#b91c1c; padding:1px 4px; border-radius:3px; font-family:monospace;">$1</code>');
}
