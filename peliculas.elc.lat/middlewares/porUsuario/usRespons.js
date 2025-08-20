"use strict";
// Requires

module.exports = async (req, res, next) => {
	// Variables
	const usuario = await req.session.usuario;
	const familias = {
		p: {campo: "prods", vista: "PA"},
		r: {campo: "rclvs", vista: "RCLV"},
		l: {campo: "links", vista: "LK"},
	};

	// Obtiene el campo 'siglaFam'
	let {tarea, siglaFam} = comp.partesDelUrl(req);
	if (tarea == "/abm-links") siglaFam = "l";
	if (!siglaFam && tarea.startsWith("/agregar-")) siglaFam = "p";
	if (!siglaFam) return next();

	// Obtiene los datos necesarios para armar el nombre del cartel
	const {campo, vista} = familias[siglaFam];
	const cartel = "cartelResp_" + campo;

	// Revisa si requiere el cartel de "responsabilidad"
	if (usuario[cartel]) {
		// Variable
		const objeto = {
			titulo: "Responsabilidad",
			tema: "responsabilidad",
			vista: vista + "9-Responsab",
			urlActual: req.session.urlActual,
		};

		// Quita la necesidad del cartel
		baseDatos.actualizaPorId("usuarios", usuario.id, {[cartel]: false});
		req.session.usuario[cartel] = false;

		// Vista
		return res.render("CMP-0Estructura", objeto);
	}

	// Fin
	return next();
};
