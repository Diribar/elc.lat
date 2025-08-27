"use strict"; // 2025-ago-26
console.clear();

// Requires
const path = require("path");
const express = require("express");
const app = express();

// Entornos
const carpeta = path.basename(path.join(__dirname));
const entProd = carpeta == "1-Actual";
const entPrueba = carpeta == "2-Prueba";

// Listener
const puerto = entProd ? 4208 : entPrueba ? 4211 : 80;
app.listen(puerto, () => console.log("\nELC Redirecciona - Servidor funcionando..."));

// Redirige a 'peliculas.elc'
const inicio = "https://peliculas";
const elc = "evangelicemoslacultura";
const urlHost = inicio + (entProd ? `.${elc}.com` : entPrueba ? `2.${elc}.com` : `.${elc}:3001`);
app.use((req, res) => res.redirect(urlHost + req.originalUrl));
