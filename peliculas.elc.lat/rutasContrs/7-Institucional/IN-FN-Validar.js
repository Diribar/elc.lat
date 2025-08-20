"use strict";

module.exports = {
	// ControllerAPI (valida)
	contactanos: async (datos) => {
		// Variables
		const {asunto, prodElegido, comentario} = datos;
		const errores = {};

		// Asunto
		if (!asunto) errores.asunto = "Necesitamos que elijas un asunto";
		else if (!asuntosContactanos.find((n) => n.codigo == asunto)) errores.asunto = "Necesitamos que elijas un asunto válido";

		// Producto elegido
		if (asunto == "producto" && !prodElegido) errores.prodElegido = "Necesitamos que elijas una película";

		// Comentario
		const respuesta =
			(!comentario && "Necesitamos que nos escribas un comentario") ||
			comp.validacs.longitud(comentario, 5, 500) ||
			comp.validacs.castellano.completo(comentario) ||
			comp.validacs.inicial.completo(comentario);
		if (respuesta) errores.comentario = respuesta;

		// Fin
		errores.hay = Object.values(errores).some((n) => !!n);
		return errores;
	},
};
