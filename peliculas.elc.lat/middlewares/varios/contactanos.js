"use strict";

module.exports = async (req, res, next) => {
	// Lectura del url
	const {inputBR} = req.query;
	if (inputBR) {
		// Actualiza session
		const asunto = "producto";
		req.session.contactanos = {asunto, inputBR};

		// Redirige sin el query
		const url = req.originalUrl.split("/?")[0];
		return res.redirect(url);
	}

	// Información para el cartel genérico
	if (!req.session.usuario) {
		const informacion = {
			mensajes: [
				"Si vas a querer que te respondamos, necesitamos saber quién sos.",
				"Para identificarte, podés ir al login con el ícono de abajo a la izquierda.",
				"Si no necesitás una respuesta, podés usar el ícono de la derecha.",
			],
			iconos: [
				{clase: iconos.izquierda, link: req.session.urlAnterior, titulo: "Volver a la vista anterior"},
				{clase: iconos.login, link: "/usuarios/login", titulo: "Ir a 'Login'"},
				{clase: iconos.derecha, titulo: "Continuar a 'Contactanos'", id: "continuar"},
			],
			trabajando: true,
		};
		return res.render("CMP-0Estructura", {informacion});
	}

	// Fin
	return next();
};
