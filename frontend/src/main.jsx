import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApiConnectivityProvider } from "./contexts/ApiConnectivityContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CommandPaletteProvider } from "./contexts/CommandPaletteContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { App } from "./App.jsx";
import { appMetaDescription, appName, appPageTitleSuffix } from "./config/siteMeta.js";
import "./styles/global.css";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

document.title = `${appName} · ${appPageTitleSuffix}`;
const descMeta = document.querySelector('meta[name="description"]');
if (descMeta) descMeta.setAttribute("content", appMetaDescription);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ApiConnectivityProvider>
        <CommandPaletteProvider>
          <ThemeProvider>
            <LanguageProvider>
              <ToastProvider>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </ToastProvider>
            </LanguageProvider>
          </ThemeProvider>
        </CommandPaletteProvider>
      </ApiConnectivityProvider>
    </BrowserRouter>
  </React.StrictMode>
);
