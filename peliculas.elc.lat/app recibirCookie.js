// servidorB.js
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());

app.get("/api/obtiene-cookies", (req, res) => {
	console.log(6);
	res.cookie("cookie2", "cookie2", {httpOnly: false, secure: false, sameSite: "None"});
	res.cookie("cookie3", "cookie3", {httpOnly: true, secure: true, sameSite: "None"});
	// secure: false,   // ⚠️ poner true en producción con HTTPS
	console.log(27, req.cookies);

	return res.json();
	return res.send("OK");
});

global.fs = require("fs");
const https = require("https");
const opciones = {cert: fs.readFileSync("./variables/https-cert.pem"), key: fs.readFileSync("./variables/https-clave.pem")};
https.createServer(opciones, app).listen(3001, () => console.log("Servidor B"));
// app.listen(3001, () => console.log("Servidor B"));
