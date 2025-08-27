"use strict"; // 2025-ago-26
console.clear();

// Requires
const path = require("path");
const express = require("express");
const app = express();

// Para usar cookies
const cookies = require("cookie-parser");
app.use(cookies());

// Entornos
const carpeta = path.basename(path.join(__dirname));
const entProd = carpeta == "1-Actual";
const entPrueba = carpeta == "2-Prueba";

// Listener
const puerto = entProd ? 4204 : entPrueba ? 4201 : 80;
app.listen(puerto, () => console.log("\nELC Redirecciona - Servidor funcionando..."));

// Redirige a 'peliculas.elc'
const inicio = "https://peliculas";
const urlHost = inicio + (entProd ? ".elc.lat" : entPrueba ? "2.elc.lat" : ".elc:3001");
app.use((req, res) => {
	return res.redirect(urlHost + req.originalUrl);
});
