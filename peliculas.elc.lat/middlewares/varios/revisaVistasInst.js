"use strict";

module.exports = async (req, res, next) => {
	// Variables
	const {codigo} = req.params;

	if (!vistasInstitucs[codigo]) {
		// Si tiene una ruta vieja, redirecciona
		if (codigo == "inicio") return res.redirect(req.originalUrl.replace("/inicio", "/bienvenida"));

		// Cartel de error
		const vistaAnterior = variables.vistaAnterior(req.session.urlSinLogin);
		const informacion = {
			mensajes: ["No tenemos esa dirección en nuestro sistema (url)"],
			iconos: [vistaAnterior],
		};
		return res.render("CMP-0Estructura", {informacion});
	}

	// Fin
	return next();
};
