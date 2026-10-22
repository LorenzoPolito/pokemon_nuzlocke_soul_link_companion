<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { form } = $props();
	const errors = $derived({
		validation: m.auth_error_validation(),
		same_password: m.change_password_error_same(),
		wrong_password: m.profile_error_wrong_password()
	});
</script>

<h1>{m.change_password_title()}</h1>
<p>{m.change_password_intro()}</p>
<form method="post" class="form">
	{#if form?.error}<p class="error" role="alert">{errors[form.error]}</p>{/if}
	<label class="field"
		>{m.profile_current_password()}<input
			name="currentPassword"
			type="password"
			autocomplete="current-password"
			required
		/></label
	>
	<label class="field"
		>{m.profile_new_password()}<input
			name="newPassword"
			type="password"
			autocomplete="new-password"
			minlength="8"
			required
		/></label
	>
	<p class="hint">{m.auth_password_hint()}</p>
	<button class="button" type="submit">{m.profile_change_password()}</button>
</form>
<form method="post" action="/logout">
	<button class="button secondary" type="submit">{m.auth_logout()}</button>
</form>
