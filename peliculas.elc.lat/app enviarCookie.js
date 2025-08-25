// servidorB.js
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());

app.get("/", (req, res) => {
	fetch("https://peliculas.evangelicemoslacultura:3001/recibe-cookies/?datos=" + JSON.stringify(req.cookies))
		.then((response) => response.json())
		.then((data) => {
			console.log(30, data);
			return res.send(data);
		})
		.catch((error) => console.error(33, error));
	return res.send(req.cookies);
});

global.fs = require("fs");
const https = require("https");
const opciones = {cert: fs.readFileSync("./variables/https-cert.pem"), key: fs.readFileSync("./variables/https-clave.pem")};
https.createServer(opciones, app).listen(3001, () => console.log("Servidor B"));
