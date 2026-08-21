// ---------------------------------------------------------------------------
// OCR service — extracts text from images and scanned PDFs.
//
// - Images (png/jpg/webp): tesseract.js (WASM, runs in Node).
// - PDFs: pdf-parse only reads the embedded text layer, so scanned PDFs come
//   back empty. Here we render each page to a bitmap via pdfjs-dist +
//   @napi-rs/canvas and OCR the page with tesseract.js.
//
// Language data is downloaded by tesseract.js on first use (CDN, cached
// locally afterwards). No API keys required.
// ---------------------------------------------------------------------------
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { logger } from '../utils/logger.js';

const require = createRequire(import.meta.url);

// Cache tesseract's downloaded language/core files under node_modules/.cache so
// they never land in the project root or git.
const OCR_CACHE_DIR = path.join(process.cwd(), 'node_modules', '.cache', 'ocr');
fs.mkdirSync(OCR_CACHE_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Shared tesseract worker (lazy singleton; terminated when the process exits)
// ---------------------------------------------------------------------------
let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && m.progress >= 1) {
          logger.debug(`[OCR] tesseract progress 100%`);
        }
      },
      // Downloads language/core data from the default CDN into this cache dir.
      cachePath: OCR_CACHE_DIR,
    }).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

/** OCR a single image buffer (png/jpg/webp/bmp) → extracted text. */
export async function ocrImageBuffer(buffer) {
  const worker = await getWorker();
  const { data } = await worker.recognize(buffer);
  return (data?.text || '').trim();
}

// ---------------------------------------------------------------------------
// Scanned PDF → render pages → OCR each page
// ---------------------------------------------------------------------------
const workerSrc = pathToFileURL(
  require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
).toString();

const standardFontDir = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'standard_fonts'
);

function getDocumentParams(buffer) {
  return {
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
    useWorkerFetch: false,
    standardFontDataUrl: pathToFileURL(standardFontDir + path.sep).toString(),
    canvasFactory: {
      create: (width, height) => createCanvas(width, height),
      reset: (canvas, width, height) => {
        canvas.width = width;
        canvas.height = height;
      },
      destroy: (canvas) => {
        canvas.width = 0;
        canvas.height = 0;
      },
    },
  };
}

/**
 * Extract the embedded text layer of a PDF (the fast path for text-based PDFs,
 * i.e. not scanned). Returns per-page text joined with blank lines.
 */
export async function extractPdfTextLayer(buffer) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const loadingTask = pdfjsLib.getDocument(getDocumentParams(buffer));
  const doc = await loadingTask.promise;

  try {
    const pageTexts = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      // Rebuild lines from item positions: text items carry no EOL markers, so
      // group items whose baseline Y differs by more than a small tolerance.
      const lines = [];
      let currentLine = [];
      let lastY = null;
      for (const it of textContent.items || []) {
        const y = it.transform ? it.transform[5] : (lastY ?? 0);
        if (lastY !== null && Math.abs(y - lastY) > 2 && currentLine.length > 0) {
          lines.push(currentLine.join(' '));
          currentLine = [];
        }
        currentLine.push(it.str);
        lastY = y;
      }
      if (currentLine.length > 0) lines.push(currentLine.join(' '));
      const text = lines
        .map(l => l.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');
      if (text) pageTexts.push(text);
      page.cleanup();
    }
    return pageTexts.join('\n\n');
  } finally {
    // pdfjs-dist v6: destroy() lives on the loading task, not the document.
    await loadingTask.destroy();
  }
}

/** Render a scanned PDF to text via per-page OCR. */
export async function ocrPdfBuffer(buffer) {
  // pdfjs-dist needs its worker file; in Node this spins up a worker_thread.
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const loadingTask = pdfjsLib.getDocument(getDocumentParams(buffer));
  const doc = await loadingTask.promise;

  try {
    const pageTexts = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 }); // 2x for better OCR accuracy
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;
      const png = canvas.toBuffer('image/png');

      const text = await ocrImageBuffer(png);
      logger.info(`[OCR] PDF page ${pageNum}/${doc.numPages} → ${text.length} chars`);
      if (text) pageTexts.push(text);

      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
    }
    return pageTexts.join('\n\n');
  } finally {
    // pdfjs-dist v6: destroy() lives on the loading task, not the document.
    await loadingTask.destroy();
  }
}

// ---------------------------------------------------------------------------
// Convenience: OCR a buffer regardless of kind (image file or PDF)
// ---------------------------------------------------------------------------
export async function ocrBuffer(buffer, kind = 'image') {
  try {
    if (kind === 'pdf') return await ocrPdfBuffer(buffer);
    return await ocrImageBuffer(buffer);
  } catch (err) {
    logger.error(`[OCR] ${kind} OCR failed:`, { error: err.message });
    throw new Error(`OCR failed for ${kind}: ${err.message}`);
  }
}
