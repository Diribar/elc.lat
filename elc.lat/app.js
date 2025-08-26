"use strict"; // 2025-ago-26

// Entorno
const path = require("path");
const carpeta = path.basename(path.join(__dirname));
const entProd = carpeta == "1-Actual";
const entPrueba = carpeta == "2-Prueba";

// Host
const urlHost = entProd ? "https://peliculas.elc.lat" : entPrueba ? "https://peliculas2.elc.lat" : "https://peliculas.elc:3001";

// Otros requires
const express = require("express");
const app = express();

// Para usar cookies
const cookies = require("cookie-parser");
app.use(cookies());

// Para conectarse con el servidor
const puerto = entProd ? 4204 : entPrueba ? 4201 : 80;
app.listen(puerto, () => console.log("\nELC Redirecciona - Servidor funcionando..."));

// Redirige a 'películas'
app.use((req, res) => {
	// return res.send(req.cookies);
	return res.redirect(urlHost + req.originalUrl);
});
