"use strict";
const validacs = require("./FM-FN-Validar");

module.exports = {
	// Header
	quickSearch: {
		condicion: ({palabras, campos, usuario_id, original, autTablEnts, omitirUserId, omitirStatus}) => {
			// Variables
			let todasLasPalabrasEnAlgunCampo = [];
			let condicStatusEdicion = null;

			// Condiciones de "palabras"
			palabras = palabras.split(" ");
			for (let campo of campos) {
				// Variables
				let palabrasEnElCampo = [];

				// Dónde debe buscar cada palabra dentro del campo
				for (let palabra of palabras) {
					const palabraEnElCampo = {
						[Op.or]: [
							{[campo]: {[Op.like]: palabra + "%"}}, // En el comienzo del texto
							{[campo]: {[Op.like]: "% " + palabra + "%"}}, // En el comienzo de una palabra
						],
					};
					palabrasEnElCampo.push(palabraEnElCampo);
				}

				// Exige que cada palabra del conjunto esté presente
				const todasLasPalabrasEnElCampo = {[Op.and]: palabrasEnElCampo};

				// Consolida el resultado
				todasLasPalabrasEnAlgunCampo.push(todasLasPalabrasEnElCampo);
			}
			const condicPalabras = {[Op.or]: todasLasPalabrasEnAlgunCampo};

			// Condiciones de "status del registro"
			if (original && !omitirStatus)
				condicStatusEdicion = omitirUserId
					? {statusRegistro_id: activos_ids}
					: {
							[Op.or]: [
								{statusRegistro_id: aprobados_ids},
								{[Op.and]: [{statusRegistro_id: creado_id}, !autTablEnts ? {creadoPor_id: usuario_id} : null]}, // si es un usuario con rol 'autTablEnts', se le permite ver todos los creados
							],
					  };
			// Se fija que una edición sea del usuario
			else if (!omitirUserId) condicStatusEdicion = {editadoPor_id: usuario_id};

			// Consolida las condiciones
			const condicConsolidada = {[Op.and]: [condicPalabras, condicStatusEdicion]};

			// Fin
			return condicConsolidada;
		},
		registros: async (condicion, dato) => {
			// Obtiene los registros
			const registros = await baseDatos.obtieneTodosPorCondicionConLimite(dato.entidad, condicion, 10).then((n) =>
				n.map((m) => {
					let respuesta = {
						id: m.id,
						nombre: m[dato.campos[0]],
						entidad: dato.entidad,
						familia: dato.familia,
						avatar: m.avatar, // específicos para PA-Desambiguar
					};
					if (m.anoEstreno) respuesta.anoEstreno = m.anoEstreno;
					if (m.nombreOriginal) respuesta.nombreOriginal = m.nombreOriginal; // específicos para PA-Desambiguar

					return respuesta;
				})
			);

			// Fin
			return registros;
		},
		ediciones: async (condicion, dato) => {
			// Obtiene los registros
			const registros = await baseDatos
				.obtieneTodosPorCondicionConLimite(dato.entidad, condicion, 10, dato.include)
				.then((n) =>
					n.map((m) => {
						const entidad = comp.obtieneDesdeCampo_id.entidad(m, dato.entidad);
						const asoc = comp.obtieneDesdeEntidad.asociacion(entidad);
						return {
							entidad,
							id: m[comp.obtieneDesdeEntidad.campo_id(entidad)],
							anoEstreno: m.anoEstreno ? m.anoEstreno : m[asoc].anoEstreno,
							nombre: m[dato.campos[0]] ? m[dato.campos[0]] : m[dato.campos[1]],
							familia: dato.familia,
						};
					})
				);

			// Fin
			return registros;
		},
	},

	// CRUD
	obtieneDatos: async function (req) {
		// Variables
		const {baseUrl, tarea, siglaFam, entidad} = comp.partesDelUrl(req);
		const {originalUrl} = req;
		const tema = baseUrl == "/revision" ? "revisionEnts" : "fmCrud";
		const codigo = tarea.slice(1);
		const {id} = req.query;
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		const petitFams = comp.obtieneDesdeEntidad.petitFams(entidad);
		const origen = req.query.origen;
		let comentario;

		// Obtiene el registro
		let include = [...comp.obtieneTodosLosCamposInclude(entidad)];
		include.push("statusRegistro", "creadoPor", "statusSugeridoPor", "altaRevisadaPor");
		const original = await baseDatos.obtienePorId(entidad, id, include);

		// Datos del rclv
		let canonNombre, rclvNombre;
		if (familia == "rclv") {
			canonNombre = comp.canonNombre(original);
			rclvNombre = original.nombre;
		}

		// Más variables
		const status_id = original.statusRegistro_id;
		const urlActual = req.originalUrl;
		const entsNombre = variables.entidades[petitFams + "Nombre"];
		const {titulo, entidadNombre} = this.titulo({entidad, originalUrl});
		const bloqueDer = await this.bloques.consolidado({tema, familia, entidad, original});
		const imgDerPers = this.obtieneAvatar(original).orig;
		const cartelGenerico = codigo != "historial";

		// Fin
		return {
			...{tema, codigo, titulo, origen},
			...{siglaFam, entidad, entidadNombre, familia, petitFams, id, registro: original, comentario},
			...{canonNombre, rclvNombre, imgDerPers, bloqueDer, status_id},
			...{entsNombre, urlActual, cartelGenerico},
		};
	},
	titulo: ({entidad, originalUrl}) => {
		// Variables
		const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
		const titulos = [
			// Revisión
			{url: "revision/edicion", titulo: "Revisión de Edicion de"},
			{url: "revision/rechazar", titulo: "Rechazar"},
			{url: "revision/inactivar", titulo: "Revisión de Inactivar"},
			{url: "revision/recuperar", titulo: "Revisión de Recuperar"},

			// Crud
			{url: "historial", titulo: "Historial de"},
			{url: "inactivar", titulo: "Inactivar"},
			{url: "recuperar", titulo: "Recuperar"},
		];

		// Título
		let titulo = titulos.find((n) => originalUrl.includes("/" + n.url + "/")).titulo;
		titulo += comp.obtieneDesdeEntidad.unaUn(entidad);
		titulo += entidadNombre;

		// Fin
		return {titulo, entidadNombre};
	},
	obtieneDatosGuardar: async function (req) {
		// Variables
		const {entidad, tarea} = comp.partesDelUrl(req);
		const codigo = tarea.slice(1);
		const {id} = req.query;
		const {motivo_id, entDupl, idDupl} = req.body;

		// Más variables
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		const siglaFam = familia[0];
		const usuario_id = req.session.usuario.id;
		const ahora = comp.fechaHora.ahora();
		const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
		const include = comp.obtieneTodosLosCamposInclude(entidad);
		const original = await baseDatos.obtienePorId(entidad, id, include);
		const statusFinal_id = codigo == "inactivar" ? inactivar_id : recuperar_id;

		// Comentario
		let {comentario} = req.body;
		comentario = await this.comentario({entidad, id, codigo, motivo_id, entDupl, idDupl, comentario, statusFinal_id});

		// Fin
		return {
			...{familia, siglaFam, entidad, id},
			...{motivo_id, codigo, usuario_id, ahora, campo_id, original, statusFinal_id, comentario},
		};
	},
	comentario: async function (datos) {
		// Stoppers
		if (datos.codigo == "recuperar") return datos.comentario;
		if (!datos.motivo_id) return null;

		// Variables
		let comentario = datos.comentario;

		// Si el motivo es 'duplicado', genera el comentario
		if (
			datos.motivo_id == motivoDupl_id &&
			((datos.tema != "revision" && datos.codigo == "inactivar") || datos.codigo == "rechazar") // crud de inactivar, o rechazar
		) {
			const {entDupl, idDupl} = datos;
			const elLa = comp.obtieneDesdeEntidad.elLa(entDupl);
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entDupl).toLowerCase();
			comentario = "con" + elLa + entidadNombre + " id " + idDupl;
		}

		// Si corresponde, lo obtiene del movimiento anterior
		if (!comentario && datos.tema == "revision" && [inactivar_id, recuperar_id].includes(datos.statusOriginal_id)) {
			const ultHist = await this.historialDeStatus.ultimoRegistro(datos.entidad, datos.id);
			if (ultHist && ultHist.comentario) comentario = ultHist.comentario;
		}

		// Quita el punto final
		if (comentario && comentario.endsWith(".")) comentario = comentario.slice(0, -1);

		// Fin
		return comentario;
	},
	obtieneOriginalEdicion: async ({entidad, entId, usuario_id, excluirInclude, omitirPulirEdic}) => {
		// Variables
		const entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
		const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
		const condEdic = {[campo_id]: entId, editadoPor_id: usuario_id};
		const includesEdic = !excluirInclude ? comp.obtieneTodosLosCamposInclude(entidad) : null;

		// Obtiene los campos include
		const includesOrig = !excluirInclude
			? [...includesEdic, "creadoPor", "altaRevisadaPor", "statusSugeridoPor", "statusRegistro"]
			: null;

		// Obtiene los registros
		let original = baseDatos.obtienePorId(entidad, entId, includesOrig);
		let edicion = usuario_id ? baseDatos.obtienePorCondicion(entEdic, condEdic, includesEdic) : null;
		[original, edicion] = await Promise.all([original, edicion]);

		// Le quita al original los campos sin contenido
		for (let prop in original) if (original[prop] === null) delete original[prop];

		// Pule la edición
		edicion = edicion
			? omitirPulirEdic
				? edicion
				: await comp.puleEdicion(entidad, original, edicion) // El output puede ser 'null'
			: {}; // Debe ser un objeto, porque más adelante se lo trata como tal

		// Fin
		return [original, edicion];
	},
	guardaActEdic: async ({entidad, original, edicion, usuario_id}) => {
		// Variables
		let entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);

		// Quita la info que no agrega valor
		edicion = await comp.puleEdicion(entidad, original, edicion);

		// Acciones si quedaron datos para actualizar
		if (edicion) {
			// Si existe el registro, lo actualiza
			if (edicion.id) await baseDatos.actualizaPorId(entEdic, edicion.id, edicion);
			// Si no existe el registro, lo agrega
			else {
				// campo_id, editadoPor_id
				const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
				edicion[campo_id] = original.id;
				edicion.editadoPor_id = usuario_id;

				// producto_id
				if (entidad == "links") {
					const prodCampo_id = comp.obtieneDesdeCampo_id.prodCampo_id(original);
					edicion[prodCampo_id] = original[prodCampo_id];
					if (prodCampo_id != "pelicula_id") edicion.grupoCol_id = original.grupoCol_id; // para ediciones de links
				}

				// grupoCol_id
				if (entidad == "colecciones") edicion.grupoCol_id = original.id; // para ediciones de colección
				if (entidad == "capitulos") edicion.grupoCol_id = original.coleccion_id; // para ediciones de capítulos
				if (entidad == "links") edicion.grupoCol_id = original.grupoCol_id; // para ediciones de links

				// Se agrega el registro
				await baseDatos.agregaRegistro(entEdic, edicion);
			}
		}

		// Fin
		return edicion;
	},
	historialDeStatus: {
		obtiene: async function (prodRclv) {
			// Variables
			const {entidad, id: entidad_id, creadoPor_id, creadoEn} = prodRclv;
			const condicion = {entidad, entidad_id};
			const include = ["statusOriginal", "statusFinal", "motivo"];

			// Obtiene el historial de status
			let historialStatus = await baseDatos
				.obtieneTodosPorCondicion("statusHistorial", condicion, include)
				.then((n) => n.sort((a, b) => a.statusFinalEn - b.statusFinalEn));

			// Agrega los registros anteriores al historial
			historialStatus = this.movimsAntsAlHist({prodRclv, historialStatus});

			// Completa el historial
			historialStatus = this.revisaElHist(historialStatus);

			// Procesa los comentarios
			historialStatus = historialStatus.map((n) => {
				const llevaComentario = [inactivar_id, inactivo_id].includes(n.statusFinal_id); // sólo esos status llevan ña descripción del motivo
				const motivo = llevaComentario && n.motivo && !n.motivo.general ? n.motivo.descripcion : "";
				const comentario = motivo + (n.comentario ? (motivo ? ": " : "") + n.comentario : "");
				return {...n, comentario};
			});

			// Fin
			return this.formato(historialStatus);
		},
		movimsAntsAlHist: ({prodRclv, historialStatus}) => {
			// Variables
			const {
				entidad,
				id: entidad_id,
				creadoPor_id,
				creadoEn,
				altaRevisadaEn,
				altaTermEn,
				statusSugeridoEn,
				statusRegistro_id,
			} = prodRclv;
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			let statusOriginal_id, regHistorial;

			// Agrega el primer registro con status 'creado_id'
			let statusFinal_id = creado_id;
			let statusFinal = {nombre: "Creado", codigo: "creado"};
			let statusFinalPor_id = creadoPor_id;
			let statusFinalEn = creadoEn;
			historialStatus.unshift({statusFinal_id, statusFinal, statusFinalPor_id, statusFinalEn});

			// Acciones para el status posterior a 'creado_id'
			if (
				statusRegistro_id > creado_id &&
				(historialStatus.length == 1 || // no hay registro siguiente (ej: porque se eliminó c/feedback a usuarios)
					historialStatus[1].statusOriginal_id != creado_id) // existe registro siguiente y comienza con un status distinto a como termina el anterior
			) {
				statusOriginal_id = creado_id;
				statusFinal_id =
					historialStatus.length > 1
						? historialStatus[1].statusOriginal_id != creado_id || // hubo un movimiento intermedio
						  historialStatus[1].statusFinal_id != inactivo_id // no se rechazó de entrada
							? familia == "producto" // no se rechazó de entrada
								? creadoAprob_id
								: aprobado_id
							: null // se rechazó de entrada
						: statusRegistro_id <= aprobado_id // cuando no hay historial
						? familia == "producto"
							? creadoAprob_id
							: aprobado_id
						: null; // de lo contrario, el status del producto

				// Si el movimiento ya corresponde al historial, interrumpe la función
				if (!statusFinal_id) return historialStatus;
				// Si el siguiente registro en el historial no continúa del anterior, agrega el movimiento
				else {
					statusFinalEn = altaRevisadaEn;
					statusFinal = FN.statusFinal(statusFinal_id);
					regHistorial = {entidad, entidad_id, statusOriginal_id, statusFinal_id, statusFinalEn, statusFinal};
					historialStatus.splice(1, 0, regHistorial);
				}
			}

			// Acciones para el status posterior a 'creadoAprob_id'
			if (
				statusRegistro_id > creadoAprob_id &&
				historialStatus[1].statusFinal_id == creadoAprob_id // el registro anterior terminó en 'creadoAprob_id'
			) {
				// Si no se completó el alta, interrumpe la función
				if (!altaTermEn) return historialStatus;

				// Averigua el 'statusFinalEn'
				statusFinalEn = altaTermEn
					? altaTermEn // si se completó el alta, esa fecha
					: historialStatus.length > 2
					? historialStatus[2].statusOriginalEn // si el historial tiene un registro siguiente, ese registro
					: statusSugeridoEn; // de lo contrario, el status del producto

				// Agrega el registro al historial
				statusOriginal_id = creadoAprob_id;
				statusFinal_id = aprobado_id;
				statusFinal = FN.statusFinal(statusFinal_id);
				regHistorial = {entidad, entidad_id, statusOriginal_id, statusFinal_id, statusFinalEn, statusFinal};
				historialStatus.splice(2, 0, regHistorial);
			}

			// Fin
			return historialStatus;
		},
		revisaElHist: (historialStatus) => {
			// Variables

			// Revisa de a uno el historial, asumiendo que no hay errores
			let contador = 1;
			while (contador <= historialStatus.length - 1) {
				// Variables
				const anterior = historialStatus[contador - 1];
				const siguiente = historialStatus[contador];

				// Si en el historial se omite un movimiento, lo agrega
				if (anterior.statusFinal_id != siguiente.statusOriginal_id) {
					const regAgregar = {
						statusOriginal_id: anterior.statusFinal_id,
						statusFinal_id: siguiente.statusOriginal_id,
						statusFinalEn: siguiente.statusOriginalEn,
						statusFinal: FN.statusFinal(siguiente.statusOriginal_id),
					};
					historialStatus.splice(contador, 0, regAgregar);
				}

				// Fin de la rutina
				contador++;
				if (contador == 10) break; // en caso que el historial sea demasiado extenso
			}

			// Fin
			return historialStatus;
		},
		formato: (historialStatus) => {
			historialStatus.forEach((reg, i) => {
				// Variables
				const {statusFinalEn} = reg;
				let fecha;
				if (statusFinalEn) {
					const dia = statusFinalEn.getDate();
					const mes = statusFinalEn.getMonth() + 1;
					const ano = String(statusFinalEn.getFullYear()).slice(-2);
					const fechaDelAno = fechasDelAno.find((n) => n.dia == dia && n.mes_id == mes);
					const fechaNombre = fechaDelAno.nombre;
					fecha = fechaNombre + "/" + ano;
				}
				const statusCodigo = reg.statusFinal.codigo;
				const statusNombre = reg.statusFinal.nombre;
				const {comentario} = reg;
				historialStatus[i] = {statusCodigo, statusNombre, fecha, comentario};
			});

			// Fin
			return historialStatus;
		},
		ultimoRegistro: async (entidad, entidad_id) => {
			// Obtiene el 'ultHist'
			const condicion = {
				entidad,
				entidad_id,
				[Op.or]: {statusOriginal_id: {[Op.gt]: aprobado_id}, statusFinal_id: {[Op.gt]: aprobado_id}},
			};
			const ultHist = await baseDatos.obtienePorCondicionElUltimo("statusHistorial", condicion, "statusFinalEn");

			// Fin
			return ultHist;
		},
	},
	statusAlineado: async function ({entidad, id, prodRclv}) {
		// Obtiene el 'prodRclv'
		if (!prodRclv) {
			let include = ["statusRegistro"]; // se necesita para la vista de 'cambiarStatus'
			if (entidad == "capitulos") include.push("coleccion");
			prodRclv = await baseDatos.obtienePorId(entidad, id, include);
		} else id = prodRclv.id;
		const {statusRegistro_id} = prodRclv;

		// Obtiene el 'ultHist'
		const ultHist = await this.historialDeStatus.ultimoRegistro(entidad, id);
		const statusFinal_id = ultHist ? ultHist.statusFinal_id : null;

		// Compara los status
		const statusAlineado =
			(statusRegistro_id == creado_id && !ultHist) || // creado
			(aprobados_ids.includes(statusRegistro_id) && (!ultHist || aprobados_ids.includes(statusFinal_id))) || // creadoAprob, aprobado
			([...inacRecup_ids, inactivo_id].includes(statusRegistro_id) && statusRegistro_id == statusFinal_id); // inactivar, recuperar, inactivo

		// Fin
		return {statusAlineado, prodRclv, ultHist};
	},
	accsEnDepsPorCambioDeStatus: async (entidad, registro) => {
		// Variables
		const familias = comp.obtieneDesdeEntidad.familias(entidad);

		// prodsEnRclv
		if (familias == "productos") {
			// Variables
			const prodAprob = activos_ids.includes(registro.statusRegistro_id); // antes era 'aprobados_ids'

			// Actualiza prodAprob en sus links
			if (registro.links && registro.links.length) {
				const campo_id = entidad == "colecciones" ? "grupoCol_id" : comp.obtieneDesdeEntidad.campo_id(entidad);
				await baseDatos.actualizaPorCondicion("links", {[campo_id]: registro.id}, {prodAprob});
			}

			// Rutina por entidad rclv
			const rclvEnts = variables.entidades.rclvs;
			for (let rclvEnt of rclvEnts) {
				const rclvCampo_id = comp.obtieneDesdeEntidad.campo_id(rclvEnt);
				if (registro[rclvCampo_id] && registro[rclvCampo_id] != ninguno_id)
					prodAprob
						? baseDatos.actualizaPorId(rclvEnt, registro[rclvCampo_id], {prodsAprob: true})
						: comp.actualizaProdsEnRclv({entidad: rclvEnt, id: registro[rclvCampo_id]});
			}
		}

		// linksEnProds
		if (familias == "links") {
			// Obtiene los datos identificatorios del producto
			const prodEnt = comp.obtieneDesdeCampo_id.prodEnt(registro);
			const campo_id = comp.obtieneDesdeCampo_id.prodCampo_id(registro);
			const prodId = registro[campo_id];

			// Actualiza el producto
			await comp.linksEnProd({entidad: prodEnt, id: prodId});
			if (prodEnt == "capitulos") {
				const colID = await baseDatos.obtienePorId("capitulos", prodId).then((n) => n.coleccion_id);
				comp.actualizaCalidadDeLinkEnCol(colID);
			}
		}

		// Actualiza la variable de links vencidos
		await comp.actualizaCantLinksPorSem();

		// Fin
		return;
	},
	obtieneCapsTemp: async (capitulo) => {
		// Variables
		const {coleccion_id, numTemp, statusRegistro_id} = capitulo;
		const condicion = {coleccion_id, numTemp};
		if (statusRegistro_id) condicion.statusRegistro_id = statusRegistro_id;

		// Obtiene registros
		const registros = await baseDatos
			.obtieneTodosPorCondicion("capitulos", condicion)
			.then((n) => n.sort((a, b) => a.numCap - b.numCap))
			.then((n) => n.map((m) => ({id: m.id, numCap: m.numCap, nombre: m.nombreCastellano || m.nombreOriginal})));

		// Fin
		return registros;
	},

	// CRUD y Revisión
	obtieneAvatar: (original, edicion) => {
		// Variables
		const carpeta = original.fuente ? "/imgsPropio/1-Productos" : "/imgsComp/2-Rclvs"; // los registros de producto tienen el campo 'fuente'
		const final = {fs: original.fuente ? carpProds.final : carpRclvs.final, src: carpeta + "/Final/"};
		const revisar = {fs: original.fuente ? carpProds.revisar : carpRclvs.revisar, src: carpeta + "/Revisar/"};
		const sinAvatar = "/imgsPropio/Avatar/Sin-Avatar.jpg";

		// Obtiene el avatar original
		const orig = original.avatar
			? original.avatar.includes("/")
				? original.avatar
				: comp.gestionArchivos.existe(path.join(final.fs, original.avatar))
				? final.src + original.avatar
				: comp.gestionArchivos.existe(path.join(revisar.fs, original.avatar))
				? revisar.src + original.avatar
				: sinAvatar
			: sinAvatar;

		// Obtiene el avatar de la edición
		const edic =
			edicion && edicion.avatar
				? edicion.avatar.includes("/")
					? edicion.avatar
					: comp.gestionArchivos.existe(path.join(final.fs, edicion.avatar))
					? final.src + edicion.avatar
					: comp.gestionArchivos.existe(path.join(revisar.fs, edicion.avatar))
					? revisar.src + edicion.avatar
					: orig
				: orig;

		// Fin
		return {orig, edic};
	},
	elimina: {
		demasEdiciones: async ({entidad, original, id}) => {
			// Revisa cada registro de edición y decide si corresponde:
			// - Eliminar el registro
			// - Elimina el valor del campo

			// Variables
			const nombreEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
			const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
			const condicion = {[campo_id]: id};
			const ediciones = await baseDatos.obtieneTodosPorCondicion(nombreEdic, condicion);

			// Acciones si existen ediciones
			if (ediciones.length) {
				let espera = [];
				for (let edic of ediciones) espera.push(comp.puleEdicion(entidad, original, edic));
				await Promise.all(espera);
			}

			// Fin
			return;
		},
		dependientes: async function (entidad, id) {
			// Variables
			const familias = comp.obtieneDesdeEntidad.familias(entidad);
			const entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
			const campo_id = entidad == "colecciones" ? "grupoCol_id" : comp.obtieneDesdeEntidad.campo_id(entidad);
			const condicion = {[campo_id]: id};
			const espera = [];

			// Elimina las ediciones
			espera.push(baseDatos.eliminaPorCondicion(entEdic, condicion));

			// Productos
			if (familias == "productos") {
				// Elimina las ediciones de link - debe ser 'await', por los links originales
				await baseDatos.eliminaPorCondicion("linkEdics", condicion);

				// Elimina los registros de las entidades dependientes, comunes a todos los productos
				for (let entDepen of ["prodsAzar", "links"]) espera.push(baseDatos.eliminaPorCondicion(entDepen, condicion));

				// Elimina los registros de las entidades dependientes, específicos de las colecciones
				if (entidad == "colecciones") {
					await Promise.all(espera); // por ediciones, prodsAzar, links - con impacto en 'capítulos'
					for (let entDepen of ["capitulos", "capsSinLink"])
						espera.push(baseDatos.eliminaPorCondicion(entDepen, {coleccion_id: id}));
				}
			}

			// Rclv
			if (familias == "rclvs") {
				// Borra el vínculo en las ediciones de producto y las elimina si quedan vacías
				espera.push(this.vinculoEdicsProds({rclvEnt: entidad, rclvID: id}));

				// Borra el vínculo en los productos y les cambia el status si corresponde
				espera.push(this.vinculoProds({rclvEnt: entidad, rclvID: id}));

				// Borra el vínculo en 'fechasDelAno'
				if (entidad == "epocasDelAno") {
					await baseDatos.actualizaPorCondicion("fechasDelAno", {[campo_id]: id}, {[campo_id]: 1}); // Quita la relación en la fecha del año
					espera.push(comp.actualizaSolapam()); // Actualiza solapamiento y la variable 'fechasDelAno'
				}
			}

			// Espera a que se completen las rutinas
			await Promise.all(espera);

			// Fin
			return;
		},
		vinculoEdicsProds: async ({rclvEnt, rclvID}) => {
			// Variables
			const rclvCampo_id = comp.obtieneDesdeEntidad.campo_id(rclvEnt);

			// Averigua si existen ediciones
			const ediciones = await baseDatos.obtieneTodosPorCondicion("prodEdics", {[rclvCampo_id]: rclvID});
			if (ediciones.length) {
				// Les borra el vínculo
				await baseDatos.actualizaPorCondicion("prodEdics", {[rclvCampo_id]: rclvID}, {[rclvCampo_id]: null});

				// Revisa si tiene que eliminar alguna edición - la rutina no necesita este resultado
				FN.eliminaEdicionesVacias(ediciones, rclvCampo_id);
			}

			// Fin
			return;
		},
		vinculoProds: async function ({rclvEnt, rclvID}) {
			// Variables
			const rclvCampo_id = comp.obtieneDesdeEntidad.campo_id(rclvEnt);
			const entidades = variables.entidades.prods;
			let prods = [];
			let espera = [];

			// Obtiene los productos vinculados al rclv, en cada entidad
			for (let entidad of entidades)
				prods.push(
					baseDatos
						.obtieneTodosPorCondicion(entidad, {[rclvCampo_id]: rclvID})
						.then((n) => n.map((m) => ({...m, [campo_id]: 1})))
				);
			prods = await Promise.all(prods).then((n) => n.flat());

			// Averigua si existían productos vinculados al rclv
			if (prods.length) {
				// Les actualiza el rclvCampo_id al valor 'Ninguno'
				for (let entidad of entidades)
					espera.push(baseDatos.actualizaPorCondicion(entidad, {[campo_id]: rclvID}, {[campo_id]: 1}));

				//Revisa si se le debe cambiar el status a algún producto - la rutina no necesita este resultado
				this.siHayErroresBajaElStatus(prodsPorEnts);
			}

			// Espera a que concluyan las rutinas
			await Promise.all(espera);

			// Fin
			return;
		},
		siHayErroresBajaElStatus: function (prodsPorEnts) {
			// Variables
			const entidades = variables.entidades.prods;

			// Acciones por cada ENTIDAD
			entidades.forEach(async (entidad, i) => {
				// Averigua si existen registros por cada entidad
				if (prodsPorEnts[i].length)
					// Acciones por cada PRODUCTO
					for (let original of prodsPorEnts[i]) {
						// Si hay errores, le cambia el status
						const errores = await validacs.consolidado({datos: {...original, entidad}});
						if (errores.impideAprobado)
							baseDatos.actualizaPorId(entidad, original.id, {statusRegistro_id: creadoAprob_id});
					}
			});

			// Fin
			return;
		},
	},

	// Bloques a mostrar
	bloques: {
		consolidado: async function ({tema, familia, entidad, original}) {
			return tema == "revisionEnts"
				? {
						registro: await this.registro({...original, entidad}),
						usuario: await this.usuario(original.statusSugeridoPor_id, entidad),
				  }
				: familia == "producto"
				? {producto: true, registro: await this.registro({...original, entidad})}
				: familia == "rclv"
				? {rclv: this.rclv({...original, entidad}), registro: await this.registro({...original, entidad})}
				: {};
		},
		registro: async (registro) => {
			// Variable
			let resultado = [];

			// Datos CRUD
			resultado.push(
				!registro.altaRevisadaEn
					? {titulo: "Creado el", valor: comp.fechaHora.diaMesAnoUTC(registro.creadoEn)}
					: {titulo: "Revisado el", valor: comp.fechaHora.diaMesAnoUTC(registro.altaRevisadaEn)}
			);

			// Status resumido
			resultado.push({titulo: "Status", ...FN.statusRegistro(registro)});

			// Si el registro está inactivo, le agrega el motivo
			if (registro.statusRegistro_id == inactivo_id) resultado.push(await FN.obtieneMotivoDetalle(registro));

			// Fin
			return resultado;
		},
		rclv: (registro) => {
			// Variables
			const {entidad} = registro;
			let bloque = [];

			// Información
			bloque.push({titulo: "Nombre", valor: registro.nombre});
			if (registro.nombreAltern) {
				const articulo =
					entidad == "personajes"
						? (registro.genero_id.includes("M") ? "o" : "a") + (registro.genero_id.includes("P") ? "s" : "")
						: comp.obtieneDesdeEntidad.oa(entidad);
				bloque.push({titulo: "También conocid" + articulo + " como", valor: registro.nombreAltern});
			}
			if (registro.canon && registro.canon_id != "NN" && registro.canon[registro.genero_id])
				bloque.push({titulo: "Status Canoniz.", valor: registro.canon[registro.genero_id]});

			if (registro.fechaDelAno && registro.fechaDelAno.id < 400) {
				const articulo = comp.letras.laLo(registro);
				const titulo =
					"Se " + articulo + (entidad == "epocasDelAno" ? " comienza a recordar a partir del" : " recuerda el");
				bloque.push({titulo, valor: registro.fechaDelAno.nombre});
			}

			if (registro.rolIglesia && registro.rolIglesia_id != "NN")
				bloque.push({titulo: "Rol en la Iglesia", valor: registro.rolIglesia[registro.genero_id]});
			if (registro.apMar && registro.apMar_id != sinApMar_id)
				bloque.push({titulo: "Aparición Mariana", valor: registro.apMar.nombre});
			if (registro.anoNacim) bloque.push({titulo: "Año de nacimiento", valor: registro.anoNacim});

			// Particularidades para hechos
			if (entidad == "hechos") {
				if (registro.anoComienzo) bloque.push({titulo: "Año", valor: registro.anoComienzo});
				if (registro.ama) bloque.push({valor: "Es una aparición mariana"});
			}

			// Fin
			return bloque;
		},
		usuario: async (usuario_id, entidad) => {
			// Variables
			const petitFams = entidad ? comp.obtieneDesdeEntidad.petitFams(entidad) : "edics";
			const ahora = comp.fechaHora.ahora();
			const usuario = await baseDatos.obtienePorId("usuarios", usuario_id);
			let bloque = [];

			// Nombre
			bloque.push({titulo: "Nombre", valor: usuario.nombre + " " + usuario.apellido});

			// Edad
			if (usuario.fechaNacim) {
				let edad = parseInt((ahora - new Date(usuario.fechaNacim).getTime()) / unAno);
				bloque.push({titulo: "Edad", valor: edad + " años"});
			}

			// Tiempo en ELC
			const antiguedad = ((ahora - new Date(usuario.creadoEn).getTime()) / unAno).toFixed(1).replace(".", ",");
			bloque.push({titulo: "Tiempo en ELC", valor: antiguedad + " años"});

			// Calidad de las altas
			bloque.push(...FN.usuarioCalidad(usuario, petitFams));

			// Fin
			return bloque;
		},
	},
};

