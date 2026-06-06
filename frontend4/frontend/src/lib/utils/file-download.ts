import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type Cell = string | number | null | undefined;

function escapeCsvCell(cell: Cell): string {
  const s = cell == null ? "" : String(cell);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(headers: string[], rows: Cell[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function downloadCSV(filename: string, headers: string[], rows: Cell[][]): void {
  // BOM so Excel opens UTF-8 correctly
  const csv = "﻿" + toCSV(headers, rows);
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

export interface PdfTable {
  headers: string[];
  rows: Cell[][];
  /** Relative weights used to distribute column widths. Defaults to equal. */
  colWeights?: number[];
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  meta?: Record<string, string>;
  table?: PdfTable;
  /** Optional summary lines printed before the table. */
  summary?: { label: string; value: string }[];
  /** Footer note (small text under the table). */
  footerNote?: string;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;

export async function buildSimpleReportPdf(opts: PdfReportOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawHeaderBar = () => {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 70, width: PAGE_WIDTH, height: 70, color: rgb(0.11, 0.47, 0.44) });
    page.drawText("GlimmoraTeam", { x: MARGIN, y: PAGE_HEIGHT - 30, size: 14, font: bold, color: rgb(1, 1, 1) });
    if (opts.subtitle) {
      page.drawText(opts.subtitle, { x: MARGIN, y: PAGE_HEIGHT - 50, size: 10, font: regular, color: rgb(0.8, 0.95, 0.93) });
    }
  };

  drawHeaderBar();
  y = PAGE_HEIGHT - 100;

  page.drawText(opts.title, { x: MARGIN, y, size: 18, font: bold, color: rgb(0.13, 0.15, 0.18) });
  y -= 18;
  page.drawText(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, {
    x: MARGIN, y, size: 9, font: regular, color: rgb(0.45, 0.45, 0.5),
  });
  y -= 14;

  if (opts.meta) {
    for (const [k, v] of Object.entries(opts.meta)) {
      page.drawText(`${k}: ${v}`, { x: MARGIN, y, size: 9, font: regular, color: rgb(0.3, 0.3, 0.4) });
      y -= 12;
    }
  }

  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.85, 0.87, 0.9) });
  y -= 18;

  if (opts.summary && opts.summary.length > 0) {
    for (const s of opts.summary) {
      page.drawText(s.label, { x: MARGIN, y, size: 10, font: bold, color: rgb(0.13, 0.15, 0.18) });
      page.drawText(s.value, { x: MARGIN + 180, y, size: 10, font: regular, color: rgb(0.25, 0.27, 0.32) });
      y -= 14;
    }
    y -= 8;
  }

  if (opts.table) {
    const usable = PAGE_WIDTH - MARGIN * 2;
    const weights = opts.table.colWeights ?? Array(opts.table.headers.length).fill(1);
    const sumW = weights.reduce((a, b) => a + b, 0);
    const colWidths = weights.map((w) => (w / sumW) * usable);
    const colX: number[] = [];
    let x = MARGIN;
    for (const w of colWidths) { colX.push(x); x += w; }

    const truncate = (text: string, width: number, font: typeof regular, size: number): string => {
      if (font.widthOfTextAtSize(text, size) <= width - 4) return text;
      let lo = 0, hi = text.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        const candidate = text.slice(0, mid) + "...";
        if (font.widthOfTextAtSize(candidate, size) <= width - 4) lo = mid;
        else hi = mid - 1;
      }
      return text.slice(0, lo) + "...";
    };

    const drawRow = (cells: string[], isHeader: boolean) => {
      if (isHeader) {
        page.drawRectangle({ x: MARGIN - 4, y: y - 4, width: usable + 8, height: 18, color: rgb(0.95, 0.97, 0.97) });
      }
      cells.forEach((cell, ci) => {
        const size = isHeader ? 9 : 8.5;
        const font = isHeader ? bold : regular;
        const text = truncate(cell, colWidths[ci], font, size);
        page.drawText(text, {
          x: colX[ci], y, size, font,
          color: isHeader ? rgb(0.13, 0.15, 0.18) : rgb(0.25, 0.27, 0.32),
        });
      });
      y -= 16;
    };

    drawRow(opts.table.headers, true);
    for (const row of opts.table.rows) {
      if (y < MARGIN + 30) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        drawHeaderBar();
        y = PAGE_HEIGHT - 100;
        drawRow(opts.table.headers, true);
      }
      drawRow(row.map((c) => (c == null ? "" : String(c))), false);
    }
  }

  if (opts.footerNote) {
    y -= 10;
    page.drawText(opts.footerNote, { x: MARGIN, y, size: 7.5, font: regular, color: rgb(0.6, 0.6, 0.65) });
  }

  page.drawText(`GlimmoraTeam | Confidential | ${new Date().toISOString().split("T")[0]}`, {
    x: MARGIN, y: 30, size: 8, font: regular, color: rgb(0.65, 0.65, 0.7),
  });

  return pdfDoc.save();
}

export async function downloadPdf(filename: string, opts: PdfReportOptions): Promise<void> {
  const bytes = await buildSimpleReportPdf(opts);
  triggerDownload(new Blob([bytes as BlobPart], { type: "application/pdf" }), filename);
}

export function todayStamp(): string {
  return new Date().toISOString().split("T")[0];
}
