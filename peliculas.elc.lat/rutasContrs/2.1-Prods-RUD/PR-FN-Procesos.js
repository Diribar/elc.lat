"use strict";
const procsFM = require("../2.0-Familias/FM-FN-Procesos");
const validaFM = require("../2.0-Familias/FM-FN-Validar");

module.exports = {
	obtieneColCaps: {
		consolidado: async function (registro, entidad, usuario_id) {
			// Si no es una colección o capítulo, interrumpe la función
			if (!["colecciones", "capitulos"].includes(entidad)) return registro;

			// Variables
			const {statusRegistro_id} = registro;
			const coleccion_id = registro.coleccion_id || registro.id;
			registro.colCap = true;

			// Variables de BD
			const capitulos = await baseDatos
				.obtieneTodosPorCondicion("capitulos", {coleccion_id, statusRegistro_id})
				.then((n) => comp.ordenaCaps(n));
			const numsTemp = [...new Set(capitulos.map((n) => n.numTemp))];

			// Datos compartidos
			registro.cantTemps = numsTemp.length;

			// Colecciones
			if (entidad == "colecciones") return {...registro, cantCaps: capitulos.length, primCap_id: capitulos[0].id};

			// Capítulos
			const coleccion = await this.capCol(coleccion_id, usuario_id);
			const capComplem = await this.capComplem(capitulos, registro, numsTemp); // tiene en cuenta el statusRegistro de la colección
			return {...registro, numsTemp, ...capComplem, coleccion};
		},
		capCol: async (coleccion_id, usuario_id) => {
			// Obtiene la colección
			const coleccion = await baseDatos.obtienePorId("colecciones", coleccion_id);

			// Si el nombre fue editado, se lo cambia
			if (usuario_id) {
				// Variables
				const condColec = {coleccion_id, editadoPor_id: usuario_id};
				const edicColec = await baseDatos.obtienePorCondicion("prodEdics", condColec);

				// Si el 'nombreCastellano' de la colección está editado, lo actualiza en la variable 'original'
				if (edicColec && edicColec.nombreCastellano) coleccion.nombreCastellano = edicColec.nombreCastellano;
			}

			// Fin
			return coleccion;
		},
		capComplem: async (capitulos, capitulo, numsTemp) => {
			// Obtiene los capítulos de la temporada actual
			const capsTempAct = capitulos.filter((n) => n.numTemp == capitulo.numTemp);

			// Obtiene los id del primer capítulo de cada temporada
			const idsPrimerCapTemp = [];
			for (const numTemp of numsTemp) idsPrimerCapTemp.push(capitulos.find((n) => n.numTemp == numTemp).id);

			// Obtiene los capítulos anterior y posterior
			const indice = capitulos.findIndex((n) => n.id == capitulo.id);
			const capAnt = indice > 0 && capitulos[indice - 1];
			const capPost = indice < capitulos.length - 1 && capitulos[indice + 1];

			// Obtiene los ID
			const capAnt_id = capAnt && capAnt.id;
			const capPost_id = capPost && capPost.id;

			// Fin
			return {capsTempAct, idsPrimerCapTemp, capAnt_id, capPost_id};
		},
	},
	bloqueIzq: (producto) => {
		// Variables
		const paisesNombre = producto.paises_id ? comp.paises_idToNombre(producto.paises_id) : null;
		let infoGral = [];
		let actores = [];

		// Informacion sin títulos
		if (producto.bhr !== null)
			infoGral.push({valor: producto.bhr ? "Basada en Hechos Reales" : "No está basada en Hechos Reales"});
		if (producto.tipoActuacion) infoGral.push({valor: producto.tipoActuacion.nombre});
		if (producto.epocaOcurrencia_id)
			infoGral.push(
				producto.epocaOcurrencia.nombre == "Varias"
					? {titulo: "Época respecto a Cristo", valor: producto.epocaOcurrencia.nombre}
					: {valor: producto.epocaOcurrencia.nombre + " a Cristo"}
			);

		// Información con títulos
		if (producto.religion_id !== null) {
			const valor = religiones.find((n) => n.id == producto.religion_id)?.nombre;
			infoGral.push({titulo:"Religión", valor});
		}
		if (producto.publico) infoGral.push({titulo: "Público sugerido", valor: producto.publico.nombre});
		if (producto.duracion) infoGral.push({titulo: "Duracion", valor: producto.duracion + " min."});
		if (producto.anoEstreno) infoGral.push({titulo: "Año de estreno", valor: producto.anoEstreno});
		if (producto.anoFin) {
			if (producto.anoFin) infoGral.push({titulo: "Año de fin", valor: producto.anoFin});
		}
		if (producto.color !== null && !producto.color) infoGral.push({valor: "Es en blanco y negro"});
		if (producto.musical) infoGral.push({valor: "Es un musical"});
		if (producto.deporte) infoGral.push({valor: "Tiene deporte"});

		infoGral.push({
			titulo: "País" + (paisesNombre && paisesNombre.includes(",") ? "es" : ""),
			valor: paisesNombre ? paisesNombre : "desconocido",
		});
		if (producto.idioma_original) infoGral.push({titulo: "Idioma original", valor: producto.idioma_original.nombre});
		if (producto.direccion) infoGral.push({titulo: "Dirección", valor: producto.direccion});
		if (producto.guion) infoGral.push({titulo: "Guión", valor: producto.guion});
		if (producto.musica) infoGral.push({titulo: "Música", valor: producto.musica});
		if (producto.produccion) infoGral.push({titulo: "Producción", valor: producto.produccion});

		// Actores
		if (producto.actores) actores = producto.actores;

		// Fin
		return {infoGral, actores};
	},
	obtieneLinksDelProducto: async ({entidad, id, statusLink_id, usuario_id, autTablEnts, origen}) => {
		// Variables
		const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
		const include = ["tipo", "prov"];

		// Declara las variables de links de tipo 'Película' y 'Trailer'
		let PL = [];
		let TR = [];

		// Obtiene los links
		const condicion = statusLink_id
			? {statusRegistro_id: statusLink_id}
			: {
					[Op.or]: [
						{statusRegistro_id: aprobados_ids},
						autTablEnts
							? {statusRegistro_id: creado_id}
							: usuario_id
							? {[Op.and]: [{statusRegistro_id: creado_id}, {creadoPor_id: usuario_id}]}
							: null,
					],
			  };
		const links = await baseDatos.obtieneTodosPorCondicion("links", {[campo_id]: id, ...condicion}, include);

		// Procesos si hay links
		if (links.length) {
			// Los ordena
			links.sort((a, b) => b.calidad - a.calidad); // por calidad
			links.sort((a, b) => a.parte - b.parte); // por partes
			links.sort((a, b) => b.completo - a.completo); // por completo
			links.sort((a, b) => b.castellano - a.castellano); // por idioma

			// Les asigna un color en función del idioma
			for (let link of links) link.idioma = link.castellano ? "enCast" : link.subtitulos ? "subtCast" : "otroIdioma";

			// Asigna los url de visualización
			for (let link of links)
				link.href =
					link.prov.embededAgregar && link.gratuito
						? urlHost + "/links/mirar/l/?id=" + link.id + (origen ? "&origen=" + origen : "")
						: "//" + link.url;

			// Los separa entre Películas y Trailers
			PL = links.filter((n) => n.tipo && n.tipo.pelicula);
			TR = links.filter((n) => n.tipo && n.tipo.trailer);
		}

		TR = FN.trailer(TR);
		const GR = FN.gratis(PL);
		const CC = FN.conCosto(PL);
		const existen = !!(TR.length + GR.length + CC.length);

		// Fin
		return {GR, CC, TR, existen};
	},
	actualizaCalifProd: async ({entidad, entidad_id}) => {
		// Variables
		const datos = {feValores: null, entretiene: null, calidadTecnica: null, calificacion: null};

		// Obtiene las calificaciones
		const condicion = {entidad, entidad_id};
		const include = ["feValores", "entretiene", "calidadTecnica"];
		const califics = await baseDatos.obtieneTodosPorCondicion("calRegistros", condicion, include);

		// Si existen calificaciones, obtiene los promedios
		if (califics.length)
			for (let prop in datos)
				datos[prop] =
					prop != "calificacion"
						? Math.round(califics.map((n) => n[prop].valor).reduce((acum, i) => acum + i) / califics.length)
						: Math.round(califics.map((n) => n.resultado).reduce((acum, i) => acum + i) / califics.length);

		// Actualiza la calificación en el producto
		await baseDatos.actualizaPorId(entidad, entidad_id, datos);

		// Fin
		return;
	},
	obtieneInteresDelUsuario: async ({usuario_id, entidad, entidad_id}) => {
		// Variables
		const condicion = {usuario_id, entidad, entidad_id};
		const include = "detalle";

		// Obtiene el interés del usuario
		const registro = await baseDatos.obtienePorCondicion("pppRegistros", condicion, include);
		const interesDelUsuario = registro ? registro.detalle : pppOpcsObj.sinPref;

		// Fin
		return interesDelUsuario;
	},
	transfDatosDeColParaCaps: async (original, edicion, campo) => {
		// Variables
		const novedad = {[campo]: edicion[campo]};
		const {camposTransfCaps} = variables;

		// Si el campo no recibe datos, termina
		const camposAceptados = Object.values(camposTransfCaps).flat();
		if (!camposAceptados.includes(campo)) return;

		// Campos que se reemplazan siempre
		const esActoresSiempre = campo == "actores" && [dibujosAnimados, documental].includes(edicion.actores);
		if (camposTransfCaps.siempre.includes(campo) || esActoresSiempre) {
			const condicion = {coleccion_id: original.id};
			await baseDatos.actualizaPorCondicion("capitulos", condicion, novedad);
			return;
		}

		// Campos 'depende'
		const esActoresDepende = campo == "actores" && ![dibujosAnimados, documental].includes(edicion.actores);
		if (camposTransfCaps.depende.includes(campo) || esActoresDepende) {
			// Casos particulares
			const esPersonajeVarios = campo == "personaje_id" && edicion[campo] == varios_id;
			const esEpocaOcurrVarios = campo == "epocaOcurrencia_id" && edicion[campo] == epocaVarias.id;
			if (esPersonajeVarios || esEpocaOcurrVarios) return;

			// Condición - se asegura que reemplacen:
			const condicion = {coleccion_id: original.id, [campo]: {[Op.or]: [null]}}; // los que tengan valor 'null'
			if (original[campo]) condicion[campo][Op.or].push(original[campo]); // los que coincidan con el registro original de la colección - el 'if' es para no repetir los null
			if (variables.entidades.rclvCampos_id.includes(campo) && original[campo] != ninguno_id)
				condicion[campo][Op.or].push(ninguno_id); // los 'rclv_id' triviales - el 'if' es para no repetir los del original

			// Reemplaza los valores
			await baseDatos.actualizaPorCondicion("capitulos", condicion, novedad);
		}

		// Fin
		return;
	},
	accionesPorCambioDeStatus: async function ({entidad, registro}) {
		// Variables
		const familias = comp.obtieneDesdeEntidad.familias(entidad);

		// Primera respuesta
		const statusAprob = familias != "productos" || registro.statusRegistro_id != creadoAprob_id;
		if (statusAprob) return true;

		// Si hay errores, devuelve falso e interrumpe la función
		const errores = await validaFM.consolidado({datos: {...registro, entidad}});
		if (errores.impideAprobado) return false;

		// Si es un capítulo y su colección no ha sido aprobada, interrumpe la función
		if (entidad == "capitulos" && registro.statusColeccion_id != aprobado_id) return true; // debe ser 'true' para que no redirija a su edición

		// 1. Cambia el status del registro
		const ahora = comp.fechaHora.ahora();
		let datos = {statusRegistro_id: aprobado_id};
		if (!registro.altaTermEn)
			datos = {
				...datos,
				altaTermEn: ahora,
				leadTimeCreacion: comp.obtieneLeadTime(registro.creadoEn, ahora),
				statusSugeridoPor_id: usAutom_id,
				statusSugeridoEn: ahora,
			};
		await baseDatos.actualizaPorId(entidad, registro.id, datos);

		// 2. Actualiza el campo 'prodAprob' en los links
		const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
		const condicion = {[campo_id]: registro.id};
		baseDatos.actualizaPorCondicion("links", condicion, {prodAprob: true});

		// 3. Si es una colección, revisa si corresponde aprobar capítulos
		if (entidad == "colecciones") await this.cambioDeStatusCaps(registro.id);

		// 4. Actualiza 'prodsEnRclv' en sus rclvs
		procsFM.accsEnDepsPorCambioDeStatus(entidad, {...registro, ...datos});

		// Fin
		return true;
	},
	cambioDeStatusCaps: async function (colID) {
		// Variables
		const ahora = comp.fechaHora.ahora();
		let espera = [];
		let datos;

		// Prepara los datos
		const datosFijos = {statusColeccion_id: aprobado_id, statusRegistro_id: aprobado_id};
		const datosSugeridos = {statusSugeridoPor_id: usAutom_id, statusSugeridoEn: ahora};

		// Obtiene los capitulos id
		const capitulos = await baseDatos.obtieneTodosPorCondicion("capitulos", {coleccion_id: colID});

		// Actualiza el status de los capítulos
		for (let capitulo of capitulos) {
			// Variables
			const datosTerm = !capitulo.altaTermEn
				? {altaTermEn: ahora, leadTimeCreacion: comp.obtieneLeadTime(capitulo.creadoEn, ahora)}
				: {};

			// Revisa si cada capítulo supera el test de errores
			datos = {entidad: "capitulos", ...capitulo};
			const errores = await validaFM.consolidado({datos});

			// Actualiza los datos
			datos = errores.impideAprobado
				? {...datosFijos, statusRegistro_id: creadoAprob_id}
				: {...datosFijos, ...datosSugeridos, ...datosTerm};
			espera.push(baseDatos.actualizaPorId("capitulos", capitulo.id, datos));
		}

		// Espera hasta que se revisen todos los capítulos
		await Promise.all(espera);

		// Fin
		return;
	},
};

