"use strict";
console.time("Comienzo")

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
	// Variables
	const {cliente_id, email, clienteYaMigrado} = req.cookies;
	const {pideCookies} = req.query;
	const caracter = Object.keys(req.query).length ? "&" : "?";

	// Obtiene las cookies para que sean compartidas
	if (cliente_id) {
		if (!clienteYaMigrado || pideCookies) {
			req.originalUrl += caracter + "cliente_id=" + cliente_id;
			if (email) req.originalUrl += "&email=" + email;
			if (!clienteYaMigrado) res.cookie("clienteYaMigrado", true, {maxAge: 1000 * 60 * 60 * 24 * 365}); // un año
		}
	} else req.originalUrl += caracter + "sinCookie=true";

	// Redirige a 'peliculas.evangelicemoslacultura'
	// req.originalUrl += "&sinCookie=true"
	// return res.send(req.cookies);
	console.timeEnd("Comienzo");
	return res.redirect(urlHost + req.originalUrl);
});
