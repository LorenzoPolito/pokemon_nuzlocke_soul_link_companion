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
