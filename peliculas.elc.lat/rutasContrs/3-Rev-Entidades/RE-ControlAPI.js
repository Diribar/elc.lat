"use strict";
// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");
const procsProd = require("../2.1-Prods-RUD/PR-FN-Procesos");
const procesos = require("./RE-Procesos");

module.exports = {
	// Productos y Rclvs
	obtieneMotivoGenerico: (req, res) => res.json(motivoInfoErronea.id),
	edicAprobRech: async (req, res) => {
		// Variables
		const {entidad, edicId, campo, aprob, motivo_id} = req.query;
		const revId = req.session.usuario.id;
		const entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
		const include = comp.obtieneTodosLosCamposInclude(entidad);
		const familias = comp.obtieneDesdeEntidad.familias(entidad);
		let statusAprob, reload, edicion, edicsEliminadas;

		// Obtiene el registro editado
		edicion = await baseDatos.obtienePorId(entEdic, edicId, include);

		// Obtiene la versión original con include
		const entId = entidad == "links" ? edicion.link_id : req.query.id;
		const original = await baseDatos.obtienePorId(entidad, entId, [...include, "statusRegistro"]);

		// Obtiene la versión a guardar
		const originalGuardado = {...original};
		if (aprob) originalGuardado[campo] = edicion[campo]; // debe estar antes de que se procese la edición

		// Campos especiales - rclvs
		if (familias == "rclvs" && campo == "fechaMovil" && originalGuardado.fechaMovil == "0") {
			await baseDatos.actualizaPorId(entidad, entId, {anoFM: null}); // debe serlo por el eventual solapamiento
			baseDatos.actualizaPorId(entEdic, edicId, {anoFM: null});
			reload = !aprob; // si fue rechazado, se debe recargar la vista para quitar 'anoFM'
		}

		// Entre otras tareas, actualiza el original si fue aprobada la sugerencia, y obtiene la edición en su mínima expresión
		const objeto = {entidad, original, edicion, originalGuardado, revId, campo, aprob, motivo_id};
		edicion = await procesos.edicAprobRech(objeto);

		// Acciones si se terminó de revisar la edición
		if (!edicion) {
			edicsEliminadas = procsFM.elimina.demasEdiciones({entidad, original: originalGuardado, id: entId}); // elimina las demás ediciones
			statusAprob = procsProd.accionesPorCambioDeStatus({entidad, registro: originalGuardado});
			[statusAprob, edicsEliminadas] = await Promise.all([statusAprob, edicsEliminadas]);

			// Específico de links
			if (entidad == "links") await comp.actualizaCantLinksPorSem();
		}

		// Actualiza el solapamiento
		if (entidad == "epocasDelAno" && aprob) comp.actualizaSolapam(); // no hace falta el await, porque no se usa en la vista

		// Fin
		const resultado = {OK: true, quedanCampos: !!edicion, statusAprob, reload};
		return res.json(resultado);
	},
	actualizaVisibles: (req, res) => {
		// Variables
		const datos = JSON.parse(req.query.datos);
		const {circuito, familias, titulo, desplegar} = datos;

		// Crea el objeto si no existe
		if (!req.session) req.session = {};
		if (!req.session.tableros) req.session.tableros = {};
		if (!req.session.tableros[circuito]) req.session.tableros[circuito] = {};
		if (!req.session.tableros[circuito][familias]) req.session.tableros[circuito][familias] = {};

		// Guarda la session
		desplegar
			? (req.session.tableros[circuito][familias][titulo] = true)
			: delete req.session.tableros[circuito][familias][titulo];

		// Fin
		return res.json();
	},

	// Links
	aprobInactivo: async (req, res) => {
		// Variables
		const {url} = req.query;
		const link = await baseDatos.obtienePorCondicion("links", {url}, variables.entidades.prodAsocs);

		// Más variables
		const datos = procesos.varsLinks({link, req});
		const {id, statusRegistro_id, statusCreado, decisAprob, datosLink, campoDecision} = datos;
		const {motivo_id, revId, statusOriginalPor_id, statusOriginal_id, statusFinal_id} = datos;

		// CONSECUENCIAS - Actualiza el registro del link
		await baseDatos.actualizaPorId("links", id, datosLink);

		// CONSECUENCIAS - Acciones si no es un 'creadoAprob' convertido en 'aprobado'
		if (statusOriginal_id != creadoAprob_id || statusFinal_id != aprobado_id) {
			// Agrega un registro en el statusHistorial
			const datosHist = {
				entidad_id: id,
				entidad: "links",
				statusOriginal_id: link.statusRegistro_id,
				statusFinal_id: statusRegistro_id,
				statusOriginalPor_id,
				statusFinalPor_id: revId,
				statusOriginalEn: statusCreado ? link.creadoEn : link.statusSugeridoEn,
				aprobado: decisAprob,
			};
			let motivo;
			if (motivo_id) {
				motivo = statusMotivos.find((n) => n.id == motivo_id);
				datosHist.motivo_id = motivo_id;
				datosHist.duracion = Number(motivo.duracion);
				datosHist.comentario = motivo.descripcion;
			}
			baseDatos.agregaRegistro("statusHistorial", datosHist);

			// Aumenta el valor de linksAprob/rech en el registro del usuario
			baseDatos.variaElValorDeUnCampo("usuarios", statusOriginalPor_id, campoDecision);

			// Penaliza al usuario si corresponde
			if (motivo) comp.penalizacAcum(statusOriginalPor_id, motivo, "links");
		}

		// CONSECUENCIAS - Actualiza los productos en los campos de 'links' y la variable de links vencidos
		await procsFM.accsEnDepsPorCambioDeStatus("links", {...link, statusRegistro_id});

		// Fin
		return res.json();
	},
};
