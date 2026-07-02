#!/usr/bin/env bash
set -uo pipefail

root="${1:?usage: jd-lint.sh <system-root> [jdex-index-file]}"
jdex="${2:-}"
errors=0
warns=0

err() { printf 'ERROR: %s\n' "$*"; errors=$((errors + 1)); }
warn() { printf 'WARN:  %s\n' "$*"; warns=$((warns + 1)); }

ids_file="$(mktemp)"
trap 'rm -f "$ids_file"' EXIT
shopt -s nullglob

for area in "$root"/*/; do
  name="$(basename "$area")"
  if [[ ! "$name" =~ ^([0-9])0-([0-9])9\  ]]; then
    err "area folder not 'N0-N9 Title': $name"
    continue
  fi
  a="${BASH_REMATCH[1]}"
  [[ "$a" == "${BASH_REMATCH[2]}" ]] || err "area decade mismatch: $name"

  for f in "$area"*; do
    bn="$(basename "$f")"
    [[ -f "$f" && "$bn" != .* ]] && err "file directly in area: ${f#"$root"/}"
  done

  for cat in "$area"*/; do
    cname="$(basename "$cat")"
    if [[ ! "$cname" =~ ^([0-9])([0-9])\  ]]; then
      err "category folder not 'NN Title': $name/$cname"
      continue
    fi
    [[ "${BASH_REMATCH[1]}" == "$a" ]] || err "category not in area $a: $name/$cname"
    c="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"

    for f in "$cat"*; do
      bn="$(basename "$f")"
      [[ -f "$f" && "$bn" != .* ]] && err "file directly in category: ${cat#"$root"/}$bn"
    done

    for id in "$cat"*/; do
      idname="$(basename "$id")"
      if [[ ! "$idname" =~ ^([0-9][0-9])\.([0-9][0-9])(\+)?\  ]]; then
        err "ID folder not 'AC.ID Title': $cname/$idname"
        continue
      fi
      [[ "${BASH_REMATCH[1]}" == "$c" ]] || err "ID prefix ${BASH_REMATCH[1]} does not match category $c: $cname/$idname"
      case "${BASH_REMATCH[2]}" in
        05 | 06 | 07 | 08) warn "reserved zero .${BASH_REMATCH[2]} used: $cname/$idname" ;;
      esac
      num="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}${BASH_REMATCH[3]:-}"
      printf '%s\n' "$num" >>"$ids_file"

      deep="$(find "$id" -mindepth 2 -type d -print -quit)"
      [[ -n "$deep" ]] && warn "more than one subfolder level in $num: ${deep#"$root"/}"
    done
  done
done

dups="$(sort "$ids_file" | uniq -d)"
if [[ -n "$dups" ]]; then
  while IFS= read -r d; do err "duplicate ID in filesystem: $d"; done <<<"$dups"
fi

while IFS= read -r -d '' f; do
  bn="$(basename "$f")"
  if [[ "$bn" =~ ^[0-9]{1,2}-[0-9]{1,2}-[0-9]{4} ]]; then
    warn "non-ISO date prefix, use yyyy-mm-dd: ${f#"$root"/}"
  fi
done < <(find "$root" -mindepth 4 -print0 2>/dev/null)

if [[ -n "$jdex" ]]; then
  if [[ ! -r "$jdex" ]]; then
    err "jdex file not readable: $jdex"
  else
    while IFS= read -r num; do
      grep -qF "$num" "$jdex" || err "ID $num exists on disk but not in JDex ($jdex)"
    done < <(sort -u "$ids_file")
  fi
fi

printf '\njd-lint: %d error(s), %d warning(s)\n' "$errors" "$warns"
[[ "$errors" -eq 0 ]]
