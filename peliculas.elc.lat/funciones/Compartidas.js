"use strict";

// Exportar
module.exports = {
	// Entidades
	obtieneDesdeEntidad: {
		// Familia y derivados
		familia: (entidad) => {
			return [...variables.entidades.prods, "prodEdics"].includes(entidad)
				? "producto"
				: [...variables.entidades.rclvs, "rclvEdics"].includes(entidad)
				? "rclv"
				: ["links", "linkEdics"].includes(entidad)
				? "link"
				: entidad == "usuarios"
				? "usuario"
				: null;
		},
		familias: function (entidad) {
			const familia = this.familia(entidad);
			const familias = familia ? familia + "s" : null;
			return familias;
		},
		petitFams: function (entidad) {
			const familias = this.familias(entidad);
			const petitFams = familias == "productos" ? "prods" : familias;
			return petitFams;
		},
		entEdic: function (entidad) {
			const petitFam = this.petitFams(entidad).slice(0, -1);
			const entEdic = petitFam ? petitFam + "Edics" : null;
			return entEdic;
		},
		// Campos vinculados
		campo_id: (entidad) => {
			const indice = variables.entidades.todos.indexOf(entidad);
			const campo_id = indice > -1 && variables.entidades.todos_id[indice];
			return campo_id;
		},
		asociacion: (entidad) => {
			const indice = variables.entidades.todos.indexOf(entidad);
			const asociacion = indice > -1 ? variables.entidades.todosAsocs[indice] : null;
			return asociacion;
		},
		siglaFam: (entidad) => FN.siglaFam(entidad),
		entidadNombre: (entidad) => FN.entidadNombre(entidad),

		// Masculino / Femenino
		delLa: (entidad) => {
			return variables.entidades.femenino.includes(entidad) ? " de la " : " del ";
		},
		elLa: (entidad) => {
			return variables.entidades.femenino.includes(entidad) ? " la " : " el ";
		},
		oa: (entidad) => (variables.entidades.femenino.includes(entidad) ? "a" : "o"),
		ea: (entidad) => (variables.entidades.femenino.includes(entidad) ? "a" : "e"),
		unaUn: (entidad) => (variables.entidades.femenino.includes(entidad) ? " una " : " un "),
	},
	obtieneDesdeCampo_id: {
		// Entidad
		prodEnt: (registro) => {
			const {prods: prodEnts, prodCampos_id: campos_id} = variables.entidades;
			for (let i = 0; i < campos_id.length; i++) if (registro[campos_id[i]]) return prodEnts[i];
			return null;
		},
		rclvEnt: (registro) => {
			const {rclvs: rclvEnts, rclvCampos_id: campos_id} = variables.entidades;
			for (let i = 0; i < campos_id.length; i++) if (registro[campos_id[i]]) return rclvEnts[i];
			return null;
		},
		entidad: function (registro, familiaEdic) {
			const prodEnt = this.prodEnt(registro);
			const rclvEnt = this.rclvEnt(registro);

			// Fin
			if (familiaEdic) return familiaEdic == "prodEdics" ? prodEnt : familiaEdic == "rclvEdics" ? rclvEnt : null;
			else return registro.link_id ? "links" : prodEnt || rclvEnt;
		},

		// campo_id
		prodCampo_id: (registro) => {
			for (let campo_id of variables.entidades.prodCampos_id) if (registro[campo_id]) return campo_id;
			return null;
		},
		rclvCampo_id: (registro) => {
			for (let campo_id of variables.entidades.rclvCampos_id) if (registro[campo_id]) return campo_id;
			return null;
		},
		campo_id: function (registro) {
			// Variables
			const prodCampo_id = this.prodCampo_id(registro);
			const rclvCampo_id = this.rclvCampo_id(registro);

			// Fin - es importante el orden link_id, prodCampo_id, rclvCampo_id, por sus ediciones
			return registro.link_id ? "link_id" : prodCampo_id || rclvCampo_id;
		},

		// Asociación
		prodAsoc: (registro) => FN.obtieneProdAsoc(registro),
		asociacion: (registro) => {
			const prodAsoc = FN.obtieneProdAsoc(registro);
			const rclvAsoc = FN.obtieneRclvAsoc(registro);
			return registro.link_id ? "link" : prodAsoc || rclvAsoc;
		},
	},
	obtieneDesdeAsoc: {
		// Entidad
		entidad: (asoc) => {
			const indice = variables.entidades.prodsRclvsAsoc.indexOf(asoc);
			const entidad = indice > -1 ? variables.entidades.prodsRclvs[indice] : null;
			return entidad;
		},
		entidadNombre: (asoc) => {
			const indice = variables.entidades.prodsRclvsAsoc.indexOf(asoc);
			const entNombre = indice > -1 ? variables.entidades.todosNombre[indice] : null;
			return entNombre;
		},

		// Masculino y Femenino
		oa: (asoc) => (["pelicula", "coleccion", "epocaDelAno"].includes(asoc) ? "a" : "o"),
		a: (asoc) => (["pelicula", "coleccion", "epocaDelAno"].includes(asoc) ? "a" : ""),
	},
	obtieneEntidadDesdeUrl: (req) => {
		// Lo obtiene del path
		let {entidad} = req.params;
		if (entidad) return entidad;

		// Lo obtiene del url
		const url = req.originalUrl;
		entidad = variables.entidades.todos.find((n) => url.includes("/" + n + "/"));
		return entidad;
	},

	// Productos y Rclvs
	obtieneLeadTime: (desdeOrig, hastaOrig) => {
		// Variables
		let desdeFinal = desdeOrig;
		let hastaFinal = hastaOrig;

		// Pasa el 'desde' del sábado/domingo al lunes siguiente
		if (desdeOrig.getDay() == 6) desdeFinal = desdeOrig + 2 * unDia;
		else if (desdeOrig.getDay() == 0) desdeFinal = desdeOrig + 1 * unDia;

		// Pasa el 'hasta' del sábado/domingo al viernes anterior
		if (hastaOrig.getDay() == 6) hastaFinal = hastaOrig - 1 * unDia;
		else if (hastaOrig.getDay() == 0) hastaFinal = hastaOrig - 2 * unDia;

		// Calcula la cantidad de horas
		let diferencia = hastaFinal - desdeFinal;
		if (diferencia < 0) diferencia = 0;
		let horasDif = diferencia / unaHora;

		// Averigua la cantidad de fines de semana
		let semanas = parseInt(horasDif / (7 * 24));
		horasDif -= semanas * 2 * 24;

		// Resultado
		let leadTime = parseInt(horasDif * 100) / 100; // Redondea a 2 digitos
		leadTime = Math.min(96, leadTime);

		// Fin
		return leadTime;
	},
	obtieneTodosLosCamposInclude: function (entidad) {
		// Obtiene todos los campos de la familia
		const familias = this.obtieneDesdeEntidad.familias(entidad);
		const camposFamilia = [...variables.camposRevisar[familias]];

		// Obtiene los campos include
		const camposInclude = camposFamilia.filter((n) => n.relacInclude);
		const camposEntidad = familias == "links" ? camposInclude : camposInclude.filter((n) => n[entidad] || n[familias]);

		// Genera un array con las asociaciones
		const asociaciones = camposEntidad.map((n) => n.relacInclude);

		// Fin
		return asociaciones;
	},
	obtieneRegs: async function (campos) {
		// Obtiene los resultados
		let resultados = await FN.obtieneRegs(campos);

		// Quita los comprometidos por capturas
		resultados = await this.sinProblemasDeCaptura(resultados, campos.revId);

		// Fin
		return resultados;
	},
	puleEdicion: async function (entidad, original, edicion) {
		// Variables
		const familias = this.obtieneDesdeEntidad.familias(entidad);
		const entEdic = this.obtieneDesdeEntidad.entEdic(entidad);
		const edicId = edicion.id;
		let camposNull = {};
		let camposRevisar = [];

		// Obtiene los campos a revisar
		for (let campo of variables.camposRevisar[familias]) {
			// Saltea los campos que corresponda
			if (campo.exclusivo && !campo.exclusivo.includes(entidad)) continue;

			// Agrega el campo simple
			camposRevisar.push(campo.nombre);

			// Agrega el campo include
			if (campo.relacInclude) camposRevisar.push(campo.relacInclude);
		}

		// Quita de edición los campos que correspondan
		for (let prop in edicion) {
			// Quita de edición los campos que no se comparan o que sean 'null'
			if (!camposRevisar.includes(prop) || edicion[prop] === null) {
				delete edicion[prop];
				continue;
			}

			// Corrige errores de data-entry
			if (typeof edicion[prop] == "string") edicion[prop] = edicion[prop].trim();

			// CONDICION 1: Los valores de original y edición son significativos e idénticos
			const condic1 =
				edicion[prop] === original[prop] || // son estrictamente iguales
				(typeof original[prop] == "number" && edicion[prop] == original[prop]) || // coincide el número
				(edicion[prop] === "1" && original[prop] === true) || // coincide el boolean
				(edicion[prop] === "0" && original[prop] === false); // coincide el boolean
			if (condic1) camposNull[prop] = null;

			// CONDICION 2: El objeto vinculado tiene el mismo ID
			const condic2 = edicion[prop] && edicion[prop].id && original[prop] && edicion[prop].id === original[prop].id;

			// Si se cumple alguna de las condiciones, se elimina ese método
			if (condic1 || condic2) delete edicion[prop];
		}

		// 3. Acciones en función de si quedan campos
		let quedanCampos = !!Object.keys(edicion).length;
		if (quedanCampos) {
			// Devuelve el id a la variable de edicion
			if (edicId) edicion.id = edicId;

			// Si la edición existe en BD y hubieron campos iguales entre la edición y el original, actualiza la edición
			if (edicId && Object.keys(camposNull).length) await baseDatos.actualizaPorId(entEdic, edicId, camposNull);
		} else {
			// Convierte en 'null' la variable de 'edicion'
			edicion = null;

			// Si había una edición guardada en la BD, la elimina
			if (edicId) await baseDatos.eliminaPorId(entEdic, edicId);
		}

		// Fin
		return edicion;
	},
	cartelRepetido: function (datos) {
		// Variables
		const {entidad, id} = datos;
		const entidadNombre = (datos.entidadNombre ? datos.entidadNombre : FN.entidadNombre(entidad)).toLowerCase(); // la primera opción es para links
		const siglaFam = FN.siglaFam(entidad);

		// 1. Inicio
		const ea = ["capitulos", "links"].includes(entidad) ? "e" : "a";
		const inicio = "Est" + ea + " ";

		// 2. Anchor
		const link = "/" + entidad + "/detalle/" + siglaFam + "/?id=" + id;
		const entidadHTML = "<u><b>" + entidadNombre + "</b></u>";
		const anchor = " <a href='" + link + "' target='_blank' tabindex='-1'> " + entidadHTML + "</a>";

		// 3. Final
		const final = " ya se encuentra en nuestra base de datos";

		// Fin
		return inicio + anchor + final;
	},
	valorNombre: (valor, alternativa) => (valor ? valor.nombre : alternativa),
	nombresPosibles: (registro) => FN.nombresPosibles(registro),
	sinProblemasDeCaptura: async function (prodsRclvs, revId) {
		// Variables
		const haceUnaHora = this.fechaHora.nuevoHorario(-1);
		const haceDosHoras = this.fechaHora.nuevoHorario(-2);

		// Obtiene las capturas ordenadas por fecha decreciente
		const capturas = await baseDatos.obtieneTodosConOrden("capturas", "capturadoEn", true);

		// Flitra según los criterios de captura
		prodsRclvs = prodsRclvs.filter((prodRclv) => {
			// Restricciones si está recién creado
			if (
				prodRclv.statusRegistro_id == creado_id && // está en status 'creado'
				![revId, usAutom_id].includes(prodRclv.creadoPor_id) && // no fue creado por el usuario ni en forma automática
				prodRclv.statusSugeridoEn > haceUnaHora // fue creado hace menos de una hora
			)
				return false;

			// Sin captura vigente
			const capturaProdRclv = capturas.filter((m) => m.entidad == prodRclv.entidad && m.entidad_id == prodRclv.id);
			if (
				!capturaProdRclv.length || // no está capturado
				capturaProdRclv[0].capturadoEn < haceDosHoras // la captura más reciente fue hace más de dos horas
			)
				return true;

			// Con captura activa
			const activa = capturaProdRclv.find((m) => m.activa);
			if (
				activa && // existe una captura activa
				((activa.capturadoPor_id == revId && activa.capturadoEn > haceUnaHora) || // fue hecha por este usuario, hace menos de una hora
					(activa.capturadoPor_id != revId && activa.capturadoEn < haceUnaHora)) // fue hecha por otro usuario, hace más de una hora
			)
				return true;

			// Sin captura activa
			const esteUsuario = capturaProdRclv.find((m) => m.capturadoPor_id == revId);
			if (
				!activa && // sin captura activa
				(!esteUsuario || // sin captura por este usuario
					esteUsuario.capturadoEn > haceUnaHora) // con captura de este usuario hace menos de una hora
			)
				return true;

			// Fin
			return false;
		});

		// Fin
		return prodsRclvs;
	},
	actualizaStatusErrores: {
		consolidado: async function () {
			// Variables
			const ultsHist = await this.ultsRegsHistStatus();

			// Comparaciones
			let histRegEnt = this.historialVsProdRclv(ultsHist); // Historial vs registro de la entidad
			let regEntHist = this.prodRclvVsHistorial(ultsHist); // Registro de la entidad vs historial

			// Consolida
			statusErrores = await Promise.all([histRegEnt, regEntHist]).then((n) => n.flat());

			// Fin
			return;
		},
		ultsRegsHistStatus: async () => {
			// Variables
			const condicion = {[Op.or]: [{statusOriginal_id: {[Op.gt]: aprobado_id}}, {statusFinal_id: {[Op.gt]: aprobado_id}}]};

			// Obtiene el último registro de status de cada producto
			let ultsHist = [];
			await baseDatos
				.obtieneTodosPorCondicion("statusHistorial", condicion)
				.then((n) => n.sort((a, b) => b.statusFinalEn - a.statusFinalEn))
				.then((n) =>
					n.map((m) => {
						if (!ultsHist.find((o) => o.entidad == m.entidad && o.entidad_id == m.entidad_id)) ultsHist.push(m);
					})
				); // retiene sólo el último de cada producto

			// Fin
			return ultsHist;
		},
		historialVsProdRclv: async (ultsHist) => {
			// Variables
			let regsAgregar = [];
			if (!ultsHist.length) return regsAgregar;

			// Rutina historial vs prodRclv
			for (let ultHist of ultsHist) {
				// Obtiene los datos del historial
				const {entidad, entidad_id, statusFinalEn, statusFinal_id} = ultHist;

				// Obtiene el prodRclv y si no existe, saltea el ciclo porque solito va a desaparecer el historial
				const prodRclv = await baseDatos.obtienePorId(entidad, entidad_id);
				if (!prodRclv) continue;

				// Obtiene los datos a guardar
				const nombre = FN.nombresPosibles(prodRclv);
				const datos = {entidad, entidad_id, nombre, fechaRef: statusFinalEn};

				// Valida el status
				const {statusRegistro_id} = prodRclv;
				if (
					statusFinal_id != statusRegistro_id && // status distinto
					(statusFinal_id != creadoAprob_id || statusRegistro_id != aprobado_id) // descarta que la diferencia se deba a que se completó la revisión de la edición
				)
					regsAgregar.push({...datos, ST: true});
				// Detecta los inactivar y recuperar
				else if (statusFinal_id == inactivar_id) regsAgregar.push({...datos, IN: true});
				else if (statusFinal_id == recuperar_id) regsAgregar.push({...datos, RC: true});
			}

			// Fin
			return regsAgregar;
		},
		prodRclvVsHistorial: async (ultsHist) => {
			// Variables
			const entidades = [...variables.entidades.prodsRclvs];
			let regsAgregar = [];

			// Obtiene los Inactivos y Recuperar
			const prodsRclvs = await FN.obtieneRegs({entidades, status_id: {[Op.gt]: aprobado_id}});

			// Revisa en cada registro
			for (let prodRclv of prodsRclvs) {
				// Variables
				const {entidad, id, coleccion_id} = prodRclv;

				// Averigua si se encuentra en el historial
				let regHist = ultsHist.find((n) => n.entidad == entidad && n.entidad_id == id);

				// Específico para capítulos: averigua si se encuentra su colección
				if (!regHist && entidad == "capitulos" && coleccion_id)
					regHist = ultsHist.find((n) => n.entidad == "colecciones" && n.entidad_id == coleccion_id);

				// Si no lo encuentra en el historial, lo agrega como 'sin historial'
				if (!regHist) {
					const nombre = FN.nombresPosibles(prodRclv);
					const fechaRef = prodRclv.statusSugeridoEn;
					const datos = {entidad, entidad_id: id, nombre, fechaRef};
					regsAgregar.push({...datos, SH: true});
				}
			}

			// Fin
			return regsAgregar;
		},
	},
	eliminaRegsSinEntidadId: async (entEliminar) => {
		// Variables
		const entidades = !entEliminar ? [...variables.entidades.todos, "usuarios"] : [entEliminar];
		if (entEliminar && variables.entidades.prods.includes(entEliminar)) entidades.push("links");
		let idsPorEntidad = {};
		let aux = [];

		// Obtiene los registros por entidad
		for (let entidad of entidades) aux.push(baseDatos.obtieneTodos(entidad).then((n) => n.map((m) => m.id)));
		aux = await Promise.all(aux);
		entidades.forEach((entidad, i) => (idsPorEntidad[entidad] = aux[i])); // obtiene un objeto de ids por entidad

		// Elimina historial
		for (let tabla of eliminarCuandoSinEntidadId) {
			// Obtiene los registros, para analizar si corresponde eliminar alguno
			const regsHistorial = await baseDatos
				.obtieneTodos(tabla)
				.then((n) => (entEliminar ? n.filter((m) => m.entidad == entEliminar) : n));

			// Si no encuentra la combinación "entidad-id", elimina el registro
			for (let regHistorial of regsHistorial)
				if (
					!regHistorial.entidad_id || // no existe la entidad_id
					!idsPorEntidad[regHistorial.entidad].includes(regHistorial.entidad_id) || // no existe la combinacion de entidad + entidad_id
					(!entEliminar && !regHistorial.entidad) || // no existe la entidad
					(!entEliminar && !entidades.includes(regHistorial.entidad)) // entidad desconocida
				)
					baseDatos.eliminaPorId(tabla, regHistorial.id);
		}

		// Fin
		return;
	},
	elimImgsSinRegEnBd_PR: {
		consolidado: async function (familias) {
			// Variables
			const infoPorCarpeta = this.obtieneDatosGrales(familias);

			// Elimina las imágenes de las carpetas "Revisar" y "Final"
			for (let elemento of infoPorCarpeta) {
				// Variables
				const {carpeta, entEdic, status_id} = elemento;

				// Obtiene datos de los avatars en BD
				const {nombresArchsEnBd, avatarsEnBd} = await this.obtieneDatosDeAvatarsEnBd({familias, entEdic, status_id});

				// Elimina los archivos cuyo nombre no está en BD
				comp.elimImgsSinRegEnBd.eliminaLasImagenes({carpeta, nombresArchsEnBd, avatarsEnBd});
			}

			// Fin
			return;
		},
		obtieneDatosGrales: (familias) => {
			// Variables
			const statusDistintoCreado_id = statusRegistros.filter((n) => n.id != creado_id).map((n) => n.id);
			const infoPorCarpeta =
				familias == "productos"
					? [
							{carpeta: carpProds.revisar, familias, entEdic: "prodEdics"}, // Carpetas REVISAR - para los prods, sólo pueden estar en 'Edición'
							{carpeta: carpProds.final, familias, status_id: statusDistintoCreado_id}, // Carpetas FINAL
					  ]
					: [
							{carpeta: carpRclvs.revisar, familias, entEdic: "rclvEdics", status_id: creado_id},
							{carpeta: carpRclvs.final, familias, status_id: statusDistintoCreado_id},
					  ];

			// Fin
			return infoPorCarpeta;
		},
		obtieneDatosDeAvatarsEnBd: async ({familias, entEdic, status_id}) => {
			// Variables
			const petitFams = familias == "productos" ? "prods" : familias;
			let avatarsEnBd = [];

			// Obtiene los avatars que están en las ediciones
			if (entEdic) avatarsEnBd.push(comp.elimImgsSinRegEnBd.obtieneLosAvatarPorEntEnBd({entidad: entEdic}));

			// Obtiene los avatars que están en los originales
			if (status_id)
				for (let entidad of variables.entidades[petitFams])
					avatarsEnBd.push(comp.elimImgsSinRegEnBd.obtieneLosAvatarPorEntEnBd({entidad, status_id}));

			// Consolida los resultados
			avatarsEnBd = await Promise.all(avatarsEnBd).then((n) => n.flat());
			const nombresArchsEnBd = avatarsEnBd.map((n) => n.nombreArchivo);

			// Fin
			return {nombresArchsEnBd, avatarsEnBd};
		},
	},

	// Productos
	eliminaRepetidos: (prods) => {
		// Variables
		let resultado = [];

		// Agrega los nuevos
		for (let prod of prods) if (!resultado.find((n) => n.id == prod.id && n.entidad == prod.entidad)) resultado.push(prod);

		// Fin
		return resultado;
	},
	paises_idToNombre: (paises_id) => {
		// Función para convertir 'string de ID' en 'string de nombres'
		let paisesNombre = [];
		if (paises_id.length) {
			let paises_idArray = paises_id.split(" ");
			// Convertir 'IDs' en 'nombres'
			for (let pais_id of paises_idArray) {
				let paisNombre = paises.find((n) => n.id == pais_id);
				if (paisNombre) paisesNombre.push(paisNombre.nombre);
			}
		}
		// Fin
		return paisesNombre.join(", ");
	},
	linksEnProd: async function ({entidad, id}) {
		// Variables
		const campo_id = this.obtieneDesdeEntidad.campo_id(entidad); // entidad del producto
		const lectura = await baseDatos.obtieneTodosPorCondicion("links", {[campo_id]: id});

		// Obtiene las películas y trailers
		const linksTrailers = lectura.filter((n) => n.tipo_id == linkTrailer_id);
		const linksPelis = lectura.filter((n) => n.tipo_id == linkPelicula_id);
		const linksHD = linksPelis.filter((n) => n.calidad >= 720);

		// Averigua qué links tiene
		const tiposDeLink = {
			// Trailer
			linksTrailer: FN.averiguaTipoDeLink(linksTrailers),

			// Películas
			linksGral: FN.averiguaTipoDeLink(linksPelis),
			linksGratis: FN.averiguaTipoDeLink(linksPelis, "gratuito"),
			linksCast: FN.averiguaTipoDeLink(linksPelis, "castellano"),
			linksSubt: FN.averiguaTipoDeLink(linksPelis, "subtitulos"),

			// Películas HD
			HD_Gral: FN.averiguaTipoDeLink(linksHD),
			HD_Gratis: FN.averiguaTipoDeLink(linksHD, "gratuito"),
			HD_Cast: FN.averiguaTipoDeLink(linksHD, "castellano"),
			HD_Subt: FN.averiguaTipoDeLink(linksHD, "subtitulos"),
		};

		// Links sin Castellano
		const linksSinCast =
			!tiposDeLink.linksCast && !tiposDeLink.linksSubt ? linksPelis.filter((n) => !n.castellano && !n.subitulos) : [];
		const resultado = {
			SI: linksSinCast.filter((n) => aprobados_ids.includes(n.statusRegistro_id)).length, // en status creadoAprob o aprobado
			linksTalVez: linksSinCast.filter((n) => n.statusRegistro_id != inactivo_id).length, // en un status distinto a inactivo
		};
		tiposDeLink.linksSinCast = resultado.SI ? conLinks : resultado.linksTalVez ? linksTalVez : sinLinks;

		// Actualiza el registro
		await baseDatos.actualizaPorId(entidad, id, tiposDeLink); // con 'await', para que dé bien el cálculo para la colección

		// Fin
		return;
	},
	actualizaCalidadDeLinkEnCol: async (colID) => {
		// Obtiene los capítulos de la colección
		const condicion = {coleccion_id: colID, statusRegistro_id: activos_ids};
		const capitulos = await baseDatos.obtieneTodosPorCondicion("capitulos", condicion);
		if (!capitulos.length) return;

		// Actualiza cada campo de la colección
		const tiposDeLink = [
			...["linksTrailer", "linksGral", "linksGratis", "linksCast", "linksSubt"],
			...["HD_Gral", "HD_Gratis", "HD_Cast", "HD_Subt"],
		];
		for (let tipoDeLink of tiposDeLink) {
			// Variables
			const capSinLink = capitulos.find((n) => n[tipoDeLink] == sinLinks); // busca un capítulo que no tenga link
			const capTalVez = capitulos.find((n) => n[tipoDeLink] == linksTalVez);
			const capConLinks = capitulos.find((n) => n[tipoDeLink] == conLinks);

			// Obtiene los resultados
			const tieneLink = capSinLink ? sinLinks : capTalVez ? linksTalVez : capConLinks ? conLinks : null; // opción pesimista
			const cap_id = capSinLink ? capSinLink.id : null; // capítulo sin link

			// Actualiza cada 'tipoDeLink' en la colección
			baseDatos.actualizaPorId("colecciones", colID, {[tipoDeLink]: tieneLink});
			baseDatos.actualizaPorCondicion("capsSinLink", {coleccion_id: colID}, {[tipoDeLink]: cap_id});
		}

		// Fin
		return;
	},
	ordenaCaps: (capitulos) => capitulos.sort((a, b) => a.numCap - b.numCap).sort((a, b) => a.numTemp - b.numTemp),
	azar: () => parseInt(Math.random() * Math.pow(10, 6)), // Le asigna un n° entero al azar, donde 10^6 es el máximo posible
	datosProvs: (datos) => {
		// Datos de proveedores de información
		const datosProvs = [
			{
				href:
					"imdb.com/" +
					(datos.IMDB_id
						? "title/" + datos.IMDB_id + "/technical"
						: datos.nombreOriginal
						? "find?q=" + datos.nombreOriginal
						: ""),
				src: "IMDB",
				title: "Internet Movie Database",
			},
			{
				href:
					"filmaffinity.com/es/" +
					(datos.nombreCastellano || datos.nombreOriginal
						? "search.php?stext=" + datos.nombreCastellano || datos.nombreOriginal
						: ""),
				src: "FA",
				title: "Film Affinity",
			},
			{
				href: "es.wikipedia.org/wiki/" + (datos.nombreCastellano ? datos.nombreCastellano.toLowerCase() : ""),
				src: "Wiki",
				title: "Wikipedia",
			},
			{
				href: "google.com/" + (datos.nombreCastellano ? "search?q=" + datos.nombreCastellano.toLowerCase() : ""),
				src: "Google",
				title: "Google",
			},
		];

		// Fin
		return datosProvs;
	},

	// Rclvs
	canonNombre: (rclv) => {
		// Variables
		let canonNombre = "";

		// Averigua si el rclv tiene algún "proceso de canonización"
		if (rclv.canon_id && rclv.canon_id != "NN") {
			// Obtiene los procesos de canonización
			const proceso = canons.find((m) => m.id == rclv.canon_id);

			// Asigna el nombre del proceso
			canonNombre = proceso[rclv.genero_id] + " ";

			// Verificación si el nombre del proceso es "Santo" (varón)
			if (rclv.canon_id == "ST" && rclv.genero_id == "MS") {
				// Obtiene el primer nombre del rclv
				const primerNombre = rclv.nombre.split(" ")[0];

				// Si el primer nombre no es "especial", cambia el prefijo por "San"
				if (!prefijosSanto.includes(primerNombre)) canonNombre = "San ";
			}
		}

		// Fin
		return canonNombre;
	},
	actualizaProdsEnRclv: async function ({entidad, id}) {
		// Variables
		const prodEnts = variables.entidades.prods;
		const statusAprobado = {statusRegistro_id: aprobado_id};
		const statusValido = {statusRegistro_id: {[Op.ne]: inactivo_id}};
		let prodsAprob;

		// Si el ID es trivial, termina la función
		if (id && [ninguno_id, varios_id, sinApMar_id].includes(id)) return;

		// Establece la condición perenne
		const rclvCampo_id = this.obtieneDesdeEntidad.campo_id(entidad);
		const condicion = {[rclvCampo_id]: id};

		// 1. Averigua si existe algún producto aprobado, con ese rclvCampo_id
		for (let prodEnt of prodEnts) {
			prodsAprob = await baseDatos.obtienePorCondicion(prodEnt, {...condicion, ...statusAprobado});
			if (prodsAprob) {
				prodsAprob = conLinks;
				break;
			}
		}

		// 2. Averigua si existe algún producto en status provisorio, con ese rclvCampo_id
		if (!prodsAprob)
			for (let prodEnt of prodEnts) {
				prodsAprob = await baseDatos.obtienePorCondicion(prodEnt, {...condicion, ...statusValido});
				if (prodsAprob) {
					prodsAprob = linksTalVez;
					break;
				}
			}

		// 3. Averigua si existe alguna edición con ese rclvCampo_id
		if (!prodsAprob && (await baseDatos.obtienePorCondicion("prodEdics", condicion))) prodsAprob = linksTalVez;

		// 4. No encontró ningún caso
		if (!prodsAprob) prodsAprob = sinLinks;

		// Actualiza el campo en el rclv
		baseDatos.actualizaPorId(entidad, id, {prodsAprob});

		// Fin
		return;
	},
	actualizaSolapam: async () => {
		// Variables
		let espera = [];

		// Actualiza tablas
		espera.push(baseDatos.actualizaTodos("epocasDelAno", {solapamiento: false}));
		espera.push(baseDatos.actualizaTodos("fechasDelAno", {epocaDelAno_id: 1}));
		espera = await Promise.all(espera).then(() => []);

		// Obtiene tablas
		let epocasDelAno = baseDatos.obtieneTodosPorCondicion("epocasDelAno", {diasDeDuracion: {[Op.ne]: null}});
		let fechasDelAnoSolap = baseDatos.obtieneTodos("fechasDelAno");
		[epocasDelAno, fechasDelAnoSolap] = await Promise.all([epocasDelAno, fechasDelAnoSolap]);

		// Rutina para cada registro de epocaDelAno
		for (let epocaDelAno of epocasDelAno) {
			// Variables
			const {id: epocaDelAno_id, anoFM} = epocaDelAno;
			let restar = 0;
			let solapamiento;

			// Revisa si en algún día hay solapamiento
			for (let i = 0; i < epocaDelAno.diasDeDuracion; i++) {
				// Si se completó el año, lo resta
				if (!restar && epocaDelAno.fechaDelAno_id + i > 366) restar = 366;

				// Se fija si la 'fechaDelAno' tiene un valor trivial para 'epocaDelAno_id'
				const indice = epocaDelAno.fechaDelAno_id - 1 + i - restar; // se resta '1' porque el id tiene esa diferencia con el índice del array
				const fechaDelAno = fechasDelAnoSolap[indice];
				fechaDelAno.epocaDelAno_id == ninguno_id
					? (fechasDelAnoSolap[indice] = {...fechaDelAno, epocaDelAno_id: epocaDelAno.id}) // en caso positivo le asigna el id de la epocaDelAno
					: (solapamiento = true); // en caso negativo no lo completa, y le asigna 'true' a 'solapamiento de 'epocaDelAno'
			}

			// Si corresponde, actualiza el solapamiento en la tabla - es crítico su 'await'
			if (solapamiento) espera.push(baseDatos.actualizaPorId("epocasDelAno", epocaDelAno.id, {solapamiento: true}));

			// Actualiza la tabla 'fechasDelAno'
			const IDs = fechasDelAnoSolap.filter((n) => n.epocaDelAno_id == epocaDelAno.id).map((n) => n.id); // obtiene los IDs de las fechas de la epocaDelAno
			if (IDs.length) espera.push(baseDatos.actualizaPorId("fechasDelAno", IDs, {epocaDelAno_id, anoFM})); // actualiza los registros de esos IDs
		}
		espera = await Promise.all(espera);

		// Actualiza la variable 'fechasDelAno'
		fechasDelAno = await baseDatos.obtieneTodos("fechasDelAno", "epocaDelAno");

		// Fin
		return;
	},

	// Links
	actualizaProdAprobEnLink: (links) => {
		// Rutina por link
		for (let link of links) {
			// Averigua el status de su producto
			const statusProd = link.pelicula
				? link.pelicula.statusRegistro_id
				: link.coleccion
				? link.coleccion.statusRegistro_id
				: link.capitulo
				? link.capitulo.statusRegistro_id
				: null;
			if (!statusProd) continue;

			// Actualiza el campo prodAprob a 'true' o 'false'
			const prodAprob = activos_ids.includes(statusProd); // antes era 'aprobados_ids'
			baseDatos.actualizaPorId("links", link.id, {prodAprob});
		}

		// Fin
		return;
	},
	actualizaCantLinksPorSem: async () => {
		// Obtiene los links
		const condicion = {
			statusRegistro_id: {[Op.ne]: inactivo_id}, // status distinto a 'inactivo'
			prodAprob: true, //  con producto 'aprobado'
			[Op.or]: [{statusRegistro_id: {[Op.ne]: aprobado_id}}, {prov_id: {[Op.notIn]: provsValidacAutom_ids}}], // descarta los links procesados por proveedores automatizados
		};
		let links = baseDatos.obtieneTodosPorCondicion("links", condicion);
		let edics = baseDatos.obtieneTodos("linkEdics");
		[links, edics] = await Promise.all([links, edics]);

		// Funciones
		FN_links.obtieneCantPorSem(links);
		FN_links.obtienePromedios(links);
		FN_links.obtienePendsSemActual(links, edics);

		// Fin
		return;
	},

	// Otras
	rutasConHistorial: (url) => {
		// Variables
		let resultado;

		// Vigentes - busca la ruta
		if (!resultado) resultado = rutasConHistorial.iguales.find((n) => url == n[0]);
		if (!resultado) resultado = rutasConHistorial.startsWith.find((n) => url.startsWith(n[0]));
		if (!resultado) resultado = rutasConHistorial.includes.find((n) => url.includes(n[0]));

		// Discontinuados - busca la ruta
		if (!resultado) resultado = rutasConHistorial.disconts.find((n) => url.startsWith(n[0]));

		// Fin
		if (resultado) resultado = resultado[1];
		return resultado;
	},
	partesDelUrl: function (req) {
		// Obtiene la base
		let url = req.baseUrl + req.path;
		const baseUrl = url.slice(0, url.indexOf("/", 1));

		// Obtiene la tarea
		url = url.replace(baseUrl, "");
		const indice = url.indexOf("/", 1);
		const tarea = indice > -1 ? url.slice(0, indice) : url;

		// Obtiene la entidad
		let {entidad} = req.params;
		if (!entidad) entidad = baseUrl.slice(1);

		// Obtiene la siglaFam
		let {siglaFam} = req.params;
		if (!siglaFam) {
			url = url.replace(tarea, ""); // si contiene la tarea, la quita
			if (url) {
				siglaFam = url.slice(1); // le quita el "/" del comienzo
				siglaFam = siglaFam[1] == "/" ? siglaFam[0] : null;
			}
		}
		if (siglaFam && !["p", "r", "l"].includes(siglaFam)) siglaFam = null;
		if (!siglaFam) siglaFam = FN.siglaFam(entidad);

		// Fin
		return {baseUrl, tarea, siglaFam, entidad, url};
	},
	guardaRegistroNavegac: async function ({cliente_id, ruta, comentario, reqHeaders}) {
		// Si es el usuario de Diego, interrumpe la función
		if (!cliente_id || (cliente_id && cliente_id == "U0000000011")) return;

		// Limpia la ruta
		if (ruta.endsWith("/") && ruta != "/") ruta = ruta.slice(0, -1);

		// Actualiza el comentario
		const nombre = comentario || (await this.prodRclvNombre(ruta));
		if (nombre) comentario = nombre.slice(0, 20);

		// Averigua el dispositivo del cliente
		let dispCliente = reqHeaders;
		for (let metodo in requestsClientes) if (requestsClientes[metodo] == dispCliente) dispCliente = metodo; // convierte la descripción larga en un código

		// Guarda el registro
		await baseDatos.agregaRegistro("navegsDia", {cliente_id, ruta, comentario, dispCliente});

		// Fin
		return;
	},
	prodRclvNombre: async function (ruta) {
		// Si no tiene id, interrumpe la función
		const tieneId = ruta.split("/?id=").length > 1;
		if (!tieneId) return;

		// Averigua la entidad y el id
		let entidad = variables.entidades.todos.find((n) => ruta.includes("/" + n + "/"));
		let id = ruta.split("/?id=")[1].split("&")[0];
		if (!entidad || !id) return;

		// Si es un link, averigua el producto
		if (ruta.startsWith("/links/mirar/l")) {
			const link = await baseDatos.obtienePorId("links", id);
			entidad = this.obtieneDesdeCampo_id.prodEnt(link);
			const campo_id = this.obtieneDesdeCampo_id.campo_id(link);
			id = link[campo_id];
		}

		// Obtiene el nombre
		const nombre = await baseDatos.obtienePorId(entidad, id).then((n) => n.nombreCastellano || n.nombreOriginal || n.nombre);

		// Fin
		return nombre;
	},
};

