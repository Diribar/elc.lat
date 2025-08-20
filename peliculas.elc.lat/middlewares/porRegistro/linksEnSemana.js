"use strict";
const procesos = require("../../rutasContrs/3-Rev-Entidades/RE-Procesos");

module.exports = async (req, res, next) => {
	// Variables
	const entidad = comp.obtieneEntidadDesdeUrl(req);
	const {id} = req.query;
	const revId = req.session.usuario.id;

	// Averigua el producto que debería ser
	const sigProd = req.session.sigProd || (await procesos.obtieneSigProd({revId}));

	// Si no hay ninguno, termina y redirige al tablero
	if (!sigProd) return res.redirect("/" + entidad + "/inactivar-captura/?id=" + id + "&origen=TE");

	// Si es distinto, termina y redirige al correcto
	if (entidad != sigProd.entidad || id != sigProd.id) {
		// Variables
		const datosDestino = "&prodEnt=" + sigProd.entidad + "&prodId=" + sigProd.id;
		req.session.sigProd = sigProd; // para que no lo lea 2 veces seguidas

		// Redirige
		return res.redirect("/" + entidad + "/inactivar-captura/?id=" + id + datosDestino + "&origen=RL");
	}

	// Elimina
	delete req.session.sigProd; // es necesario que lo elimine, para que lo vuelva a leer la próxima vez

	// Fin
	return next();
};
