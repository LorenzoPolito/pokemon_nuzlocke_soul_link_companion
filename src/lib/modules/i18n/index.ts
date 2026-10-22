/** Public API of the language module: the selector component and the active locale helpers. */
export { default as LanguageSelector } from './ui/LanguageSelector.svelte';
export { getLocale, locales } from '#lib/paraglide/runtime.js';
export type { Locale } from '#lib/paraglide/runtime.js';
