#!/bin/sh
# Downloads the directories of PokeAPI/api-data listed in data/pokedex-source.json
# at the pinned commit, with a partial sparse clone (a few seconds, ~400 MB of JSON).
# Usage: scripts/fetch-api-data.sh <destination-directory>
set -eu

dest="${1:?usage: fetch-api-data.sh <destination-directory>}"
source_file="$(cd "$(dirname "$0")/.." && pwd)/data/pokedex-source.json"

field() {
	node -p "const s = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); $1" "$source_file"
}
repo="$(field 's.repository')"
commit="$(field 's.commit')"
dirs="$(field "s.directories.map((d) => 'data/api/v2/' + d).join(' ')")"

mkdir -p "$dest"
cd "$dest"
git init -q
git remote add origin "$repo"
git config extensions.partialClone origin
git sparse-checkout init --cone
# shellcheck disable=SC2086
git sparse-checkout set $dirs
git fetch -q --depth 1 --filter=blob:none origin "$commit"
git checkout -q FETCH_HEAD
echo "api-data at $(git rev-parse HEAD)"
