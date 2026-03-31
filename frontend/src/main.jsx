// main.jsx — React app entry point
// This is the very first file that runs on the frontend
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Tailwind base styles

ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode helps catch bugs in development by rendering twice
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
