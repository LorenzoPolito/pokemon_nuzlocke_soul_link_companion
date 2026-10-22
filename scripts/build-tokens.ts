/**
 * Generates src/lib/styles/tokens.css from the design system tokens
 * (docs/design-system/tokens.json). Run it with `npm run tokens:build`; a test checks
 * that the committed file is up to date.
 */
import { readFileSync, writeFileSync } from 'node:fs';

type ColorToken = { name: string; value: string | { light: string; dark: string } };
type Tokens = {
	color: { tokens: ColorToken[] };
	type: { families: Record<string, string>; groups: { styles: TextStyle[] }[] };
	spacing: { tokens: { name: string; value: string }[] };
	radius: { tokens: { name: string; value: string }[] };
};
type TextStyle = { name: string; fontSize: string; lineHeight: string; fontWeight: number };

const resolve = (value: string) => value.replace(/^\{([\w-]+)\}$/, 'var(--color-$1)');

/** Builds the CSS text for a token document. */
export function buildTokensCss(tokens: Tokens): string {
	const colors = (theme: 'light' | 'dark', indent: string) =>
		tokens.color.tokens
			.map((t) => {
				// Some tokens (the type colors) have one value for both themes.
				const value = typeof t.value === 'string' ? t.value : t.value[theme];
				return `${indent}--color-${t.name}: ${resolve(value)};`;
			})
			.join('\n');
	const fixed = [
		...Object.entries(tokens.type.families).map(([n, v]) => `\t--font-${n}: ${v};`),
		...tokens.type.groups.flatMap((g) =>
			g.styles.flatMap((s) => [
				`\t--text-${s.name}-size: ${s.fontSize};`,
				`\t--text-${s.name}-line: ${s.lineHeight};`,
				`\t--text-${s.name}-weight: ${s.fontWeight};`
			])
		),
		...tokens.spacing.tokens.map((t) => `\t--${t.name}: ${t.value};`),
		...tokens.radius.tokens.map((t) => `\t--${t.name}: ${t.value};`)
	].join('\n');
	return `/* Generated from docs/design-system/tokens.json by scripts/build-tokens.ts: do not edit. */

:root {
	color-scheme: light dark;
${colors('light', '\t')}
${fixed}
}

@media (prefers-color-scheme: dark) {
	:root:not([data-theme='light']) {
${colors('dark', '\t\t')}
	}
}

:root[data-theme='dark'] {
${colors('dark', '\t')}
}
`;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const tokens: Tokens = JSON.parse(readFileSync('docs/design-system/tokens.json', 'utf8'));
	writeFileSync('src/lib/styles/tokens.css', buildTokensCss(tokens));
	console.log('Wrote src/lib/styles/tokens.css');
}
