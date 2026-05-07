// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import App from "./App";

/*
  Entry point of the application:
  - Attaches React to the DOM
  - Renders the App component
*/

const rootElement = document.getElementById("root");

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);