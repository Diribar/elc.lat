"use strict";

module.exports = async (req, res, next) => {
	// Variables
	const {entidad} = comp.partesDelUrl(req);
	const {id, origen} = req.query;
	const cola = "/?id=" + id + (origen ? "&origen=" + origen : "");
	const vistaAnterior = variables.vistaAnterior("/" + entidad + "/edicion/p" + cola);

	let informacion;

	// Verifica que la entidad sea una colección
	if (entidad != "colecciones")
		informacion = {
			mensajes: ["La entidad debe ser 'colecciones'"],
			iconos: [vistaAnterior],
		};

	// Verifica que no tenga una reordenamientos de otro usuario

	// Si corresponde, muestra el mensaje
	if (informacion) return res.render("CMP-0Estructura", {informacion});

	// Fin
	return next();
};
