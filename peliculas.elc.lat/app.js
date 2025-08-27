"use strict";
console.clear();

// Requires
const path = require("path");
const express = require("express");
const app = express();

// Para usar cookies
const cookies = require("cookie-parser");
app.use(cookies());

// Entornos
const entProd = path.basename(__dirname) == "1-Actual";
const entPrueba = path.basename(__dirname) == "2-Prueba";
const entDesarr = !entProd && !entPrueba;

// Listener
const puerto = entProd ? 4210 : entPrueba ? 4207 : 3001;
if (entDesarr) {
	const https = require("https");
	const fs = require("fs");
	const opciones = {cert: fs.readFileSync("./https-cert.pem"), key: fs.readFileSync("./https-clave.pem")};
	https.createServer(opciones, app).listen(puerto, () => console.log("\nELC Películas Redirecciona - Servidor funcionando...")); // Para conectarse con el servidor
} else app.listen(puerto, () => console.log("\nELC Películas Redirecciona - Servidor funcionando...")); // Para conectarse con el servidor

// Redirige
const inicio = "https://peliculas";
const elc = "evangelicemoslacultura";
const urlHost = entProd ? `${inicio}.${elc}.com` : entPrueba ? `${inicio}2.${elc}.com` : `${inicio}.${elc}:3006`;
app.use((req, res) => {
	// Acciones si pide cookies
	if (req.query.pideCookies) {
		console.log("pide cookies");

		// Variables
		const {cliente_id, email} = req.cookies;

		// Envía las cookies de 'cliente_id' y 'email'
		if (cliente_id) req.originalUrl += "&cliente_id=" + cliente_id;
		if (email) req.originalUrl += "&email=" + email;

		// Otras
		if (!cliente_id && !email) req.originalUrl += "&sinCookie=true"; // Si no tiene ninguna de ellas, envía la cookie 'sinCookie'
		req.originalUrl = req.originalUrl.replace("pideCookies=true&", ""); // Limpia el url
	}

	// Redirige a 'peliculas.evangelicemoslacultura'
	return res.redirect(urlHost + req.originalUrl);
});
