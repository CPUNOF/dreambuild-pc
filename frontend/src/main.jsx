import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext.jsx";
import { RealtimeProvider } from "./context/RealtimeContext.jsx";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import "./styles.css";
import "./commerce.css";
import "./experience.css";
import "./theme.css";
import "./assembly.css";
import "./experience-v3.css";
import "./background.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
