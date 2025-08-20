"use strict";
// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");
const validaFM = require("../2.0-Familias/FM-FN-Validar");
const procesos = require("./PR-FN-Procesos");

module.exports = {
	// Edición del Producto
	edicion: {
		valida: async (req, res) => {
			// Obtiene los campos
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			req.query.entidad = entidad;
			const campos = Object.keys(req.query);

			// Averigua los errores solamente para esos campos
			req.query.publico = req.session.usuario.rol.autTablEnts;
			req.query.epocaOcurrencia = req.session.usuario.rol.autTablEnts;
			const errores = await validaFM.consolidado({campos, datos: req.query});

			// Devuelve el resultado
			return res.json(errores);
		},
		obtieneVersionesProd: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id: prodId} = req.query;
			const usuario_id = req.session.usuario.id;

			// Obtiene los datos ORIGINALES y EDITADOS del producto
			const [prodOrig, prodEdic] = await procsFM.obtieneOriginalEdicion({
				entidad,
				entId: prodId,
				usuario_id,
				excluirInclude: true,
			});

			// Envía los datos
			return res.json([prodOrig, prodEdic]);
		},
		variablesProd: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id} = req.query;

			// Tipos de actuación
			const datos = {
				...{anime_id, documental_id, actuada_id, tiposActuacion},
				...{inputVacio, selectVacio, rclvSinElegir},
				creados_ids,
			};
			if (entidad == "capitulos")
				datos.coleccion_id = await baseDatos.obtienePorId("capitulos", id).then((n) => n.coleccion_id);

			// Fin
			return res.json(datos);
		},
		variablesRclv: (req, res) => res.json(idsReserv),
		eliminaNueva: async (req, res) => {
			// Elimina Session y Cookies
			if (req.session.edicProd) delete req.session.edicProd;
			if (req.cookies.edicProd) res.clearCookie("edicProd");

			// Terminar
			return res.json();
		},
		eliminaGuardada: async (req, res) => {
			// Obtiene los datos identificatorios del producto
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const entId = req.query.id;
			const usuario_id = req.session.usuario.id;

			// Obtiene los datos ORIGINALES y EDITADOS del producto
			const params = {entidad, entId, usuario_id, excluirInclude: true, omitirPulirEdic: true};
			const [prodOrig, prodEdic] = await procsFM.obtieneOriginalEdicion(params);

			// Sólo se puede eliminar la edición si el producto no tiene status "creados_ids" o fue creado por otro usuario
			const condicion = !creados_ids.includes(prodOrig.statusRegistro_id) || prodOrig.creadoPor_id != usuario_id;

			if (condicion && prodEdic) {
				if (prodEdic.avatar) comp.gestionArchivos.elimina(carpProds.revisar, prodEdic.avatar);
				baseDatos.eliminaPorId("prodEdics", prodEdic.id);
			}
			// Terminar
			return res.json();
		},
		envioParaSession: async (req, res) => {
			if (req.query.avatar) delete req.query.avatar;
			req.session.edicProd = req.query;
			res.cookie("edicProd", req.query, {maxAge: unDia});
			return res.json();
		},
		obtieneRclv: async (req, res) => {
			const {entidad, id} = req.query;
			const rclv = await baseDatos.obtienePorId(entidad, id);
			return res.json(rclv);
		},
	},
	califics: {
		delProducto: async (req, res) => {
			// Variables
			const {entidad, id: prodId} = req.query;
			const usuario_id = req.session.usuario && req.session.usuario.id;
			let datos;
			let calificaciones = [];

			// Datos generales
			datos = await baseDatos
				.obtienePorId(entidad, prodId)
				.then((n) => [n.feValores, n.entretiene, n.calidadTecnica, n.calificacion]);
			calificaciones.push({autor: "Gral.", valores: datos});

			// Datos particulares
			const condicion = {usuario_id, entidad, entidad_id: prodId};
			const include = ["feValores", "entretiene", "calidadTecnica"];
			datos = usuario_id && (await baseDatos.obtienePorCondicion("calRegistros", condicion, include));
			if (datos) {
				datos = [datos.feValores.valor, datos.entretiene.valor, datos.calidadTecnica.valor, datos.resultado];
				calificaciones.push({autor: "Tuya", valores: datos});
			}

			// Fin
			return res.json(calificaciones);
		},
		delUsuarioProducto: async (req, res) => {
			// Variables
			const {entidad, id: prodId} = req.query;
			const usuario_id = req.session.usuario.id;

			// Datos particulares
			const condicion = {usuario_id, entidad, entidad_id: prodId};
			const califGuardada = await baseDatos.obtienePorCondicion("calRegistros", condicion);

			// Fin
			return res.json({califGuardada, atributosCalific, calCriterios});
		},
		elimina: async (req, res) => {
			// Variables
			const {entidad, id: entidad_id} = req.query;
			const usuario_id = req.session.usuario ? req.session.usuario.id : "";

			// Elimina
			const condicion = {usuario_id, entidad, entidad_id};
			await baseDatos.eliminaPorCondicion("calRegistros", condicion);

			// Actualiza las calificaciones del producto
			await procesos.actualizaCalifProd({entidad, entidad_id});

			// Fin
			return res.json();
		},
	},
	prefsDeCampo: {
		obtieneOpciones: (req, res) => res.json(pppOpcsSimples),
		guardaLaPreferencia: async (req, res) => {
			// Variables
			const {entidad, entidad_id, ppp_id} = req.query;
			const usuario_id = req.session.usuario.id;

			// Si existe el registro, lo elimina
			const condicion = {entidad, entidad_id, usuario_id};
			const registro = await baseDatos.obtienePorCondicion("pppRegistros", condicion);
			if (registro) baseDatos.eliminaPorId("pppRegistros", registro.id);

			// Si la opción no es sinPref, agrega el registro
			if (ppp_id != pppOpcsObj.sinPref.id) {
				const datos = {entidad, entidad_id, usuario_id, ppp_id};
				baseDatos.agregaRegistro("pppRegistros", datos);
			}

			// Fin
			return res.json();
		},
	},
};
