<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { LanguageSelector } from '#lib/modules/i18n/index.js';

	let { children }: { children: Snippet } = $props();

	// Bottom bar on phones, rail on wider screens (docs/design-system, "Navigazione e layout").
	const items = $derived([
		{
			href: '/' as const,
			label: m.nav_runs(),
			icon: 'M4 5h16v3H4V5zm0 5.5h16v3H4v-3zM4 16h16v3H4v-3z'
		},
		{
			href: '/pokedex' as const,
			label: m.nav_pokedex(),
			icon: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 2c3.5 0 6.4 2.6 6.9 6H15a3 3 0 00-6 0H5.1C5.6 7.6 8.5 5 12 5zm0 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z'
		},
		{
			href: '/profile' as const,
			label: m.nav_profile(),
			icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z'
		}
	]);

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<div class="shell">
	<header class="top">
		<span class="brand">{m.app_title()}</span>
		<LanguageSelector />
	</header>

	<nav class="nav" aria-label={m.nav_label()}>
		{#each items as item (item.href)}
			<a href={resolve(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={item.icon} /></svg>
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>

	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		min-height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr auto;
		grid-template-areas: 'top' 'content' 'nav';
	}

	.top {
		grid-area: top;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--color-surface-container);
	}

	.brand {
		font-size: var(--text-title-m-size);
		line-height: var(--text-title-m-line);
		font-weight: var(--text-title-m-weight);
		overflow-wrap: anywhere;
	}

	.content {
		grid-area: content;
		min-width: 0;
		padding: var(--space-4);
	}

	.nav {
		grid-area: nav;
		position: sticky;
		bottom: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		background: var(--color-surface-container);
	}

	.nav a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		min-height: 64px;
		padding: var(--space-2);
		color: var(--color-ink-muted);
		text-decoration: none;
		font-size: var(--text-label-size);
		line-height: var(--text-label-line);
		font-weight: var(--text-label-weight);
	}

	.nav a[aria-current='page'] {
		color: var(--color-on-primary-container);
	}

	.nav a[aria-current='page'] svg {
		background: var(--color-primary-container);
		border-radius: var(--radius-full);
	}

	.nav svg {
		width: 56px;
		height: 32px;
		padding: var(--space-1) 16px;
		fill: currentColor;
	}

	@media (min-width: 600px) {
		.shell {
			grid-template-columns: 96px 1fr;
			grid-template-rows: auto 1fr;
			grid-template-areas: 'top top' 'nav content';
		}

		.nav {
			position: static;
			grid-template-columns: 1fr;
			align-content: start;
			gap: var(--space-2);
			padding: var(--space-4) 0;
		}

		.content {
			padding: var(--space-8);
		}
	}
</style>
