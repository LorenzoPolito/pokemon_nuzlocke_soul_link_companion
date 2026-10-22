import { describe, expect, it } from 'vitest';
import { withSecureCookies } from './secure-cookies';

const make = (...cookies: string[]) => {
	const headers = new Headers({ 'content-type': 'text/plain' });
	for (const c of cookies) headers.append('set-cookie', c);
	return new Response('body', { status: 201, headers });
};

describe('withSecureCookies', () => {
	it('leaves cookies alone over HTTP', () => {
		const response = make('a=1; Path=/; HttpOnly');
		expect(withSecureCookies(response, false).headers.getSetCookie()).toEqual([
			'a=1; Path=/; HttpOnly'
		]);
	});

	it('marks every cookie Secure over HTTPS, once', async () => {
		const response = withSecureCookies(
			make('a=1; Path=/; HttpOnly', 'b=2; Path=/; Secure', 'c=3; Secure; Path=/'),
			true
		);
		expect(response.headers.getSetCookie()).toEqual([
			'a=1; Path=/; HttpOnly; Secure',
			'b=2; Path=/; Secure',
			'c=3; Secure; Path=/'
		]);
		expect(response.status).toBe(201);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(await response.text()).toBe('body');
	});

	it('returns responses without cookies untouched', () => {
		const response = make();
		expect(withSecureCookies(response, true)).toBe(response);
	});
});
