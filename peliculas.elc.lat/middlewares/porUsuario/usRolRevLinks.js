"use strict";
// Requires
const procesos = require(path.join(carpCompUs.contr , "US-FN-Procesos"));

module.exports = (req, res, next) => {
	// Variables
	const usuario = req.session.usuario;
	const vistaAnterior = variables.vistaAnterior(req.session.urlAnterior);
	let informacion;

	// Revisa si el usuario tiene el status perenne
	if (usuario.statusRegistro_id != perenne_id) informacion = procesos.infoNoPerenne(req);

	// Revisa si el usuario tiene el rol necesario
	if (!informacion && !usuario.rol.revisorLinks)
		informacion = {
			mensajes: ["Se requiere un permiso especial para ingresar a esta vista."],
			iconos: [vistaAnterior],
		};

	// Si corresponde, muestra el mensaje de error
	if (informacion) return res.render("CMP-0Estructura", {informacion});

	// Fin
	return next();
};
