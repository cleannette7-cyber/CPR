package fr.cpr.gestion;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CPRPrint")
public class CPRPrintPlugin extends Plugin {
    private WebView printView;

    @PluginMethod
    public void printHtml(PluginCall call) {
        final String html = call.getString("html");
        final String jobName = call.getString("jobName", "CPR Gestion - document");
        if (html == null || html.isEmpty() || html.length() > 4_000_000) {
            call.reject("Contenu PDF invalide ou trop volumineux.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                if (printView != null) {
                    call.reject("Une impression est déjà en cours.");
                    return;
                }
                printView = new WebView(getActivity());
                printView.getSettings().setJavaScriptEnabled(false);
                printView.setWebViewClient(new WebViewClient() {
                    @Override public void onPageFinished(WebView view, String url) {
                        try {
                            PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                            if (manager == null) throw new IllegalStateException("Service d'impression indisponible");
                            manager.print(jobName, view.createPrintDocumentAdapter(jobName),
                                new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                            call.resolve();
                        } catch(Exception ex) { call.reject("Impossible d'ouvrir l'impression Android : " + ex.getMessage()); }
                        finally { printView = null; }
                    }
                });
                printView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
            } catch(Exception ex) { printView = null; call.reject("Erreur Android : " + ex.getMessage()); }
        });
    }
}
