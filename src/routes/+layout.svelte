<script lang="ts">
	import '#lib/styles/base.css';
	import AppShell from '#lib/ui/AppShell.svelte';

	let { data, children } = $props();
</script>

<AppShell
	signedIn={data.user !== null}
	isAdmin={data.user?.role === 'admin'}
	saveLocale={data.user !== null}
>
	{@render children()}
</AppShell>
