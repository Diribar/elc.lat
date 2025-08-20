"use strict";

module.exports = (req, res, next) => {
	// Variables
	const {cliente_id} = req.session.cliente;
	let {originalUrl: ruta} = req;

	// Guarda el registro de navegación
	comp.guardaRegistroNavegac({cliente_id, ruta, comentario: null, reqHeaders: req.headers["user-agent"]});

	// Fin
	return next();
};
