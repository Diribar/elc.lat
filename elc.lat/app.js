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

// Redirige
const urlHost = entProd ? "https://peliculas.elc.lat" : entPrueba ? "https://peliculas2.elc.lat" : "https://peliculas.elc:3001";
app.use((req, res) => {
	console.log(25, req.cookies, req.originalUrl);
	return res.redirect(urlHost + req.originalUrl);
});
