/**
 * Entry point of the container: starts the SvelteKit Node server so that it works over plain HTTP.
 *
 * Two things SvelteKit 3's Node adapter does not do by itself:
 *
 * 1. It assumes `https` unless a header says otherwise, which makes every form submission over
 *    HTTP look cross-site and get refused. A missing protocol header is filled in with the
 *    protocol of `ORIGIN` (for example https://nuzlocke.example.org) or, without it, `http`.
 * 2. Login rate limiting needs the client's address. Without a reverse proxy it is the socket
 *    address and a client-sent `X-Forwarded-For` is ignored, so it cannot be used to dodge the limit.
 *
 * Behind a reverse proxy set `TRUST_PROXY=true`: the proxy's `X-Forwarded-Proto` and
 * `X-Forwarded-For` are then used as they are.
 */
process.env.PROTOCOL_HEADER ||= 'x-forwarded-proto';
const protocolHeader = process.env.PROTOCOL_HEADER.toLowerCase();
const fallbackProtocol = process.env.ORIGIN
	? new URL(process.env.ORIGIN).protocol.slice(0, -1)
	: 'http';
const trustProxy = process.env.TRUST_PROXY === 'true';
// Behind a proxy the client address is the one in X-Forwarded-For.
if (trustProxy) process.env.ADDRESS_HEADER ||= 'x-forwarded-for';

const { server } = await import('./build/index.js');
server.prependListener('request', (request) => {
	if (trustProxy) {
		request.headers[protocolHeader] ??= fallbackProtocol;
	} else {
		request.headers[protocolHeader] = fallbackProtocol;
		request.headers['x-forwarded-for'] = request.socket.remoteAddress ?? '';
	}
});
