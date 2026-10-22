import { describe, expect, it } from 'vitest';
import { passwordGate } from './password-gate';

describe('passwordGate', () => {
	it('lets everything through when no change is pending', () => {
		expect(passwordGate(false, 'GET', '/')).toBe('pass');
		expect(passwordGate(false, 'POST', '/api/runs')).toBe('pass');
	});

	it('sends pages to the change form while a change is pending', () => {
		for (const path of ['/', '/profile', '/pokedex', '/anything']) {
			expect(passwordGate(true, 'GET', path)).toBe('redirect');
		}
	});

	it('refuses API calls and other methods with a pending change', () => {
		expect(passwordGate(true, 'GET', '/api/runs')).toBe('refuse');
		expect(passwordGate(true, 'POST', '/profile')).toBe('refuse');
		expect(passwordGate(true, 'PATCH', '/api/me')).toBe('pass'); // authorize() refuses it by action
	});

	it('keeps the way to change the password and to sign out open', () => {
		expect(passwordGate(true, 'GET', '/change-password')).toBe('pass');
		expect(passwordGate(true, 'POST', '/change-password')).toBe('pass');
		expect(passwordGate(true, 'POST', '/logout')).toBe('pass');
		expect(passwordGate(true, 'POST', '/api/auth/change-password')).toBe('pass');
		expect(passwordGate(true, 'GET', '/_app/immutable/x.js')).toBe('pass');
	});
});
