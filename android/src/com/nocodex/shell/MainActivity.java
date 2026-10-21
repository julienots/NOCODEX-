package com.nocodex.shell;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.speech.tts.TextToSpeech;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;
import java.util.Locale;

/**
 * Coquille WebView partagée par le studio NOCODEX et par toutes les applications
 * exportées en APK. Elle affiche assets/www/index.html et expose un pont
 * JavaScript "NXNative" (fichiers, partage, voix, vibration, toast).
 */
public class MainActivity extends Activity {
    private static final int REQ_FILE_CHOOSER = 41;
    private static final int REQ_SAVE_FILE = 42;
    private static final int REQ_PERMS = 43;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingBytes;
    private String pendingMime;
    private boolean pendingOpenAfterSave;
    private Uri lastSavedUri;
    private String lastSavedMime;
    private TextToSpeech tts;
    private boolean ttsReady;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        if (Build.VERSION.SDK_INT >= 21) {
            getWindow().setStatusBarColor(Color.BLACK);
            getWindow().setNavigationBarColor(Color.BLACK);
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setGeolocationEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        web.addJavascriptInterface(new Bridge(), "NXNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("file".equals(scheme) || "about".equals(scheme) || "data".equals(scheme)
                        || "blob".equals(scheme)) {
                    return false;
                }
                // Liens externes (http, mailto, tel...) : ouverts dans l'application adaptée.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException e) {
                    toast("Aucune application pour ouvrir ce lien");
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = params.createIntent();
                intent.setType("*/*");
                try {
                    startActivityForResult(intent, REQ_FILE_CHOOSER);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                                                           GeolocationPermissions.Callback callback) {
                askPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION});
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                askPermissions(new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO});
                runOnUiThread(new Runnable() {
                    public void run() { request.grant(request.getResources()); }
                });
            }
        });

        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    tts.setLanguage(Locale.getDefault());
                    ttsReady = true;
                }
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl("file:///android_asset/www/index.html");
        }
    }

    private void askPermissions(String[] perms) {
        if (Build.VERSION.SDK_INT < 23) return;
        for (String p : perms) {
            if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(perms, REQ_PERMS);
                return;
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        // La page peut intercepter le retour (fermer une fenêtre, changer d'onglet...).
        web.evaluateJavascript("(window.nxOnBack ? !!window.nxOnBack() : false)",
                new ValueCallback<String>() {
                    public void onReceiveValue(String handled) {
                        if ("true".equals(handled)) return;
                        if (web.canGoBack()) web.goBack();
                        else finish();
                    }
                });
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE_CHOOSER) {
            if (fileCallback != null) {
                Uri[] result = null;
                if (resultCode == RESULT_OK && data != null) {
                    if (data.getClipData() != null) {
                        int n = data.getClipData().getItemCount();
                        result = new Uri[n];
                        for (int i = 0; i < n; i++) result[i] = data.getClipData().getItemAt(i).getUri();
                    } else if (data.getData() != null) {
                        result = new Uri[]{data.getData()};
                    }
                }
                fileCallback.onReceiveValue(result);
                fileCallback = null;
            }
            return;
        }
        if (requestCode == REQ_SAVE_FILE) {
            boolean ok = false;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingBytes != null) {
                Uri uri = data.getData();
                try {
                    OutputStream out = getContentResolver().openOutputStream(uri, "w");
                    out.write(pendingBytes);
                    out.close();
                    lastSavedUri = uri;
                    lastSavedMime = pendingMime;
                    ok = true;
                } catch (Exception e) {
                    toast("Erreur d'enregistrement : " + e.getMessage());
                }
            }
            pendingBytes = null;
            final boolean saved = ok;
            web.evaluateJavascript("window.nxOnSaved && window.nxOnSaved(" + saved + ")", null);
            if (saved) {
                toast("Fichier enregistré ✔");
                if (pendingOpenAfterSave) openLastSaved();
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    private void openLastSaved() {
        if (lastSavedUri == null) return;
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(lastSavedUri, lastSavedMime);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            toast("Aucune application pour ouvrir ce fichier");
        }
    }

    private void toast(final String msg) {
        runOnUiThread(new Runnable() {
            public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show(); }
        });
    }

    /** Fonctions accessibles depuis JavaScript via window.NXNative. */
    public class Bridge {
        @JavascriptInterface
        public boolean isAndroid() { return true; }

        @JavascriptInterface
        public void toast(String msg) { MainActivity.this.toast(msg); }

        /** Ouvre le sélecteur "Enregistrer sous" puis écrit le fichier (contenu en base64). */
        @JavascriptInterface
        public void saveFile(final String name, final String mime, String base64, boolean openAfter) {
            pendingBytes = Base64.decode(base64, Base64.DEFAULT);
            pendingMime = mime;
            pendingOpenAfterSave = openAfter;
            runOnUiThread(new Runnable() {
                public void run() {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(mime);
                    intent.putExtra(Intent.EXTRA_TITLE, name);
                    try {
                        startActivityForResult(intent, REQ_SAVE_FILE);
                    } catch (ActivityNotFoundException e) {
                        MainActivity.this.toast("Impossible d'ouvrir le gestionnaire de fichiers");
                    }
                }
            });
        }

        /** Ouvre le dernier fichier enregistré (ex. installer l'APK généré). */
        @JavascriptInterface
        public void openLastSaved() {
            runOnUiThread(new Runnable() {
                public void run() { MainActivity.this.openLastSaved(); }
            });
        }

        /** Partage le dernier fichier enregistré (WhatsApp, mail, Drive...). */
        @JavascriptInterface
        public void shareLastSaved() {
            if (lastSavedUri == null) return;
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(lastSavedMime);
            intent.putExtra(Intent.EXTRA_STREAM, lastSavedUri);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(intent, "Partager"));
        }

        @JavascriptInterface
        public void shareText(String text) {
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("text/plain");
            intent.putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(intent, "Partager"));
        }

        @JavascriptInterface
        public void speak(String text) {
            if (ttsReady) tts.speak(text, TextToSpeech.QUEUE_ADD, null, "nx" + System.nanoTime());
        }

        @JavascriptInterface
        public void vibrate(int ms) {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return;
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
            else v.vibrate(ms);
        }

        @JavascriptInterface
        public void keepScreenOn(final boolean on) {
            runOnUiThread(new Runnable() {
                public void run() {
                    if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            });
        }

        @JavascriptInterface
        public void fullscreen(final boolean on) {
            runOnUiThread(new Runnable() {
                public void run() {
                    View d = getWindow().getDecorView();
                    d.setSystemUiVisibility(on ? (View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY) : 0);
                }
            });
        }

        @JavascriptInterface
        public void openUrl(String url) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception e) {
                MainActivity.this.toast("Lien impossible à ouvrir");
            }
        }

        @JavascriptInterface
        public void exit() { finish(); }
    }
}
