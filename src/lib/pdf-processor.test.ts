import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import { appendOriginToPdf } from './pdf-processor';

async function buildFixturePdf(pageCount = 2): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pageCount; i++) {
		doc.addPage([200, 120]);
	}
	return doc.save();
}

async function extractAllContent(bytes: Uint8Array): Promise<string> {
	const doc = await PDFDocument.load(bytes);
	const decoder = new TextDecoder('latin1');
	const chunks: string[] = [];
	for (const [, obj] of doc.context.enumerateIndirectObjects()) {
		if (obj instanceof PDFRawStream) {
			try {
				chunks.push(decoder.decode(decodePDFRawStream(obj).decode()));
			} catch {
				// non-decodable stream
			}
		}
	}
	// pdf-lib writes drawn text as <hex> literals inside content streams (Tj/TJ),
	// so decode any <...> hex blocks alongside the raw operator output.
	const raw = chunks.join('\n');
	const decoded = raw.replace(/<([0-9A-Fa-f]+)>/g, (_, hex) => {
		const clean = hex.replace(/\s+/g, '');
		if (clean.length % 2 !== 0) return _;
		let out = '';
		for (let i = 0; i < clean.length; i += 2) {
			out += String.fromCharCode(parseInt(clean.substring(i, i + 2), 16));
		}
		return out;
	});
	return raw + '\n' + decoded;
}

describe('appendOriginToPdf', () => {
	it('preserves the page count', async () => {
		const fixture = await buildFixturePdf(3);
		const out = await appendOriginToPdf(fixture);
		const doc = await PDFDocument.load(out);
		expect(doc.getPageCount()).toBe(3);
	});

	it('embeds the default "Made In China" text once per page', async () => {
		const fixture = await buildFixturePdf(2);
		const out = await appendOriginToPdf(fixture);
		const content = await extractAllContent(out);
		const matches = content.match(/Made In China/g) ?? [];
		expect(matches.length).toBe(2);
	});

	it('honors a custom text option', async () => {
		const fixture = await buildFixturePdf(1);
		const out = await appendOriginToPdf(fixture, { text: 'Made In Vietnam' });
		const content = await extractAllContent(out);
		expect(content).toContain('Made In Vietnam');
		expect(content).not.toContain('Made In China');
	});

	it('reports monotonically increasing progress that reaches ≥ 90', async () => {
		const fixture = await buildFixturePdf(4);
		const updates: number[] = [];
		await appendOriginToPdf(fixture, {
			onProgress: (pct) => updates.push(pct)
		});
		expect(updates.length).toBeGreaterThan(0);
		for (let i = 1; i < updates.length; i++) {
			expect(updates[i]).toBeGreaterThanOrEqual(updates[i - 1]);
		}
		expect(updates[0]).toBe(20);
		expect(updates[updates.length - 1]).toBeGreaterThanOrEqual(90);
	});

	it('accepts an ArrayBuffer as input', async () => {
		const fixture = await buildFixturePdf(1);
		const buf = fixture.buffer.slice(
			fixture.byteOffset,
			fixture.byteOffset + fixture.byteLength
		) as ArrayBuffer;
		const out = await appendOriginToPdf(buf);
		const doc = await PDFDocument.load(out);
		expect(doc.getPageCount()).toBe(1);
	});

	it('accepts a Blob as input', async () => {
		const fixture = await buildFixturePdf(1);
		const blob = new Blob([fixture as BlobPart], { type: 'application/pdf' });
		const out = await appendOriginToPdf(blob);
		const doc = await PDFDocument.load(out);
		expect(doc.getPageCount()).toBe(1);
	});
});
