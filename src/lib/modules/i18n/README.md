# Module `i18n`

Languages and the language selector. The interface is in English and Italian; English is the base language and the fallback.

- **Messages**: `messages/en.json` and `messages/it.json` at the repository root, compiled by Paraglide into `src/lib/paraglide/` (generated, not committed). Keys are `module_area_name` (for example `runs_create_title`) and are used only through `m.<key>()`. No text is written in components.
- **Active language**: the `PARAGLIDE_LOCALE` cookie, then the browser language (`Accept-Language`), then English (`vite.config.ts`). Changing language sets the cookie and reloads the page on the same screen.
- **Public API** (`index.ts`): `LanguageSelector`, `getLocale`, `locales`.
- **Missing translations**: `npm run i18n:check` (also part of `npm run lint`) fails if a key exists in one language and not in the other, or if their parameters differ.
- **Per user**: once the user is logged in, the chosen language is saved on the account (`user.locale`, P3-07) and set in the cookie at login.

Names of Pokémon, moves and abilities do not come from here: they are read from the Pokédex (`name` table) with English as fallback.
