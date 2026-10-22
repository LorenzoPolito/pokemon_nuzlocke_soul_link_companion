/**
 * Adds the `Secure` attribute to every cookie the app sets, when the request reached the app over
 * HTTPS (directly or, behind a reverse proxy, as `X-Forwarded-Proto` says). Over plain HTTP the
 * cookies are left alone: a `Secure` cookie would never come back and nobody could sign in.
 */
export function withSecureCookies(response: Response, https: boolean): Response {
	if (!https) return response;
	const cookies = response.headers.getSetCookie();
	if (cookies.length === 0) return response;
	const headers = new Headers(response.headers);
	headers.delete('set-cookie');
	for (const cookie of cookies) {
		headers.append('set-cookie', /;\s*secure(;|$)/i.test(cookie) ? cookie : `${cookie}; Secure`);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
