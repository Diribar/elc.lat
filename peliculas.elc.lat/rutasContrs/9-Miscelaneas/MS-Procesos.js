"use strict";

module.exports = {
	mantenim: {
		obtieneProds: async (usuario_id) => {
			// Variables
			const entidades = variables.entidades.prods;
			const camposFijos = {entidades, usuario_id};
			let campos;

			// Productos Inactivos
			campos = {...camposFijos, status_id: inactivo_id};
			let inactivos = FN_tablManten.obtieneRegs(campos);

			// Productos Aprobados
			campos = {...camposFijos, status_id: aprobado_id};
			delete campos.entidades.capitulos;
			let pelisColes = FN_tablManten.obtieneRegs(campos);

			// Productos Sin Edición (en status creadoAprob)
			let SE_pel = FN_tablManten.obtieneSinEdicion("peliculas");
			let SE_col = FN_tablManten.obtieneSinEdicion("colecciones");
			let SE_cap = FN_tablManten.obtieneSinEdicion("capitulos");

			// Calificaciones de productos y Preferencia por productos
			let califics = baseDatos.obtieneTodosPorCondicion("calRegistros", {usuario_id});
			const ppp_id = pppOpcsObj.yaLaVi.id;
			let prodsVistos = baseDatos.obtieneTodosPorCondicion("pppRegistros", {usuario_id, ppp_id});

			// Espera las lecturas
			[inactivos, pelisColes, SE_pel, SE_col, SE_cap, califics, prodsVistos] = await Promise.all([
				inactivos,
				pelisColes,
				SE_pel,
				SE_col,
				SE_cap,
				califics,
				prodsVistos,
			]);

			// Productos sin calificar
			const prodsSinCalif = prodsVistos.filter(
				(n) => !califics.some((m) => m.entidad == n.entidad && m.entidad_id == n.entidad_id)
			);

			// Resultados
			const resultados = {
				// Productos
				SE: [...SE_pel, ...SE_col, ...SE_cap], // sin edición
				IN: inactivos.filter((n) => !n.statusColeccion_id || n.statusColeccion_id == aprobado_id), // películas y colecciones inactivas, y capítulos con su colección aprobada
				SC: pelisColes.filter((n) => prodsSinCalif.find((m) => m.entidad == n.entidad && m.entidad_id == n.id)), // pelis - Sin calificar
				ST: pelisColes.filter((n) => n.tema_id == ninguno_id), // pelisColes - Sin tema

				// Prods - sin links
				SL_pelis: pelisColes.filter((n) => !n.linksGral && n.entidad == "peliculas"), // películas
				SL_coles: pelisColes.filter((n) => !n.linksGral && n.entidad == "colecciones"), // colecciones

				// Tiene links, pero no variantes básicas
				SLG_basico: pelisColes.filter((n) => n.linksGral && !n.linksGratis), // sin links gratuitos
				SLC_basico: pelisColes.filter((n) => n.linksGral && !n.linksCast && !n.linksSubt), // sin links en castellano

				// Links HD
				SL_HD_pelis: pelisColes.filter((n) => n.linksGral && !n.HD_Gral && n.entidad == "peliculas"), // con Links pero sin HD
				SL_HD_coles: pelisColes.filter((n) => n.linksGral && !n.HD_Gral && n.entidad == "colecciones"), // con Links pero sin HD
				SLG_HD: pelisColes.filter((n) => n.HD_Gral && n.linksGratis && !n.HD_Gratis), // sin HD gratuitos
				SLC_HD: pelisColes.filter((n) => n.HD_Gral && (n.linksCast || n.linksSubt) && !n.HD_Cast && !n.HD_Subt), // sin HD en castellano
			};

			// Fin
			return resultados;
		},
		obtieneRclvs: async (usuario_id) => {
			// Variables
			const rclvEnts = variables.entidades.rclvs;
			const prodEnts = [...variables.entidades.prods, "prodEdics"];
			const camposFijos = {entidades: rclvEnts, usuario_id};
			let campos;

			// Inactivos
			campos = {...camposFijos, status_id: inactivo_id};
			let IN = FN_tablManten.obtieneRegs(campos);

			// Aprobados
			campos = {...camposFijos, status_id: aprobado_id};
			let rclvsAprob = FN_tablManten.obtieneRegs(campos);

			// Await
			[IN, rclvsAprob] = await Promise.all([IN, rclvsAprob]);

			// Sin Avatar
			const SA = rclvsAprob.filter((m) => !m.avatar && m.id > varios_id);

			// Con solapamiento de fechas
			const SF = rclvsAprob.filter((m) => m.solapam_fechas);

			// Sin producto
			let regsProd = [];
			for (let prodEnt of prodEnts) regsProd.push(baseDatos.obtieneTodos(prodEnt));
			regsProd = await Promise.all(regsProd).then((n) => n.flat());
			const SP = rclvsAprob.filter((rclv) => {
				const campo_id = comp.obtieneDesdeEntidad.campo_id(rclv.entidad);
				return regsProd.every((regProd) => regProd[campo_id] != rclv.id);
			});

			// Fin
			return {IN, SA, SF, SP};
		},
		obtieneLinksInactivos: async (usuario_id) => {
			// Variables
			let include = variables.entidades.prodAsocs;
			let condicion = {statusRegistro_id: inactivo_id};

			// Obtiene los links 'a revisar'
			let linksInactivos = await baseDatos.obtieneTodosPorCondicion("links", condicion, include);

			// Obtiene los productos
			let productos = linksInactivos.length
				? await FN_tablManten.obtieneProdsDeLinks(linksInactivos, usuario_id)
				: {LI: []};

			// Fin
			return productos;
		},
	},
	navegsDia: {
		obtieneRangoFechas: (navegsDia) => {
			// Variables
			const primFecha = comp.fechaHora.anoMesDia(navegsDia[0].fecha);
			const ultFecha = comp.fechaHora.anoMesDia(navegsDia.at(-1).fecha);
			let fechas = [primFecha];
			let fecha = primFecha;

			// Genera las fechas
			while (fecha > ultFecha) {
				fecha = new Date(fecha).getTime() - unDia;
				fecha = comp.fechaHora.anoMesDia(fecha);
				fechas.push(fecha);
			}

			// Fin
			return fechas;
		},
		filtraPorFecha: (navegsDia, fecha, fechas) => {
			// Obtiene la fecha
			if (fecha) {
				fecha = new Date(fecha);
				if (isNaN(fecha)) fecha = null;
				if (fecha && (fecha > new Date(fechas[0]) || fecha < new Date(fechas.at(-1)))) fecha = new Date(fechas[0]);
			}

			// Genera una fecha
			if (!fecha) fecha = new Date(navegsDia[0].fecha);

			// Genera las fechas máxima y mínima
			const fechaMin = new Date(fecha.setUTCHours(0, 0, 0));
			const fechaMax = new Date(fechaMin.getTime() + unDia);

			// Filtra por esas fechas
			navegsDia = navegsDia.filter((n) => n.fecha >= fechaMin && n.fecha < fechaMax);

			// Convierte la fecha a texto
			fecha = comp.fechaHora.anoMesDia(fecha);

			// Fin
			return [navegsDia, fecha];
		},
		ordenaPorCliente: (navegsDia) => {
			// Las reordena
			let respuesta = [];
			while (navegsDia.length) {
				const {cliente_id} = navegsDia[0];
				const registros = navegsDia.filter((n) => n.cliente_id == cliente_id);
				respuesta.push(...registros);
				navegsDia = navegsDia.filter((n) => n.cliente_id != cliente_id);
			}

			// Fin
			return respuesta;
		},
		eliminaDuplicados: (navegsDia) => {
			// Elimina duplicados
			for (let i = navegsDia.length - 1; i > 0; i--) {
				const actual = navegsDia[i];
				const anterior = navegsDia[i - 1];
				if (
					actual.cliente_id == anterior.cliente_id &&
					actual.ruta == anterior.ruta &&
					actual.comentario == anterior.comentario
				)
					navegsDia.splice(i, 1);
			}

			// Fin
			return navegsDia;
		},
		modificaDatos: function (navegsDia) {
			// Modifica los datos
			navegsDia.forEach((navegDia, i) => {
				// Variables
				const {cliente_id, comentario, ruta} = navegDia;
				const persona = Number(navegDia.cliente_id.slice(1));
				const esUser = navegDia.cliente_id.startsWith("U");
				const anoMesDia = comp.fechaHora.anoMesDia(navegDia.fecha);
				const hora = comp.fechaHora.horarioUTC(navegDia.fecha).split("hs")[0];
				const {iconosArray, distintivo} = this.iconosArray(navegDia.ruta);
				const iconosHTML = iconosArray ? iconosArray.join(" ") : null;

				// Fin
				navegsDia[i] = {
					...{cliente_id, persona, esUser, anoMesDia, hora},
					...{ruta, iconosHTML, iconosArray, distintivo, comentario},
				};
			});

			// Fin
			return navegsDia;
		},
		iconosArray: (url) => {
			// Averigua si es una ruta que puede tener una abreviatura
			const distintivo = comp.rutasConHistorial(url);
			if (!distintivo) return {};

			// Averigua si tiene íconos
			const posibilidades = Object.values(rutasConHistorial).flat();
			const ruta = posibilidades.find((n) => distintivo == n[1]);
			const iconosDistintivo = ruta.slice(2); // quita la info que no sea de íconos
			if (!iconosDistintivo.length) return {distintivo};

			// Genera el HTML de íconos
			let iconosArray = [];
			let familia;
			for (let icono of iconosDistintivo) {
				// Genera el ícono
				familia = familiasRutasTitulo[icono] || familia;
				const titulo = familiasRutasTitulo[icono] || distintivo;
				let iconoHTML = "<i class='fa-solid " + icono;
				if (familia) iconoHTML += " " + familia;
				iconoHTML += "' title='" + titulo + "'></i>";

				// Agrega el ícono
				iconosArray.push(iconoHTML);
			}

			// Fin
			return {iconosArray};
		},
		resumen: (navegsDia) => {
			// Obtiene las personas
			const clientes_id = [...new Set(navegsDia.map((n) => n.cliente_id))];

			// Agrega un registro resumen
			for (let cliente_id of clientes_id) {
				// Obtiene datos para la cabecera
				const regsCliente = navegsDia.filter((n) => n.cliente_id == cliente_id);
				const cantMovs = regsCliente.length;
				const {persona, esUser, hora} = regsCliente[0];
				const iconosHTML = FN_navegsDia.obtieneIconosPorFamilia(regsCliente);

				// Agrega un registro de cabecera
				const indice = navegsDia.findIndex((n) => n.cliente_id == cliente_id);
				const cabecera = {cliente_id, persona, cantMovs, esUser, hora, iconosHTML};
				navegsDia.splice(indice, 0, cabecera);
			}

			// Fin
			return navegsDia;
		},
	},
	redirecciona: {
		urlsOrigenDestino: (entidad) => {
			const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);
			return [
				// Productos y Rclvs
				{codOrigen: "DT", destino: "/" + entidad + "/detalle/" + siglaFam, cola: true}, // OK
				{codOrigen: "RA", destino: "/revision/alta/" + siglaFam + "/" + entidad, cola: true},
				{codOrigen: "RE", destino: "/revision/edicion/" + entidad, cola: true},

				// Productos
				{codOrigen: "PDA", destino: "/" + entidad + "/agregar-da"}, // OK
				{codOrigen: "PED", destino: "/" + entidad + "/edicion/p", cola: true},
				{codOrigen: "RL", destino: "/revision/abm-links/p/" + entidad, cola: true},

				// Tableros
				{codOrigen: "TE", destino: "/revision/tablero"},
				{codOrigen: "MT", destino: "/mantenimiento"},
				{codOrigen: "TU", destino: "/revision-us/tablero"},
			];
		},
		obtieneRuta: (entidad, originalUrl) => {
			// Variables
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);

			// Producto Agregar
			if (originalUrl.startsWith("/producto/agregar")) {
				const rutas = [
					{ant: "/palabras-clave", act: "pc"},
					{ant: "/desambiguar", act: "ds"},
					{ant: "/datos-duros", act: "dd"},
					{ant: "/datos-adicionales", act: "da"},
					{ant: "/confirma", act: "cn"},
					{ant: "/terminaste", act: "tr"},
					{ant: "/ingreso-manual", act: "im"},
					{ant: "/ingreso-fa", act: "fa"},
				];
				const ruta = rutas.find((n) => originalUrl.endsWith(n.ant));
				return ruta ? {ant: "/producto/agregar/" + ruta.ant, act: "/producto/agregar-" + ruta.act} : null;
			}

			// Rutas de Familia, Producto RUD y Rclv CRUD
			if (["/producto", "/rclv"].some((n) => originalUrl.startsWith(n))) {
				// Obtiene las rutas
				const rutas = [
					// Familia
					{ant: "/" + familia + "/historial", act: "/" + entidad + "/historial"},
					{ant: "/" + familia + "/inactivar", act: "/" + entidad + "/inactivar"},
					{ant: "/" + familia + "/recuperar", act: "/" + entidad + "/recuperar"},
					{ant: "/" + familia + "/eliminadoPorCreador", act: "/" + entidad + "/eliminado-por-creador"},
					{ant: "/" + familia + "/eliminar", act: "/" + entidad + "/eliminado"},

					// RUD Producto y Rclv
					{ant: "/" + familia + "/detalle", act: "/" + entidad + "/detalle/" + siglaFam},
					{ant: "/" + familia + "/edicion", act: "/" + entidad + "/edicion/" + siglaFam},
				];
				if (familia == "producto") rutas.push({ant: "/producto/calificar", act: "/" + entidad + "/califica/p"});
				if (familia == "rclv") rutas.push({ant: "/rclv/agregar", act: "/" + entidad + "/agregar/r"});

				// Redirecciona
				const ruta = rutas.find((n) => originalUrl.startsWith(n.ant));
				return ruta;
			}

			// Links
			if (familia == "link") return {ant: "/links/visualizacion/", act: "/links/mirar/l/"};
			if (originalUrl.startsWith("/links/abm/")) return {ant: "/links/abm", act: "/" + entidad + "/abm-links/p"};

			// Revisión de Entidades
			if (originalUrl.startsWith("/revision")) {
				// Rutas específicas de cada familia
				const rutas = [
					{ant: "/revision/" + familia + "/alta", act: "/revision/alta/" + siglaFam + "/" + entidad},
					{ant: "/revision/solapamiento/", act: "/revision/solapamiento/r/" + entidad},
					{ant: "/revision/links", act: "/revision/abm-links/p/" + entidad},
				];

				// Rutas compartidas
				const tareas = ["edicion", "rechazar", "inactivar", "recuperar"];
				for (let tarea of tareas)
					rutas.push({ant: "/revision/" + familia + "/" + tarea, act: "/revision/" + tarea + "/" + entidad});

				// Redirecciona
				const ruta = rutas.find((n) => originalUrl.startsWith(n.ant));
				return ruta;
			}

			// Fin
			return null;
		},
	},
};

