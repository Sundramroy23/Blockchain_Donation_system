// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppRouter         from "./router/AppRouter";
import "./styles/tokens.css";
import "./styles/components.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
