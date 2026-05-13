import { PDFDocument, StandardFonts } from 'pdf-lib';

export type ProgressCallback = (pct: number) => void;

export interface AppendOriginOptions {
	onProgress?: ProgressCallback;
	text?: string;
}

const DEFAULT_TEXT = 'Made In China';
const FONT_SIZE = 6;

export async function appendOriginToPdf(
	source: File | Blob | ArrayBuffer | Uint8Array,
	options: AppendOriginOptions = {}
): Promise<Uint8Array> {
	const text = options.text ?? DEFAULT_TEXT;
	const onProgress = options.onProgress;

	onProgress?.(20);
	const bytes = await toUint8Array(source);
	onProgress?.(40);

	const pdfDoc = await PDFDocument.load(bytes);
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	onProgress?.(50);

	const pages = pdfDoc.getPages();
	const total = pages.length || 1;

	pages.forEach((page, index) => {
		const { width } = page.getSize();
		const textWidth = font.widthOfTextAtSize(text, FONT_SIZE);
		page.drawText(text, {
			x: (width - textWidth) / 2,
			y: FONT_SIZE * 1.5,
			size: FONT_SIZE,
			font
		});
		onProgress?.(50 + Math.floor(((index + 1) / total) * 30));
	});

	const out = await pdfDoc.save();
	onProgress?.(90);
	return out;
}

export function triggerDownload(bytes: Uint8Array, filename: string): void {
	const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

async function toUint8Array(source: File | Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
	if (source instanceof Uint8Array) return source;
	if (source instanceof ArrayBuffer) return new Uint8Array(source);
	const buffer = await source.arrayBuffer();
	return new Uint8Array(buffer);
}
