<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { data, form } = $props();
</script>

<h1>{m.nav_profile()}</h1>

<form method="post" action="?/profile" class="form">
	<h2>{m.profile_details()}</h2>
	{#if form?.profileSaved}<p role="status">{m.profile_saved()}</p>{/if}
	{#if form?.profileError}<p class="error" role="alert">{m.auth_error_validation()}</p>{/if}
	<p class="hint">{data.profile?.email}</p>
	<label class="field"
		>{m.auth_name()}<input name="name" value={data.profile?.name} maxlength="40" required /></label
	>
	<label class="field"
		>{m.profile_language()}
		<select name="locale">
			<option value="" selected={!data.profile?.locale}>{m.profile_automatic()}</option>
			<option value="en" selected={data.profile?.locale === 'en'}>{m.i18n_locale_en()}</option>
			<option value="it" selected={data.profile?.locale === 'it'}>{m.i18n_locale_it()}</option>
		</select></label
	>
	<label class="field"
		>{m.profile_theme()}
		<select name="theme">
			<option value="" selected={!data.profile?.theme}>{m.profile_automatic()}</option>
			<option value="light" selected={data.profile?.theme === 'light'}
				>{m.profile_theme_light()}</option
			>
			<option value="dark" selected={data.profile?.theme === 'dark'}
				>{m.profile_theme_dark()}</option
			>
		</select></label
	>
	<button class="button" type="submit">{m.profile_save()}</button>
</form>

<form method="post" action="?/password" class="form">
	<h2>{m.profile_password()}</h2>
	{#if form?.passwordSaved}<p role="status">{m.profile_password_saved()}</p>{/if}
	{#if form?.passwordError}<p class="error" role="alert">
			{form.passwordError === 'wrong_password'
				? m.profile_error_wrong_password()
				: m.auth_error_validation()}
		</p>{/if}
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
	<button class="button" type="submit">{m.profile_change_password()}</button>
</form>

<form method="post" action="/logout" class="form">
	<button class="button secondary" type="submit">{m.auth_logout()}</button>
</form>
