// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		/** The signed-in user as the app sees it, or `null`. */
		interface Locals {
			user: {
				id: string;
				name: string;
				email: string;
				role: 'admin' | 'user';
				disabled: boolean;
				mustChangePassword: boolean;
				locale: string | null;
				theme: string | null;
			} | null;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
