<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { data, form } = $props();
	const errors = $derived({
		registration_closed: m.auth_error_registration_closed(),
		invite_invalid: m.auth_error_invite_invalid(),
		email_taken: m.auth_error_email_taken(),
		validation: m.auth_error_validation()
	});
</script>

<h1>{m.auth_register_title()}</h1>
{#if data.mode === 'closed'}
	<p class="error" role="alert">{m.auth_error_registration_closed()}</p>
{:else}
	<form method="post" class="form">
		{#if form?.error}<p class="error" role="alert">{errors[form.error]}</p>{/if}
		<label class="field"
			>{m.auth_name()}<input name="name" autocomplete="name" maxlength="40" required /></label
		>
		<label class="field"
			>{m.auth_email()}<input name="email" type="email" autocomplete="email" required /></label
		>
		<label class="field"
			>{m.auth_password()}<input
				name="password"
				type="password"
				autocomplete="new-password"
				minlength="8"
				required
			/></label
		>
		<p class="hint">{m.auth_password_hint()}</p>
		{#if data.mode === 'invite'}
			<label class="field"
				>{m.auth_invite()}<input name="invite" value={data.invite} required /></label
			>
		{:else}
			<input type="hidden" name="invite" value={data.invite} />
		{/if}
		<button class="button" type="submit">{m.auth_register_submit()}</button>
	</form>
{/if}
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() plus the query that carries ?next= -->
<p><a href={`${resolve('/login')}${page.url.search}`}>{m.auth_to_login()}</a></p>
