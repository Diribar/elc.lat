"use strict";
// Variables
const validaFM = require("../2.0-Familias/FM-FN-Validar");
const buscar_x_PC = require("./PA-FN1-Buscar_x_PC");
const procsDesamb = require("./PA-FN2-Desambiguar");
const valida = require("./PA-FN3-Validar");
const procesos = require("./PA-FN4-Procesos");

module.exports = {
	validacs: {
		palabrasClave: (req, res) => {
			const palabrasClave = req.query.palabrasClave;
			const errores = valida.palabrasClave(palabrasClave, 1);
			return res.json(errores);
		},
		desambiguar: async (req, res) => {
			// Variables
			const datosDuros = req.cookies.datosOriginales;

			// Para datosDuros, da de alta el avatarUrl y de baja el avatar
			datosDuros.avatarUrl = datosDuros.avatar;
			delete datosDuros.avatar;

			// Averigua si falta completar algún campo de Datos Duros
			const camposDD = variables.camposDD.filter((n) => n[datosDuros.entidad] || n.productos);
			const camposNombre = camposDD.map((n) => n.nombre);
			const errores = await validaFM.datosDuros(camposNombre, datosDuros);

			// Genera la session y cookie para DatosDuros
			req.session.datosDuros = datosDuros;

			// Si hay errores, genera la cookie para datosDuros
			if (errores.hay) res.cookie("datosDuros", datosDuros, {maxAge: unDia});
			// Genera la session y cookie para datosAdics
			else {
				req.session.datosAdics = datosDuros;
				res.cookie("datosAdics", datosDuros, {maxAge: unDia});
			}

			// Fin
			return res.json(errores);
		},
		datosDuros: async (req, res) => {
			// Variables
			const datosDuros = req.session.datosDuros || req.cookies.datosDuros;
			const datos = {imgOpcional: datosDuros.imgOpcional, ...req.query};
			const campos = Object.keys(datos);

			// Averigua los errores solamente para esos campos
			let errores = await validaFM.datosDuros(campos, datos);

			// Devuelve el resultado
			return res.json(errores);
		},
		datosAdics: async (req, res) => {
			// Obtiene los campos
			const campos = Object.keys(req.query);
			const errores = await validaFM.datosAdics(campos, req.query);
			return res.json(errores);
		},
		copiarFA: (req, res) => {
			const errores = valida.FA(req.query);
			return res.json(errores);
		},
	},

	// Vista palabrasClave
	buscaInfoDeSession_pc: async (req, res) => {
		// Variables
		const {palabrasClave, pcHallazgos} = req.session;

		// Corrije la respuesta
		const respuesta = !palabrasClave
			? null // si no existe req.session.palabrasClave
			: !pcHallazgos || palabrasClave != pcHallazgos.palabrasClave
			? {palabrasClave} // si las palabrasClave difieren
			: pcHallazgos; // si las palabrasClave coinciden

		// Fin
		res.json(respuesta);
	},
	pcHallazgos: {
		// Busca los productos
		buscaProds: async (req, res) => {
			// Variables
			const {session} = req.query;
			const palabrasClave = req.query.palabrasClave || req.session[session];

			// Actualiza en session las palabrasClave, con el valor del formulario
			if (req.session.palabrasClave != palabrasClave) req.session.palabrasClave = palabrasClave;

			// Obtiene los datos
			const resultados = await buscar_x_PC.buscaProds(palabrasClave);

			// Conserva la información en session
			req.session.pcHallazgos = {palabrasClave, ...resultados}; // 'palabrasClave', 'productos', 'cantPaginasAPI', 'cantPaginasUsadas', 'hayMas'

			// Fin
			return res.json();
		},
		// Reemplaza las películas por su colección
		reemplPeliPorColec: async (req, res) => {
			// Variables
			let {productos} = req.session.pcHallazgos;

			// Revisa si debe reemplazar una película por su colección
			productos = await buscar_x_PC.reemplPeliPorColec(productos);

			// Conserva la información en session
			req.session.pcHallazgos.productos = productos;

			// Fin
			return res.json(); // 'palabrasClave', 'productos', 'cantPaginasAPI', 'cantPaginasUsadas', 'hayMas'
		},
		// Pule la información
		organizaLaInfo: async (req, res) => {
			// Organiza la información
			const resultados = await buscar_x_PC.organizaLaInfo(req.session.pcHallazgos);

			// Conserva la información en session para no tener que procesarla de nuevo
			delete req.session.pcHallazgos.productos;
			req.session.pcHallazgos = {...req.session.pcHallazgos, ...resultados};

			// Fin
			return res.json();
		},
		// Obtiene los hallazgos de origen IM y FA
		agregaHallazgosDeIMFA: async (req, res) => {
			// Variables
			const {palabrasClave} = req.session.pcHallazgos;

			let {prodsYaEnBD} = req.session.pcHallazgos;

			// Obtiene los productos afines, ingresados por fuera de TMDB
			const prodsIMFA = await procesos.prodsIMFA(palabrasClave);

			// Une y ordena los 'prodsYaEnBD' priorizando los más recientes
			prodsYaEnBD = [...prodsYaEnBD, ...prodsIMFA];
			prodsYaEnBD.sort((a, b) => b.anoEstreno - a.anoEstreno);

			// Conserva la información en session para no tener que procesarla de nuevo
			req.session.pcHallazgos.prodsYaEnBD = prodsYaEnBD;

			// Fin
			return res.json();
		},
		obtieneElMensaje: (req, res) => {
			// Variables
			const {prodsNuevos, prodsYaEnBD, hayMas} = req.session.pcHallazgos;
			const cantNuevos = prodsNuevos.length;
			const cantYaEnBd = prodsYaEnBD.length;
			const cantProds = cantNuevos + cantYaEnBd;
			const mensaje = {};

			// Obtiene el mensaje para 'palabrasClave'
			if (cantProds && !hayMas) {
				// Más variables
				const plural = cantNuevos > 1 ? "s" : "";

				// Obtiene el mensaje
				mensaje.palabrasClave = cantNuevos
					? "Encontramos " + cantNuevos + " coincidencia" + plural + " nueva" + plural
					: "No encontramos ninguna coincidencia nueva";
				if (cantProds > cantNuevos) mensaje.palabrasClave += ", y " + cantYaEnBd + " ya en BD";
			}
			// Quedaron casos por buscar o no se hallaron productos
			else
				mensaje.palabrasClave = hayMas
					? "Hay demasiadas coincidencias (+" + cantProds + "), intentá ser más específico"
					: "No encontramos ninguna coincidencia";

			// Obtiene el mensaje para 'desambiguar'
			mensaje.desambiguar =
				"Encontramos " +
				(cantProds == 1
					? "una sola coincidencia, que " + (cantNuevos == 1 ? "no" : "ya")
					: (hayMas ? "muchas" : cantProds) +
					  " coincidencias" +
					  (hayMas ? ". Te mostramos " + cantProds : "") +
					  (cantNuevos == cantProds
							? ", ninguna"
							: cantNuevos
							? ", de las cuales " + cantNuevos + " no"
							: ", todas ya")) +
				" está" +
				(cantNuevos > 1 && cantNuevos < cantProds ? "n" : "") +
				" en nuestro catálogo.";

			// Fin
			req.session.pcHallazgos.mensaje = mensaje;
			return res.json();
		},
	},

	// Vista desambiguar
	desamb: {
		// Busca valores 'session'
		buscaInfoDeSession: async (req, res) => {
			// Variables
			let {desambiguar: palabrasClave, pcHallazgos} = req.session;
			if (!pcHallazgos || palabrasClave != pcHallazgos.palabrasClave) pcHallazgos = null;

			// Arma la respuesta
			const respuesta = {palabrasClave, ...pcHallazgos};

			// Fin
			res.json(respuesta);
		},
		// Actualiza Datos Originales
		actualizaDatosOrigs: async (req, res) => {
			// Variables
			const datos = JSON.parse(req.query.datos);

			// Obtiene más información del producto
			const TMDB_entidad = datos.TMDB_entidad;
			const infoTMDBparaDD = await procsDesamb[TMDB_entidad].obtieneInfo(datos);
			if (!infoTMDBparaDD.avatar) infoTMDBparaDD.imgOpcional = "NO";

			// Guarda los datos originales en una cookie
			res.cookie("datosOriginales", infoTMDBparaDD, {maxAge: unDia});

			// Fin
			return res.json();
		},
		creaSessionIm: (req, res) => {
			req.session.IM = {};
			res.cookie("IM", {}, {maxAge: unDia});
			return res.json();
		},
	},

	// Vista datosAdics
	guardaDatosAdics: (req, res) => {
		// Obtiene los datosAdics
		const datosAdics = {
			...(req.session.datosAdics || req.cookies.datosAdics),
			...req.query,
		};

		// Actualiza session y cookie
		req.session.datosAdics = datosAdics;
		res.cookie("datosAdics", datosAdics, {maxAge: unDia});

		// Fin
		return res.json();
	},

	// Vista IM
	im: {
		sessionCookie: (req, res) => res.json(req.session.IM || req.cookies.IM),
		colecciones: async (req, res) => {
			// Obtiene todas las colecciones aprobadas y las ordena por su nombre
			const datos = await baseDatos
				.obtieneTodosPorCondicion("colecciones", {statusRegistro_id: aprobados_ids})
				.then((n) => n.map((m) => ({id: m.id, nombreCastellano: m.nombreCastellano + " (" + m.anoEstreno + ")"})))
				.then((n) => n.sort((a, b) => (a.nombreCastellano < b.nombreCastellano ? -1 : 1)));

			// Fin
			return res.json(datos);
		},
		capsTemp: async (req, res) => {
			const {coleccion_id, numTemp} = req.query;
			const datos = await procsFM.obtieneCapsTemp({coleccion_id, numTemp});
			return res.json(datos);
		},
		cantTemps: async (req, res) => {
			const datos = await baseDatos.obtienePorId("colecciones", req.query.id).then((n) => n.cantTemps);
			return res.json(datos);
		},
	},

	// Vista FA
	obtieneFA_id: (req, res) => {
		let FA_id = procesos.FA.obtieneFA_id(req.query.direccion);
		return res.json(FA_id);
	},
	averiguaSiYaExisteEnBd: async (req, res) => {
		const {entidad, campo, valor} = req.query;
		const existe = await baseDatos.obtienePorCondicion(entidad, {[campo]: valor});
		return res.json(existe);
	},
};
