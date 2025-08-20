"use strict";

module.exports = async (req, res, next) => {
	// Asigna la variable 'urlOrigen'
	const ruta = req.baseUrl + req.path.slice(0, -1);
	res.locals.urlOrigen = encodeURIComponent(ruta);

	const entidad = comp.obtieneEntidadDesdeUrl(req);
	res.locals.siglaFam = entidad == "links" ? "p" : comp.obtieneDesdeEntidad.siglaFam(entidad);

	// Fin
	return next();
};
