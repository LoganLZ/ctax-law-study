export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'table';
  text: string;
}

export function formatContent(raw: string): ContentBlock[] {
  // Step 1: Clean OCR artifacts
  let content = raw
    .replace(/\nE\b/g, '\n')
    .replace(/ E$/gm, '')
    .replace(/E$/gm, '')
    .replace(/ 新$/gm, '')
    .replace(/\n[①②③④⑤⑥⑦⑨⑩]\n/g, '\n')
    .replace(/\n[①②③④⑤⑥⑦⑨⑩]$/gm, '');

  // Step 2: Process lines into logical blocks
  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let textBuffer: string[] = [];
  let tableBuffer: string[] = [];
  let inTableMode = false;

  // Table line: has 3+ consecutive spaces (column gap) or is a separator line
  const isTableLine = (s: string) => /\S {3,}\S/.test(s) || /^—+$/.test(s.trim());

  // Heading: Chinese numeral section markers like （一）
  const isHeading = (s: string) => /^（[一二三四五六七八九十]+）/.test(s);

  // List item: numbered markers like （1）, 1.
  const isListItem = (s: string) => /^（\d+）|^(\d+)\./.test(s);

  function flushText() {
    if (textBuffer.length === 0) return;
    const merged = textBuffer.join('');
    if (merged.length === 0) return;
    blocks.push({
      type: isHeading(merged) ? 'heading' : 'paragraph',
      text: merged,
    });
    textBuffer = [];
  }

  function flushTable() {
    if (tableBuffer.length === 0) return;
    blocks.push({ type: 'table', text: tableBuffer.join('\n') });
    tableBuffer = [];
    inTableMode = false;
  }

  for (const line of lines) {
    const t = line.trim();

    if (t === '') {
      // Empty line = block boundary
      flushText();
      flushTable();
      continue;
    }

    // Skip standalone numbered circle markers (OCR artifacts)
    if (/^[①②③④⑤⑥⑦⑨⑩]$/.test(t)) continue;

    const table = isTableLine(t);
    const structural = isHeading(t) || isListItem(t);

    if (table) {
      if (!inTableMode) {
        flushText();
        inTableMode = true;
      }
      tableBuffer.push(t);
    } else if (structural && (textBuffer.length > 0 || inTableMode)) {
      // Structural marker starts new block
      flushText();
      flushTable();
      textBuffer = [t];
    } else {
      // Regular text: exit table mode if needed
      if (inTableMode) flushTable();
      textBuffer.push(t);
    }
  }

  flushText();
  flushTable();

  return blocks;
}