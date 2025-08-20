"use strict";

module.exports = (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (req.method != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Variables
	const {cliente_id} = req.session.cliente;
	let {originalUrl: ruta} = req;

	// Motivos para discontinuar la función
	if (ruta.includes("/agregar-")) return next(); // saltea, porque se guarda desde la controladora para pasos específicos
	if (ruta == "/consultas") return next(); // saltea, porque redirecciona a "/"
	if (ruta == "/") return next(); // saltea, porque se guarda desde una API dedicada

	// Quita el sobrante del 'query' de la ruta
	if (ruta.includes("&")) ruta = ruta.split("&")[0];

	// Obtiene el comentario
	let comentario;
	if (ruta.startsWith("/institucional")) {
		const vista = Object.keys(vistasInstitucs).find((n) => ruta.includes("/" + n));
		if (vista) comentario = vistasInstitucs[vista].titulo;
	}

	// Guarda el registro de navegación
	const reqHeaders = req.headers["user-agent"];
	comp.guardaRegistroNavegac({cliente_id, ruta, comentario, reqHeaders});

	// Fin
	return next();
};
