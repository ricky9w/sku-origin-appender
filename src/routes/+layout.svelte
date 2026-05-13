<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>SKU Origin Appender</title>
	<meta name="description" content="在亚马逊 SKU 标签底部添加 “Made In China” 文本" />
</svelte:head>

{@render children()}
