"use strict";
// Start-up - última carpeta git subida: 1.00
console.clear();

// Requires
global.path = require("path");
global.express = require("express");
const app = express();

// Para usar cookies
const cookies = require("cookie-parser");
app.use(cookies());

// Variables que toman valores de 'path'
const entProd = global.path.basename(__dirname) == "1-Actual";
global.entPrueba = global.path.basename(__dirname) == "2-Prueba";
global.entDesarr = !entProd && !entPrueba;

// Variables que dependen del entorno
const urlHost = entProd
	? "https://peliculas.evangelicemoslacultura.com"
	: entPrueba
	? "https://peliculas2.evangelicemoslacultura.com"
	: "https://peliculas.evangelicemoslacultura:3006";

// Listener
const puerto = entProd ? 4210 : entPrueba ? 4207 : 3001;
if (entDesarr) {
	const https = require("https");
	const fs = require("fs");
	const opciones = {cert: fs.readFileSync("./variables/https-cert.pem"), key: fs.readFileSync("./variables/https-clave.pem")};
	https.createServer(opciones, app).listen(puerto, () => console.log("\nELC Películas - Servidor funcionando...")); // Para conectarse con el servidor
} else app.listen(puerto, () => console.log("\nELC Películas Redirecciona - Servidor funcionando...")); // Para conectarse con el servidor

// Redirige
app.use((req, res) => {
	// Obtiene las cookies para que sean compartidas
	if (req.cookies && req.cookies.email) req.originalUrl += "&email=" + req.cookies.email;
	if (req.cookies && req.cookies.cliente_id) req.originalUrl += "&cliente_id=" + req.cookies.cliente_id;

	// Redirige a 'películas.evangelicemoslacultura'
	return res.redirect(urlHost + req.originalUrl);
});
