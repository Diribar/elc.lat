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
	// Pide cookies
	if (req.query.pideCookies) {
		// Variables
		const {cliente_id, email} = req.cookies;
		const caracter = Object.keys(req.query).length ? "&" : "?";

	}


	// Envía las cookies de 'cliente_id' y 'email'
	if (cliente_id) {
		if (!clienteYaMigrado || pideCookies) {
			req.originalUrl += caracter + "cliente_id=" + cliente_id;
			if (email) req.originalUrl += "&email=" + email;
			if (!clienteYaMigrado) res.cookie("clienteYaMigrado", true, {maxAge: 1000 * 60 * 60 * 24 * 365}); // un año
		}
	}
	// Envía la cookie de 'sinCookie'
	else req.originalUrl += caracter + "sinCookie=true";

	// Redirige a 'peliculas.evangelicemoslacultura'
	req.originalUrl = req.originalUrl.replace("pideCookies=true&", "");
	return res.redirect(urlHost + req.originalUrl);
});
