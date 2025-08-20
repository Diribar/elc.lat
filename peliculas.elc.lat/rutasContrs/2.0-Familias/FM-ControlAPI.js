"use strict";

module.exports = {
	// Tridente: Detalle - Edición del Producto - Links
	obtieneInfo: (req, res) => {
		// Variables
		const {entidad} = req.query;
		const petitFams = comp.obtieneDesdeEntidad.petitFams(entidad);

		// Obtiene los motivos
		const motivos = statusMotivos.filter((m) => m[petitFams]);

		// Fin
		return res.json({motivos, largoComentario});
	},
	obtieneRegistro: async (req, res) => {
		const {entidad, id} = req.query;
		const registro = await baseDatos.obtienePorId(entidad, id);
		return res.json(registro);
	},
};
