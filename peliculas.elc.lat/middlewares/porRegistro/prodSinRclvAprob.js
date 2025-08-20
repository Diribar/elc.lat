"use strict";

module.exports = async (req, res, next) => {
	// Variables
	const entidad = comp.obtieneEntidadDesdeUrl(req);
	const {id: entId, origen} = req.query;
	const {rclvAsocs} = variables.entidades;
	const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
	const condicion = {[campo_id]: entId};
	const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad).toLowerCase();
	const ea = comp.obtieneDesdeEntidad.ea(entidad);

	// Obtiene la prodEdicion con sus rclvs
	const edicion = await baseDatos.obtienePorCondicion("prodEdics", condicion, rclvAsocs);

	// Si alguno de sus rclvs está en status creado, genera la información
	if (edicion)
		for (let rclvAsoc of rclvAsocs)
			if (edicion[rclvAsoc] && edicion[rclvAsoc].statusRegistro_id == creado_id) {
				// Variables
				const vistaAnterior = variables.vistaAnterior(req.session.urlAnterior);
				const rclv = {
					entidad: comp.obtieneDesdeAsoc.entidad(rclvAsoc),
					id: edicion[rclvAsoc].id,
					entidadNombre: comp.obtieneDesdeAsoc.entidadNombre(rclvAsoc).toLowerCase(),
					a: comp.obtieneDesdeAsoc.a(rclvAsoc),
					oa: comp.obtieneDesdeAsoc.oa(rclvAsoc),
				};

				// Obtiene la vista siguiente
				let urlSiguiente = "/revision/alta/r/" + rclv.entidad + "/?id=" + rclv.id;
				urlSiguiente += "&prodEnt=" + entidad + "&prodId=" + entId + (origen ? "&origen=" + origen : "");
				const vistaSiguiente = variables.vistaSiguiente(urlSiguiente);

				// Genera la información
				const informacion = {
					mensajes: [
						"Est" +
							(ea + " " + entidadNombre) +
							(" está vinculada con un" + rclv.a + " ") +
							(rclv.entidadNombre + " pendiente de revisar."),
						"Si querés revisarl" + rclv.oa + ", elegí el ícono de la derecha.",
					],
					iconos: [vistaAnterior, vistaSiguiente],
				};

				// Redirecciona
				return res.render("CMP-0Estructura", {informacion});
			}

	// Fin
	return next();
};
