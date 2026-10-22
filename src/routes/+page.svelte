<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { LanguageSelector } from '#lib/modules/i18n/index.js';
</script>

<header>
	<LanguageSelector />
</header>
<main>
	<h1>{m.app_title()}</h1>
	<p>{m.app_tagline()}</p>
</main>
