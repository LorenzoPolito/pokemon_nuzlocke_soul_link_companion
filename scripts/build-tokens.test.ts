import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildTokensCss } from './build-tokens.ts';

const tokens = JSON.parse(readFileSync('docs/design-system/tokens.json', 'utf8'));
type Theme = 'light' | 'dark';
type TokenEntry = { name: string; value: string | { light: string; dark: string } };

const color = (name: string, theme: Theme): string => {
	const raw = (tokens.color.tokens as TokenEntry[]).find((t) => t.name === name)?.value;
	// Some tokens (the type colors) have one value for both themes.
	const value = typeof raw === 'string' ? raw : raw?.[theme];
	if (!value) throw new Error(`Unknown token ${name}`);
	return value.startsWith('{') ? color(value.slice(1, -1), theme) : value;
};

function luminance(hex: string): number {
	const channel = (i: number) => {
		const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

/** WCAG 2.x contrast ratio between two colors. */
function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

describe('design tokens', () => {
	it('keep the committed CSS up to date', () => {
		expect(readFileSync('src/lib/styles/tokens.css', 'utf8')).toBe(buildTokensCss(tokens));
	});

	// Text on its background must reach 4.5:1 (WCAG AA) in both themes.
	const textPairs: [string, string][] = [
		['ink', 'surface'],
		['ink', 'surface-container'],
		['ink', 'surface-raised'],
		['ink-muted', 'surface'],
		['ink-muted', 'surface-container'],
		['ink-muted', 'surface-raised'],
		['on-primary', 'primary'],
		['on-primary-container', 'primary-container'],
		['primary', 'surface'],
		['primary', 'surface-container'],
		['error', 'surface'],
		['link', 'surface'],
		['link', 'link-container'],
		['status-alive', 'surface'],
		['status-boxed', 'surface'],
		['status-dead', 'surface']
	];
	const typeColors = (tokens.color.tokens as TokenEntry[])
		.map((t) => t.name)
		.filter((name) => name.startsWith('type-'));

	for (const theme of ['light', 'dark'] as const) {
		for (const [fg, bg] of textPairs) {
			it(`${fg} on ${bg} reaches 4.5:1 (${theme})`, () => {
				expect(contrast(color(fg, theme), color(bg, theme))).toBeGreaterThanOrEqual(4.5);
			});
		}
		for (const name of typeColors) {
			it(`white text on ${name} reaches 4.5:1 (${theme})`, () => {
				expect(contrast('#FFFFFF', color(name, theme))).toBeGreaterThanOrEqual(4.5);
			});
		}
	}

	// `outline` draws the borders of controls: WCAG asks 3:1 for them against every surface.
	for (const theme of ['light', 'dark'] as const) {
		for (const bg of ['surface', 'surface-container', 'surface-raised']) {
			it(`outline on ${bg} reaches 3:1 (${theme})`, () => {
				expect(contrast(color('outline', theme), color(bg, theme))).toBeGreaterThanOrEqual(3);
			});
		}
	}
});