// Funciones
const FN = {
	eliminaEdicionesVacias: async function (ediciones, rclvCampo_id) {
		// Revisa si tiene que eliminar alguna edición
		for (let edicion of ediciones) {
			// Variables
			const prodCampo_id = comp.obtieneDesdeCampo_id.prodCampo_id(edicion);
			const prodEnt = comp.obtieneDesdeCampo_id.prodEnt(edicion);
			const prodId = edicion[prodCampo_id];

			// Obtiene el producto original
			const original = await baseDatos.obtienePorId(prodEnt, prodId);

			// Elimina la edición si está vacía
			delete edicion[rclvCampo_id];
			await comp.puleEdicion(prodEnt, original, edicion);
		}
		// Fin
		return;
	},
	statusRegistro: (registro) => {
		// Variables
		const {entidad, id} = registro;
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		const {codigo, nombre} = registro.statusRegistro;
		const origen = familia == "producto" ? "P" : "R";
		const cola = "/?entidad=" + entidad + "&id=" + id + "&origen=DT" + origen;

		// Fin
		return {codigo, valor: nombre};
	},
	usuarioCalidad: (usuario, petitFams) => {
		// Contar los casos aprobados y rechazados
		const cantAprob = usuario[petitFams + "Aprob"];
		const cantRech = usuario[petitFams + "Rech"];

		// Mediciones
		const cantidad = cantAprob + cantRech;
		const calidad = cantidad ? parseInt((cantAprob / cantidad) * 100) + "%" : "-";

		// Prepara el resultado
		const sufijo = petitFams == "edics" ? "Ediciones" : "Altas";
		const resultados = [
			{titulo: "Eficacia de " + sufijo, valor: calidad},
			{titulo: "Cant. de " + sufijo, valor: cantidad.toLocaleString("pt")},
		];

		// Fin
		return resultados;
	},
	obtieneMotivoDetalle: async (registro) => {
		// Variables
		const {entidad, id: entidad_id} = registro;
		const condicion = {entidad, entidad_id, statusFinal_id: inactivo_id};

		// Obtiene el motivo del último statusHistorial
		const statusHistorial = await baseDatos.obtienePorCondicionElUltimo("statusHistorial", condicion, "statusFinalEn");
		const motivo =
			statusHistorial && statusHistorial.motivo_id && statusMotivos.find((n) => n.id == statusHistorial.motivo_id);
		const motivoDetalle = motivo && (motivo.general ? statusHistorial.comentario : motivo.descripcion);

		// Fin
		return {motivoDetalle};
	},
	statusFinal: (statusFinal_id) => {
		const {nombre} = statusRegistros.find((n) => n.id == statusFinal_id);
		const {codigo} = statusRegistros.find((n) => n.id == statusFinal_id);
		return {nombre, codigo};
	},
};