// Funciones
const FN = {
	trailer: (links) => {
		// Array vacía
		if (!links.length) return [];

		// Array con valores
		let trailers = [];
		links.forEach((link, i) =>
			trailers.push({
				url: link.href,
				leyenda: "Trailer " + (i + 1),
				titulo: "Ver trailer",
				idioma: link.idioma,
			})
		);

		// Fin
		return trailers;
	},
	gratis: function (links) {
		// Array vacía
		if (!links.length) return [];
		let gratuitos = links.filter((n) => n.gratuito);
		if (!gratuitos.length) return [];

		// Variables
		let hayPartes, difsEnIdioma;

		// Selecciona los de mejor calidad
		gratuitos = this.dejaLaMejorCalidad(gratuitos);

		// Averigua si algunos son completos y otros son partes
		const partes = gratuitos.filter((n) => n.parte && n.parte != "-");
		if (partes.length) hayPartes = true;

		// Si no hay hayPartes, averigua si hay diferencias en el idioma
		if (!hayPartes) {
			const castellano = gratuitos.filter((n) => n.castellano);
			const subTits = gratuitos.filter((n) => n.subtitulos);
			const otroIdioma = gratuitos.filter((n) => !n.castellano && !n.subtitulos);
			if ((castellano.length && (subTits.length || otroIdioma.length)) || (subTits.length && otroIdioma.length))
				difsEnIdioma = true;
		}

		// Leyenda para diferenciarlos en la vista
		for (let link of gratuitos)
			link.leyenda = hayPartes
				? link.completo
					? "Completo"
					: "Parte " + link.parte
				: difsEnIdioma
				? link.castellano
					? "En castellano"
					: link.subtitulos
					? "Con subtit."
					: "En otro idioma"
				: "Ver gratis";

		// Deja la info indispensable
		gratuitos = gratuitos.map((link) => ({
			url: link.href,
			leyenda: link.leyenda,
			titulo: "Ver gratis",
			idioma: link.idioma,
		}));

		// Fin
		return gratuitos;
	},
	dejaLaMejorCalidad: (links) => {
		// Si no hay que desempatar, interrumpe la función
		if (links.length < 2) return links;

		// Rutina para dejar los links de mejor calidad
		for (let i = links.length - 1; i >= 0; i--) {
			// Variables
			const link = links[i];
			const {castellano, subtitulos, completo, parte} = link;

			// Obtiene los similares
			const linksSimilares = links.filter(
				(n) => n.castellano == castellano && n.subtitulos == subtitulos && n.completo == completo && n.parte == parte
			);

			// Quita los similares
			if (linksSimilares.length > 1) {
				const maxCalidad = Math.max(...linksSimilares.map((n) => n.calidad));
				const id = linksSimilares.find((n) => n.calidad == maxCalidad).id;
				for (let linkSimilar of linksSimilares)
					if (linkSimilar.id != id) {
						links = links.filter((n) => n.id != linkSimilar.id);
						i--;
					}
			}
		}

		// Fin
		return links;
	},
	conCosto: (links) => {
		// Array vacía
		if (!links.length) return [];
		let conCosto = links.filter((n) => !n.gratuito);
		if (!conCosto.length) return [];

		// Leyenda para diferenciarlos en la vista
		for (let link of conCosto) link.leyenda = link.prov.nombre;

		// Deja la info indispensable
		conCosto = conCosto.map((link) => ({url: link.href, leyenda: link.leyenda, titulo: "Ver c/costo", idioma: link.idioma}));

		// Fin
		return conCosto;
	},
};
