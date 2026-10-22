<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, setLocale, type Locale } from '#lib/paraglide/runtime.js';

	const label = (locale: Locale) => (locale === 'it' ? m.i18n_locale_it() : m.i18n_locale_en());
</script>

<nav aria-label={m.i18n_selector_label()} class="language-selector">
	{#each locales as locale (locale)}
		<button
			type="button"
			lang={locale}
			aria-pressed={locale === getLocale()}
			onclick={() => setLocale(locale)}
		>
			{label(locale)}
		</button>
	{/each}
</nav>

<style>
	.language-selector {
		display: flex;
		gap: var(--space-1);
	}

	button {
		min-width: 48px;
		min-height: 48px;
		padding: 0 var(--space-3);
		border: 1px solid var(--color-ink-muted);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-ink);
		font-size: var(--text-label-size);
		line-height: var(--text-label-line);
		font-weight: var(--text-label-weight);
		cursor: pointer;
	}

	button[aria-pressed='true'] {
		border-color: var(--color-primary-container);
		background: var(--color-primary-container);
		color: var(--color-on-primary-container);
	}
</style>
