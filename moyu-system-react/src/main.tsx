import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { env } from "./config/env";
import "./i18n";
import "./styles/ds-structure.css";
import "./styles/variables.css";
import "./style.css";

document.title = env.title;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