const FN_tablManten = {
	obtieneRegs: async function (campos) {
		// Variables
		const {entidades} = campos;
		let resultados = [];

		// Obtiene los resultados
		for (let entidad of entidades) resultados.push(this.lecturaBD({entidad, ...campos}));

		// Consolida los resultados y los ordena
		resultados = await Promise.all(resultados)
			.then((n) => n.flat())
			.then((n) => n.sort((a, b) => b.statusSugeridoEn - a.statusSugeridoEn));

		// Quita los comprometidos por capturas
		resultados = await comp.sinProblemasDeCaptura(resultados, campos.usuario_id);

		// Fin
		return resultados;
	},
	lecturaBD: async ({status_id, include, entidad}) => {
		// Variables
		const includeBD = include ? [...include] : [];
		if (entidad == "colecciones") includeBD.push("csl"); // capítulos sin link

		// Condiciones
		const condicion = {statusRegistro_id: status_id}; // Con status según parámetro
		if (variables.entidades.rclvs.includes(entidad)) condicion.id = {[Op.gt]: varios_id};

		// Resultado
		const resultados = await baseDatos
			.obtieneTodosPorCondicion(entidad, condicion, includeBD)
			.then((n) => n.map((m) => ({...m, entidad})));

		// Fin
		return resultados;
	},
	obtieneSinEdicion: (entidad) => {
		// Variables
		const condicion = {statusRegistro_id: creadoAprob_id};
		if (entidad == "capitulos") condicion.statusColeccion_id = aprobado_id;

		// Obtiene la información
		return baseDatos
			.obtieneTodosPorCondicion(entidad, condicion, "ediciones")
			.then((n) => n.filter((m) => !m.ediciones.length))
			.then((n) => n.map((m) => ({...m, entidad})));
	},
	obtieneProdsDeLinks: async (links, usuario_id) => {
		// Variables
		let LI = [];

		// Obtiene los prods
		for (let link of links) {
			// Variables
			const entidad = comp.obtieneDesdeCampo_id.prodEnt(link);
			const asociacion = comp.obtieneDesdeEntidad.asociacion(entidad);
			const fechaRef = link.statusSugeridoEn;
			const fechaRefTexto = comp.fechaHora.diaMesUTC(link.statusSugeridoEn);

			// Agrega los registros
			LI.push({...link[asociacion], entidad, fechaRef, fechaRefTexto});
		}

		if (LI.length > 1) {
			// Ordena
			LI.sort((a, b) => new Date(b.fechaRef) - new Date(a.fechaRef)); // Fecha más reciente

			// Elimina repetidos
			LI = comp.eliminaRepetidos(LI);
		}

		// Deja solamente los prods aprobados
		if (LI.length) LI = LI.filter((n) => aprobados_ids.includes(n.statusRegistro_id));

		// Deja solamente los prods sin problemas de captura
		if (LI.length) LI = await comp.sinProblemasDeCaptura(LI, usuario_id);

		// Fin
		return {LI};
	},
};
const FN_navegsDia = {
	obtieneIconosPorFamilia: (regsCliente) => {
		// Variables
		let iconosCons = [];

		// Deja solamente los registros con íconos
		regsCliente = regsCliente.filter((n) => n.iconosArray);

		// Obtiene los iconos por familia
		for (let familia of familiaRutas) {
			// Obtiene los regsCliente con ese ícono
			const registrosDeFamilia = regsCliente.filter((n) => n.iconosArray[0].includes(familia));
			if (!registrosDeFamilia.length) continue;

			// Descarta del general, los registros que ya se eligieron
			regsCliente = regsCliente.filter((n) => !n.iconosArray[0].includes(familia));

			// Obtiene el ícono principal
			const iconoFamilia = registrosDeFamilia[0].iconosArray[0];

			// Obtiene los íconos secundarios
			let iconosSecun = registrosDeFamilia.map((n) => n.iconosArray[1]);
			iconosSecun = [...new Set(iconosSecun)];
			iconosSecun.reverse();

			// Consolida los íconos
			const iconosConsFamilia = [iconoFamilia, ...iconosSecun].join(" ");
			iconosCons.push(iconosConsFamilia);
		}

		// Obtiene los íconos que no fueron incluidos
		let iconosResto = regsCliente.map((n) => n.iconosArray[0]);
		if (iconosResto.length) {
			iconosResto = [...new Set(iconosResto)]; // elimina los repetidos
			iconosResto.reverse(); // FIFO
			const iconosConsFamilia = iconosResto.join(" ");
			iconosCons.unshift(iconosConsFamilia); // los agrega al inicio
		}

		// Convierte los íconos a texto
		iconosCons = iconosCons.join("<span class'separador'> / </span>");

		// Fin
		return iconosCons;
	},
};
