<script lang="ts">
	import '#lib/styles/base.css';
	import AppShell from '#lib/ui/AppShell.svelte';

	let { data, children } = $props();
</script>

<AppShell signedIn={data.user !== null} saveLocale={data.user !== null}>
	{@render children()}
</AppShell>
