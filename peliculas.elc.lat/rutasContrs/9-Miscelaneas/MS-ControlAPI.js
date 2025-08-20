"use strict";
// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");

// Controlador
module.exports = {
	horarioInicial: async (req, res) => {
		// Variables
		const {entidad, id} = req.query;
		const usuario_id = req.session.usuario.id;

		// Datos de captura
		const condicion = {entidad, entidad_id: id, activa: true};
		const captura = await baseDatos.obtienePorCondicion("capturas", condicion);
		const {capturadoEn, capturadoPor_id} = captura ? captura : {};

		// Datos del registro
		const registro = !capturadoEn ? await baseDatos.obtienePorId(entidad, id) : {};
		const {creadoEn, creadoPor_id} = registro ? registro : {};

		// Genera los datos
		const datos = {creadoEn, creadoPor_id, capturadoEn, capturadoPor_id, usuario_id};

		// Fin
		return res.json(datos);
	},
	busquedaRapida: async (req, res) => {
		// Variables
		const {palabras, omitirStatus} = req.query;
		const usuario_id = req.session.usuario ? req.session.usuario.id : 0;
		const autTablEnts = req.session.usuario && req.session.usuario.rol.autTablEnts;
		const prodEnts = variables.entidades.prods;
		const rclvEnts = variables.entidades.rclvs;
		const camposProds = ["nombreCastellano", "nombreOriginal"];
		const camposRclvs = ["nombre", "nombreAltern"];
		const original = true;
		let datos = [];
		let resultados = [];
		let campos;

		// Armado de la variable 'datos' para productos originales
		campos = camposProds;
		for (let entidad of prodEnts) datos.push({familia: "producto", entidad, campos, original});

		// Armado de la variable 'datos' para rclvs originales
		for (let entidad of rclvEnts) {
			campos = ["personajes", "hechos"].includes(entidad) ? camposRclvs : ["nombre"];
			datos.push({familia: "rclv", entidad, campos, original});
		}

		// Armado de la variable 'datos' para ediciones
		campos = camposProds;
		datos.push({familia: "producto", entidad: "prodEdics", campos, include: variables.entidades.prodAsocs}); // productos
		campos = camposRclvs;
		datos.push({familia: "rclv", entidad: "rclvEdics", campos, include: variables.entidades.rclvAsocs}); // rclvs

		// Rutina
		for (let dato of datos) {
			// Obtiene las condiciones
			campos = dato.campos;
			const original = dato.original;
			const condicion = procsFM.quickSearch.condicion({palabras, campos, usuario_id, original, autTablEnts, omitirStatus});

			// Obtiene los registros que cumplen las condiciones
			resultados.push(
				dato.original
					? procsFM.quickSearch.registros(condicion, dato) // originales
					: procsFM.quickSearch.ediciones(condicion, dato) // ediciones
			);
		}
		resultados = await Promise.all(resultados).then((n) => n.flat());

		// Acciones si hay más de un resultado
		if (resultados.length > 1) {
			// Ordena los resultados
			resultados.sort((a, b) => (a.anoEstreno < b.anoEstreno ? -1 : 1)); // tercera prioridad: anoEstreno
			resultados.sort((a, b) => (a.nombre < b.nombre ? -1 : 1)); // segunda prioridad: nombre
			resultados.sort((a, b) => (a.familia < b.familia ? -1 : 1)); // primera prioridad: familia

			// Elimina duplicados
			for (let i = resultados.length - 2; i >= 0; i--) {
				const {entidad: entidad1, id: id1} = resultados[i];
				const {entidad: entidad2, id: id2} = resultados[i + 1];
				if (entidad1 == entidad2 && id1 == id2) resultados.splice(i + 1, 1);
			}
		}

		// Envia la info al FE
		return res.json(resultados);
	},
	guardaUrlBusqRap: (req, res) => {
		// Variables
		const {cliente_id} = req.session.cliente || req.cookies;
		const ruta = "busqueda-rapida";
		const {comentario} = req.query;

		// Si corresponde, guarda el registro
		comp.guardaRegistroNavegac({cliente_id, ruta, comentario, reqHeaders: req.headers["user-agent"]});

		// Fin
		return res.json();
	},
	bienvenidoAceptado: (req, res) => {
		req.session.bienvenido = true;
		return res.json();
	},
	obtieneCookies: (req, res) => {
		const apiKey = req.headers["x-api-key"];
		if (apiKey != "MI_API_KEY_SECRETA") console.log("Acceso denegado");
		console.log(108,req.cookies);
		return res.json(req.cookies);
	},
};
