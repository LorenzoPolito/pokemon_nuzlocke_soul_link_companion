import { describe, expect, it } from 'vitest';
import { compareCatalogs, readCatalogs } from './check-messages.ts';

describe('compareCatalogs', () => {
	const en = { title: 'Title', greeting: 'Hello {name}' };

	it('accepts complete catalogs', () => {
		expect(compareCatalogs({ en, it: { title: 'Titolo', greeting: 'Ciao {name}' } }, 'en')).toEqual(
			[]
		);
	});

	it('reports a missing key', () => {
		expect(compareCatalogs({ en, it: { title: 'Titolo' } }, 'en')).toEqual([
			{ locale: 'it', key: 'greeting', problem: 'missing' }
		]);
	});

	it('reports a key that exists only in the translation', () => {
		const result = compareCatalogs({ en, it: { ...en, extra: 'x' } }, 'en');
		expect(result).toEqual([{ locale: 'it', key: 'extra', problem: 'not in en' }]);
	});

	it('reports different parameters and empty texts', () => {
		const result = compareCatalogs({ en, it: { title: ' ', greeting: 'Ciao {nome}' } }, 'en');
		expect(result).toEqual([
			{ locale: 'it', key: 'title', problem: 'empty' },
			{ locale: 'it', key: 'greeting', problem: 'different parameters' }
		]);
	});
});

describe('messages of the app', () => {
	it('are complete in every language', () => {
		expect(compareCatalogs(readCatalogs('messages'), 'en')).toEqual([]);
	});
});
