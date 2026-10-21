#!/usr/bin/env bash
# Construit tout : modèle d'APK (pour l'export dans l'app), puis l'APK du studio NOCODEX.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK="${ANDROID_HOME:-/opt/android/sdk}"
BT="$SDK/build-tools/36.0.0"
mkdir -p "$ROOT/build"

[ -d "$ROOT/node_modules/blockly" ] || (cd "$ROOT" && npm install --no-audit --no-fund)
node "$ROOT/tools/vendor.js"

# 1) Modèle d'APK non signé, embarqué en base64 dans le studio.
"$ROOT/tools/build-shell.sh" template "" "$ROOT/build/template-unsigned.apk"
node -e "
const fs=require('fs');
const b=fs.readFileSync('$ROOT/build/template-unsigned.apk').toString('base64');
fs.writeFileSync('$ROOT/web/js/template-apk.js','/* APK modèle (coquille WebView non signée) utilisé par l\'export APK. Généré par tools/build.sh */\nwindow.NX_TEMPLATE_APK = \"'+b+'\";\n');
"

# 2) APK du studio.
"$ROOT/tools/build-shell.sh" studio "$ROOT/web" "$ROOT/build/nocodex-unsigned.apk"
"$BT/zipalign" -f -p 4 "$ROOT/build/nocodex-unsigned.apk" "$ROOT/build/nocodex-aligned.apk"

KS="${NOCODEX_KEYSTORE:-$ROOT/build/nocodex-release.jks}"
PASS="${NOCODEX_KEYSTORE_PASS:-nocodex-superessence}"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass "$PASS" -keypass "$PASS" -alias nocodex \
    -keyalg RSA -keysize 2048 -validity 18250 -dname "CN=NOCODEX, O=SuperEssence studio, C=FR" 2>&1 | grep -v JAVA_TOOL || true
fi
"$BT/apksigner" sign --ks "$KS" --ks-pass "pass:$PASS" --ks-key-alias nocodex \
  --out "$ROOT/build/NOCODEX.apk" "$ROOT/build/nocodex-aligned.apk" 2>&1 | grep -v JAVA_TOOL || true
"$BT/apksigner" verify "$ROOT/build/NOCODEX.apk" 2>&1 | grep -v JAVA_TOOL || true
ls -la "$ROOT/build/NOCODEX.apk"
