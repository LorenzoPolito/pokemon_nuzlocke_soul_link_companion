<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { form } = $props();
	const errors = $derived({
		invalid_credentials: m.auth_error_invalid_credentials(),
		too_many_attempts: m.auth_error_too_many_attempts(),
		account_disabled: m.auth_error_account_disabled()
	});
</script>

<h1>{m.auth_login_title()}</h1>
<form method="post" class="form">
	{#if form?.error}<p class="error" role="alert">{errors[form.error]}</p>{/if}
	<label class="field"
		>{m.auth_email()}<input name="email" type="email" autocomplete="email" required /></label
	>
	<label class="field"
		>{m.auth_password()}<input
			name="password"
			type="password"
			autocomplete="current-password"
			required
		/></label
	>
	<button class="button" type="submit">{m.auth_login_submit()}</button>
</form>
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() plus the query that carries ?next= -->
<p><a href={`${resolve('/register')}${page.url.search}`}>{m.auth_to_register()}</a></p>
