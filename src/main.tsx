import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AdminProvider } from "./context/AdminContext";
import "./index.css";

const el = document.getElementById("root");
if (!el) {
  document.body.innerHTML =
    "<pre style='color:white;padding:16px'>#root não encontrado</pre>";
} else {
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <AdminProvider>
        <App />
      </AdminProvider>
    </React.StrictMode>
  );
}

console.log("✅ main.tsx carregou");
