"use strict";
// Variables
const procsProd = require("../2.1-Prods-RUD/PR-FN-Procesos");
const procesos = require("./FM-FN-Procesos");

module.exports = {
	form: {
		motivos: async (req, res) => {
			// Variables
			const datos = await procesos.obtieneDatos(req);
			const origen = req.query.origen || "DT";

			// Obtiene datos para la vista
			const ayudasTitulo = "Por favor decinos por qué sugerís " + datos.codigo + " este registro.";
			const motivos = statusMotivos.filter((n) => n[datos.petitFams]);
			const entidades = variables.entidades[datos.petitFams];

			// Render del formulario
			return res.render("CMP-0Estructura", {...datos, ayudasTitulo, motivos, entidades, origen});
		},
		historial: async (req, res) => {
			// Variables
			const {statusAlineado, prodRclv} = req.body;
			const origen = req.query.origen || "DT";
			const datos = await procesos.obtieneDatos(req);
			datos.registro = await procsProd.obtieneColCaps.consolidado(datos.registro, datos.entidad);

			// Obtiene el ayuda para el título
			const ayudasTitulo =
				datos.codigo == "historial"
					? false
					: datos.tema == "revisionEnts"
					? ["Para tomar una decisión contraria a la del usuario, necesitamos tu comentario para darle feedback."]
					: ["inactivar", "recuperar"].includes(datos.codigo)
					? ["Por favor decinos por qué sugerís " + datos.codigo + " este registro."]
					: datos.codigo == "eliminar"
					? ["Este registro se eliminará en forma definitiva"]
					: null;

			// Obtiene datos para la vista
			const historialStatus = await procesos.historialDeStatus.obtiene({entidad: datos.entidad, ...datos.registro});
			const {usuario} = req.session;
			const revisorPERL = usuario && usuario.rol.revisorPERL;

			// Render del formulario
			return res.render("CMP-0Estructura", {
				...{ayudasTitulo, revisorPERL, origen},
				...{historialStatus, statusAlineado, prodRclv},
				...datos,
			});
		},
		elimina: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id} = req.query;
			const original = await baseDatos.obtienePorId(entidad, id);

			// Elimina sus registros dependientes
			await procesos.elimina.dependientes(entidad, id);

			// Elimina el registro
			await baseDatos.eliminaPorId(entidad, id);

			// Elimina avatars
			const familias = comp.obtieneDesdeEntidad.familias(entidad);
			await comp.elimImgsSinRegEnBd_PR.consolidado(familias);

			// Elimina registros vinculados (no dependientes)
			comp.eliminaRegsSinEntidadId(entidad);
			if (entidad == "colecciones") comp.eliminaRegsSinEntidadId("capitulos");

			// Variables para la vista
			const nombre = comp.nombresPosibles(original);
			const articInicial = comp.obtieneDesdeEntidad.oa(entidad) == "a" ? "La " : "El ";
			const articFinal = entidad == "peliculas" ? "a" : "o";
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad).toLowerCase();
			const capitulos = entidad == "colecciones" ? "y sus capítulos, " : "";
			const plural1 = entidad == "colecciones" ? "ron" : "";
			const plural2 = entidad == "colecciones" ? "s" : "";
			const titulo = comp.letras.inicialMayus(entidadNombre) + " eliminad" + articFinal + plural2;
			const vistaEntendido = variables.vistaEntendido(req.session.urlSinParametros);

			// Cartel de registro eliminado
			let mensaje = articInicial + entidadNombre + " <em>" + nombre + "</em> " + capitulos;
			mensaje += "fue" + plural1 + " eliminad" + articFinal + plural2 + " de nuestra base de datos";
			const informacion = {mensajes: [mensaje], iconos: [vistaEntendido]};

			// Fin
			return res.render("CMP-0Estructura", {informacion, titulo});
		},
	},
	inacRecupGuardar: async (req, res) => {
		//  Variables
		let datos = await procesos.obtieneDatosGuardar(req);
		const {familia, siglaFam, entidad, id} = datos;
		const {motivo_id, codigo, usuario_id, ahora, campo_id, original, statusFinal_id, comentario} = datos;

		// CONSECUENCIAS - Actualiza el status en el registro original
		datos = {
			statusSugeridoPor_id: usuario_id,
			statusSugeridoEn: ahora,
			statusRegistro_id: statusFinal_id,
		};
		await baseDatos.actualizaPorId(entidad, id, datos);

		// CONSECUENCIAS - Agrega un registro en el statusHistorial
		let datosHist = {
			...{entidad, entidad_id: id}, // entidad
			...{statusOriginalPor_id: original.statusSugeridoPor_id, statusFinalPor_id: usuario_id}, // personas
			...{statusOriginal_id: original.statusRegistro_id, statusFinal_id}, // status
			...{statusOriginalEn: original.statusSugeridoEn}, // fecha
			comentario,
		};
		if (codigo == "inactivar") datosHist.motivo_id = motivo_id;
		else if (codigo == "recuperar") {
			const ultHist = await procesos.historialDeStatus.ultimoRegistro(entidad, id);
			if (ultHist) datosHist.motivo_id = ultHist.motivo_id;
		}
		await baseDatos.agregaRegistro("statusHistorial", datosHist); // es crítico el uso del await, para actualizar la variable 'statusErrores'

		// CONSECUENCIAS - Actualiza la variable 'statusErrores'
		await comp.actualizaStatusErrores.consolidado();

		// CONSECUENCIAS - Acciones si es un producto
		if (familia == "producto") {
			// 1. Actualiza en los links el campo 'prodAprob'
			const asoc = comp.obtieneDesdeEntidad.asociacion(entidad);
			const links = await baseDatos.obtieneTodosPorCondicion("links", {[campo_id]: id}, asoc);
			comp.actualizaProdAprobEnLink(links);

			// 2. Acciones si es una colección
			if (entidad == "colecciones") {
				// 2.1. Actualiza sus capítulos con el mismo status
				await baseDatos.actualizaPorCondicion(
					"capitulos",
					{coleccion_id: id},
					{...datos, statusColeccion_id: statusFinal_id, statusSugeridoPor_id: usAutom_id}
				);

				// 2.2. Actualiza en los links de sus capítulos el campo 'prodAprob'
				baseDatos
					.obtieneTodosPorCondicion("capitulos", {coleccion_id: id})
					.then((n) => n.map((m) => m.id))
					.then((ids) =>
						baseDatos
							.obtieneTodosPorCondicion("links", {capitulo_id: ids}, "capitulo")
							.then((links) => comp.actualizaProdAprobEnLink(links))
					);
			}

			// 3. Si es un capítulo, actualiza el status de link de su colección
			if (entidad == "capitulos") comp.actualizaCalidadDeLinkEnCol(original.coleccion_id);

			// 4. Actualiza los rclv, en el campo 'prodsAprob'
			procesos.accsEnDepsPorCambioDeStatus(entidad, original);
		}

		// Fin
		const destino = "/" + entidad + "/detalle/" + siglaFam + "/?id=" + id;
		return res.redirect(destino);
	},
};
