import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

declare global {
  interface Window {
    firebase?: any;
  }
}

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

async function bootstrap() {
  try {
    if (!window.firebase) {
      await Promise.all([
        loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"),
        loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"),
      ]);
    }
  } catch (err) {
    console.error("Firebase SDK failed to load", err);
  }

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  try {
    if (window.firebase && (!window.firebase.apps || window.firebase.apps.length === 0)) {
      window.firebase.initializeApp(firebaseConfig);
      const auth = window.firebase.auth();
      auth
        .setPersistence(window.firebase.auth.Auth.Persistence.LOCAL)
        .catch((error: unknown) => console.warn("Could not enable auth persistence:", error));
    }
  } catch (err) {
    console.error("Firebase initialization error", err);
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  createRoot(rootEl).render(
    <React.StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

bootstrap();
