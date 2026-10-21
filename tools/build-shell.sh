#!/usr/bin/env bash
# Compile une coquille Android (studio ou template) sans Gradle : aapt2 + javac + d8.
# Usage : tools/build-shell.sh <studio|template> <dossier www ou vide> <sortie.apk non signé>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK="${ANDROID_HOME:-/opt/android/sdk}"
BT="$SDK/build-tools/36.0.0"
PLATFORM="$SDK/platforms/android-34/android.jar"
KIND="$1"; WWW="$2"; OUT="$3"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

"$BT/aapt2" compile --dir "$ROOT/android/$KIND/res" -o "$TMP/res.zip"
mkdir -p "$TMP/assets/www"
if [ -n "$WWW" ]; then cp -r "$WWW"/. "$TMP/assets/www/"; fi
"$BT/aapt2" link -o "$TMP/base.apk" -I "$PLATFORM" \
  --manifest "$ROOT/android/$KIND/AndroidManifest.xml" -A "$TMP/assets" "$TMP/res.zip"

mkdir -p "$TMP/classes"
javac -nowarn -source 8 -target 8 -bootclasspath "$PLATFORM" -classpath "$PLATFORM" \
  -d "$TMP/classes" $(find "$ROOT/android/src" -name '*.java') 2>&1 | grep -v "^warning\|^Note\|bootstrap" || true
"$BT/d8" --min-api 24 --release --lib "$PLATFORM" --output "$TMP" $(find "$TMP/classes" -name '*.class')
(cd "$TMP" && zip -q -j base.apk classes.dex)
cp "$TMP/base.apk" "$OUT"
