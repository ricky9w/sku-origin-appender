<script lang="ts">
	import Upload from '@lucide/svelte/icons/upload';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { appendOriginToPdf, triggerDownload } from '$lib/pdf-processor';

	let isDragging = $state(false);
	let progress = $state(0);
	let processing = $state(false);
	let currentFile = $state('');
	let fileQueue = $state<File[]>([]);
	let fileInput: HTMLInputElement | undefined = $state();

	async function processFile(file: File) {
		currentFile = file.name;
		progress = 0;
		const bytes = await appendOriginToPdf(file, {
			onProgress: (pct) => (progress = pct)
		});
		triggerDownload(bytes, `${file.name.replace(/\.pdf$/i, '')}-processed.pdf`);
		progress = 100;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		progress = 0;
	}

	async function processFiles(files: File[]) {
		processing = true;
		fileQueue = files;

		for (const file of files) {
			if (file.type !== 'application/pdf') {
				alert(`文件 ${file.name} 不是有效的PDF文件。`);
				continue;
			}
			try {
				await processFile(file);
			} catch (err) {
				console.error('Error processing PDF:', err);
				alert(`处理PDF文件 ${file.name} 时发生错误, 请重试`);
			}
		}

		processing = false;
		fileQueue = [];
		currentFile = '';
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const files = Array.from(e.dataTransfer?.files ?? []);
		if (files.length > 0) {
			await processFiles(files);
		}
	}

	async function handleFileSelect(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const files = target.files ? Array.from(target.files) : [];
		if (files.length > 0) {
			await processFiles(files);
		}
		target.value = '';
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
	<Card.Root class="w-full max-w-lg">
		<Card.Header>
			<Card.Title>亚马逊 SKU 标签原产国信息添加工具</Card.Title>
			<Card.Description>在标签底部添加 &ldquo;Made In China&rdquo; 文本</Card.Description>
		</Card.Header>
		<Card.Content>
			<div
				role="presentation"
				class="rounded-lg border-2 border-dashed p-8 text-center {isDragging
					? 'border-blue-500 bg-blue-50'
					: 'border-gray-300'}"
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				<div class="flex flex-col items-center justify-center">
					<Upload class="mb-4 h-12 w-12 text-gray-400" />
					<p class="mb-2 text-gray-600">拖拽一个或多个 PDF 文件到这里, 或者</p>
					<Button variant="outline" onclick={() => fileInput?.click()} disabled={processing}>
						选择文件
					</Button>
					<input
						type="file"
						bind:this={fileInput}
						class="hidden"
						accept=".pdf,application/pdf"
						multiple
						onchange={handleFileSelect}
					/>
				</div>
			</div>

			{#if processing}
				<div class="mt-4">
					<Progress value={progress} class="w-full" />
					<p class="mt-2 text-center text-sm text-gray-500">
						正在处理: {currentFile} ({fileQueue.length} 个文件待处理)
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
