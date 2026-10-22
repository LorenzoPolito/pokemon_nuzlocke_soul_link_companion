/**
 * Where to go after signing in or registering, taken from `?next=`. Only a path on this site is
 * accepted (so a link cannot send people elsewhere); anything else goes to the home page.
 */
export function safeNext(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
		return '/';
	if ([...value].some((c) => c.charCodeAt(0) < 32)) return '/';
	return value;
}