// Funciones
const FN = {
	obtieneRegs: async function (campos) {
		// Variables
		const {entidades} = campos;
		let resultados = [];

		// Obtiene los resultados
		for (let entidad of entidades) resultados.push(this.lecturaBD({entidad, ...campos}));

		// Consolida y completa la información
		resultados = await Promise.all(resultados)
			.then((n) => n.flat())
			.then((n) => n.sort((a, b) => b.statusSugeridoEn - a.statusSugeridoEn));

		// Fin
		return resultados;
	},
	lecturaBD: async (campos) => {
		// Variables
		const {entidad, status_id, include} = campos;

		// Condiciones
		let condicion = {statusRegistro_id: status_id}; // Con status según parámetro
		if (variables.entidades.rclvs.includes(entidad)) condicion.id = {[Op.gt]: varios_id}; // que no sea ninguno ni varios

		// Resultado
		const resultados = await baseDatos
			.obtieneTodosPorCondicion(entidad, condicion, include)
			.then((n) => n.map((m) => ({...m, entidad})));

		// Fin
		return resultados;
	},
	averiguaTipoDeLink: (links, condicion) => {
		// Filtro inicial
		if (condicion) links = links.filter((n) => n[condicion]);

		// Resultados
		const resultado = {
			SI: links.filter((n) => aprobados_ids.includes(n.statusRegistro_id)).length, // en status creadoAprob o aprobado
			linksTalVez: links.filter((n) => n.statusRegistro_id != inactivo_id).length, // en un status distinto a inactivo
		};

		// Respuesta
		const respuesta = resultado.SI ? conLinks : resultado.linksTalVez ? linksTalVez : sinLinks;

		// Fin
		return respuesta;
	},
	nombresPosibles: (registro) => {
		return registro.nombreCastellano
			? registro.nombreCastellano
			: registro.nombreOriginal
			? registro.nombreOriginal
			: registro.nombre
			? registro.nombre
			: null;
	},

	// Entidades
	entidadNombre: (entidad) => {
		const indice = [...variables.entidades.todos].indexOf(entidad);
		const entNombre = indice > -1 ? [...variables.entidades.todosNombre][indice] : null;
		return entNombre;
	},
	obtieneProdAsoc: (registro) => {
		const {prodAsocs, prodCampos_id} = variables.entidades;
		for (let i = 0; i < prodCampos_id.length; i++) if (registro[prodCampos_id[i]]) return prodAsocs[i];
		return null;
	},
	obtieneRclvAsoc: (registro) => {
		const {rclvAsocs, rclvCampos_id} = variables.entidades;
		for (let i = 0; i < rclvCampos_id.length; i++) if (registro[rclvCampos_id[i]]) return rclvAsocs[i];
		return null;
	},
	siglaFam: (entidad) =>
		[...variables.entidades.prods, "prodEdics"].includes(entidad)
			? "p"
			: [...variables.entidades.rclvs, "rclvEdics"].includes(entidad)
			? "r"
			: entidad == "links"
			? "l"
			: entidad == "usuarios"
			? "u"
			: "",
};
const FN_links = {
	obtieneCantPorSem: function (links) {
		// Elimina los datos anteriores
		cantLinksVencPorSem = {};

		// Se asegura tener un valor por semana y entidad
		for (let i = 0; i <= linksSems; i++) cantLinksVencPorSem[i] = {capitulos: 0, pelisColes: 0};

		// Obtiene el valor por semana
		const linksAprob = links.filter((n) => n.statusRegistro_id == aprobado_id);
		for (let link of linksAprob) {
			// Si el link no tiene fecha de vencimiento, saltea el registro
			if (!link.fechaVencim) continue;

			// Obtiene la semana de vencimiento
			const fechaVencim = new Date(link.fechaVencim).getTime();
			const semVencim = parseInt((fechaVencim - lunesDeEstaSemana) / unaSemana); // es la semana relativa a la semana actual

			// Si la semana de vencimiento es errónea, actualiza el registro y saltea el resto de la rutina
			if (semVencim < 1 || semVencim > linksSems) {
				baseDatos.actualizaPorId("links", link.id, {statusRegistro_id: creadoAprob_id}); // le cambia el status a los links con semana errónea
				continue;
			}

			// Agrega al conteo
			const entidad = link.capitulo_id ? "capitulos" : "pelisColes";
			cantLinksVencPorSem[semVencim][entidad]++;
		}

		// Fin
		return;
	},
	obtienePromedios: (links) => {
		// Promedio semanal para links de plazo estándar
		const capitulos = Math.ceil(links.filter((n) => n.capitulo_id).length / linksSems);
		const pelisColes = Math.ceil(links.filter((n) => !n.capitulo_id).length / linksSems);

		// Actualiza la variable 'cantLinksVencPorSem'
		cantLinksVencPorSem.promSem = {capitulos, pelisColes, prods: capitulos + pelisColes};

		// Fin
		return;
	},
	obtienePendsSemActual: (links, edics) => {
		// Links a revisar
		const linksRevisar = links.filter((n) => n.statusRegistro_id != aprobado_id);

		// Links con límite
		const capitulos = linksRevisar.filter((n) => n.capitulo_id).length;
		const pelisColes = linksRevisar.filter((n) => !n.capitulo_id).length;
		const ediciones = edics.length;
		const prods = capitulos + pelisColes + ediciones;

		// Asigna las cantidades a la semana actual
		cantLinksVencPorSem["0"] = {capitulos, pelisColes, ediciones, prods};

		// Fin
		return;
	},
};
