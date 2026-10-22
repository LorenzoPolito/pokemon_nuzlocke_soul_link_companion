<script lang="ts">
	import '#lib/styles/base.css';
	import AppShell from '#lib/ui/AppShell.svelte';

	let { children } = $props();
</script>

<AppShell>{@render children()}</AppShell>
