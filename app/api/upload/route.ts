import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 14_000;

const normalizeText = (value: string) =>
  value
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const truncateText = (value: string) => {
  const normalized = normalizeText(value);

  if (normalized.length <= MAX_TEXT_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_TEXT_LENGTH)}\n\n[Notes truncated to ${MAX_TEXT_LENGTH} characters]`;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Please upload a file up to 8 MB.' },
        { status: 413 },
      );
    }

    let text = '';
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (file.type === 'application/pdf' || extension === 'pdf') {
      const { PDFParse } = await import('pdf-parse');
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });

      try {
        const result = await parser.getText();
        text = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx') {
      const { default: mammoth } = await import('mammoth');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.type === 'text/plain' || extension === 'txt') {
      text = await file.text();
    } else if (file.type === 'text/markdown' || extension === 'md') {
      text = await file.text();
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    return NextResponse.json({ text: truncateText(text), filename: file.name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
