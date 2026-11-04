#!/usr/bin/env bash
# Tell older installs that a new APK is out.
#
#   scripts/announce-apk.sh              # use the newest finished sideload APK on EAS
#   scripts/announce-apk.sh <apk-url>
#   DRY_RUN=1 scripts/announce-apk.sh    # show what would publish
#
# Native changes can't ship over the air, so phones on an older app version
# (app.json "version", the runtime) never see them. For each older version that
# knows how to show the notice, this republishes that version's own last commit
# with LATEST_APK pointing at the new APK, so the update only carries JS that
# version can run. It also records the APK in src/release.ts on the current branch.
#
# Run it from master after the new APK build has finished.
set -euo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"
new=$(node -p "require('./app.json').expo.version")

url=${1:-}
if [[ -z "$url" ]]; then
  url=$(npx eas-cli build:list --platform android --build-profile sideload --status finished \
    --limit 1 --non-interactive --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const b=JSON.parse(s)[0];if(b?.appVersion==='$new')console.log(b.artifacts.buildUrl)})")
  [[ -n "$url" ]] || { echo "No finished sideload APK for version $new yet. Pass the URL instead." >&2; exit 1; }
fi
echo "APK $new: $url"

set_latest() {
  sed -i '' -E "s|^export const LATEST_APK: .*$|export const LATEST_APK: { version: string; url: string } \| null = { version: '$new', url: '$url' };|" "$1/src/release.ts"
}

version_at() {
  git show "$1:app.json" 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).expo.version)}catch{}})"
}

# Newest commit of each older app version: walk history newest first and keep
# the first commit seen for each version.
seen=" $new "
for last in $(git log --format=%H); do
  v=$(version_at "$last")
  [[ -z "$v" || "$seen" == *" $v "* ]] && continue
  seen+="$v "
  if ! git cat-file -e "$last:src/release.ts" 2>/dev/null; then
    echo "• $v: predates the update notice, skipping"
    continue
  fi
  echo "• $v: announcing $new from ${last:0:7}"
  dir=$(mktemp -d)/ascend-$v
  git worktree add --detach -q "$dir" "$last"
  ln -s "$root/node_modules" "$dir/node_modules"
  set_latest "$dir"
  if [[ -n "${DRY_RUN:-}" ]]; then
    grep '^export const LATEST_APK' "$dir/src/release.ts"
  else
    # Sideload APKs read the production channel; preview builds read preview.
    for channel in production preview; do
      (cd "$dir" && npx eas-cli update --channel "$channel" --platform android --non-interactive \
        --message "New app version $new is out: download the APK")
    done
  fi
  git worktree remove --force "$dir"
done

[[ -n "${DRY_RUN:-}" ]] && exit 0
set_latest "$root"
echo "Recorded $new in src/release.ts; commit it."
