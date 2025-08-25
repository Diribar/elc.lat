"use strict";

// Entorno
global.path = require("path");
const carpeta = path.basename(path.join(__dirname));
const entProd = carpeta == "1-Actual";
const entPrueba = carpeta == "2-Prueba";
const entDes = !entProd && !entPrueba;

// Host
global.urlHost = entProd ? "https://peliculas.elc.lat" : entPrueba ? "https://peliculas2.elc.lat" : "https://peliculas.elc:3001";
if (!entDes) global.dominio = {domain: "elc.lat"};

// Otros requires
global.express = require("express");
const app = express();

// Para usar cookies
const cookies = require("cookie-parser");
app.use(cookies());

// Para conectarse con el servidor
const puerto = entProd ? 4204 : entPrueba ? 4201 : 80;
app.listen(puerto, () => console.log("\nELC Redirecciona - Servidor funcionando..."));

// Redirige
const unaHora = 60 * 60 * 1000;
const unDia = unaHora * 24;
const unAno = unDia * 365;

app.use((req, res) => {
	// Actualiza las cookies para que sean compartidas
	if (req.cookies && !entDes) {
		if (req.cookies.email) res.cookie("email", req.cookies.email, {maxAge: unAno, ...global.dominio});
		if (req.cookies.cliente_id) res.cookie("cliente_id", req.cookies.cliente_id, {maxAge: unAno, ...global.dominio});
	}

	// Redirige a 'películas'
	return res.redirect(urlHost + req.originalUrl);
});
