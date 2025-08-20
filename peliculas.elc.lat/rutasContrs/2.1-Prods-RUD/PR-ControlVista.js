"use strict";
// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");
const validaFM = require("../2.0-Familias/FM-FN-Validar");
const procsPA = require("../2.1-Prods-Agregar/PA-FN4-Procesos");
const procesos = require("./PR-FN-Procesos");
const valida = require("./PR-FN-Validar");

// Controlador
module.exports = {
	detalle: async (req, res) => {
		// Variables
		const tema = "prodRud";
		const codigo = "detalle";
		const entidad = comp.obtieneEntidadDesdeUrl(req);
		const {id} = req.query;
		const origen = req.query.origen; // puede venir de mantenimiento
		const {usuario} = req.session;
		const usuario_id = usuario && usuario.id;
		const autTablEnts = usuario && usuario.rol.autTablEnts;

		// Obtiene la versión más completa posible del producto
		let [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id});
		original = await procesos.obtieneColCaps.consolidado(original, entidad, usuario_id);
		const prodComb = {...original, ...edicion, id: original.id};

		// Configura el título de la vista
		const nombre = prodComb.nombreCastellano || prodComb.nombreOriginal;
		const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
		const delLa = comp.obtieneDesdeEntidad.delLa(entidad);
		const titulo = "Detalle" + " - " + nombre;
		const tituloVista = "Detalle" + delLa + entidadNombre;

		// Info para el bloque Izquierdo
		const {infoGral, actores} = procesos.bloqueIzq(prodComb);
		const bloqueIzq = {infoGral, actores};

		// Rclv - Variables
		const rclvEnts = variables.entidades.rclvs;
		const rclvs = rclvEnts.map((n) => ({
			entidad: n,
			campo_id: comp.obtieneDesdeEntidad.campo_id(n),
			asociacion: comp.obtieneDesdeEntidad.asociacion(n),
		}));
		const {rclvCampos_id} = variables.entidades;
		const asocs = variables.entidades.rclvAsocs;

		// Rclv - Le agrega datos al bloque izquierdo
		for (let i = 0; i < asocs.length; i++)
			if (prodComb[rclvCampos_id[i]] != ninguno_id) {
				const rclvEnt = rclvEnts[i];
				const include = rclvEnt == "personajes" ? "canon" : "";
				const rclv = include
					? await baseDatos.obtienePorId(rclvEnt, prodComb[rclvCampos_id[i]], include)
					: prodComb[asocs[i]];
				bloqueIzq[asocs[i]] = procsFM.bloques.rclv({...rclv, entidad: rclvEnt});
			}
		const rclvsNombre = variables.entidades.rclvsNombre;

		// Info para el bloque Derecho
		const bloqueDer = {producto: true, registro: await procsFM.bloques.registro({...prodComb, entidad})};
		const imgDerPers = procsFM.obtieneAvatar(original, edicion).edic;

		// Lecturas de BD
		const condicion = {usuario_id, entidad, entidad_id: id};
		let interesDelUsuario = usuario_id && procesos.obtieneInteresDelUsuario(condicion);
		let yaCalificada = usuario_id && baseDatos.obtienePorCondicion("calRegistros", condicion).then((n) => !!n);
		let links = procesos.obtieneLinksDelProducto({entidad, id, usuario_id, autTablEnts, origen});
		[links, interesDelUsuario, yaCalificada] = await Promise.all([links, interesDelUsuario, yaCalificada]);

		// Obtiene datos para la vista
		const {creadoPor_id, statusRegistro_id: status_id} = prodComb;
		const revisorPERL = usuario && usuario.rol.revisorPERL;
		const iconoDL = iconos.detalle;
		const iconoDB = iconos.graficos;
		const {statusAlineado} = await procsFM.statusAlineado({entidad, prodRclv: prodComb});
		const familia = "producto";
		const oa = comp.obtieneDesdeEntidad.oa(entidad);
		const tituloLink = yaCalificada ? "Ya l" + oa + " calificaste" : "Califical" + oa;

		// Va a la vista
		// return res.send(prodComb);
		return res.render("CMP-0Estructura", {
			...{tema, codigo, tituloVista, titulo, origen, revisorPERL},
			...{entidad, id, familia, status_id, creadoPor_id, statusAlineado},
			...{registro: prodComb, links, interesDelUsuario, yaCalificada, tituloLink},
			...{imgDerPers, tituloImgDerPers: nombre},
			...{bloqueIzq, bloqueDer, rclvs, asocs, rclvsNombre},
			...{iconosMobile: true, iconoDL, iconoDB, redirige: true},
		});
	},
	edicion: {
		form: async (req, res) => {
			// Variables
			const tema = "prodRud";
			const codigo = "edicion";
			const {entidad} = comp.partesDelUrl(req);
			const {id} = req.query;
			const usuario_id = req.session.usuario.id;
			const origen = req.query.origen || "DT"; // puede venir de revisión de edición

			// Si el origen es 'DT' y está en el 'query', recarga la vista quitándolo
			if (req.query.origen == "DT") {
				const destino = req.originalUrl.replace("&origen=DT", "");
				return res.redirect(destino);
			}

			// Procesa la session y cookie
			const session = req.session.edicProd && req.session.edicProd.entidad == entidad && req.session.edicProd.id == id;
			const cookie = req.cookies.edicProd && req.cookies.edicProd.entidad == entidad && req.cookies.edicProd.id == id;
			const edicSession = session ? req.session.edicProd : cookie ? req.cookies.edicProd : "";

			// Obtiene la versión más completa posible del producto
			let [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id});
			original = await procesos.obtieneColCaps.consolidado(original, entidad, usuario_id);
			const prodComb = {...original, ...edicion, id: original.id};

			// Datos Duros
			const camposInput = variables.camposDD.filter((n) => n[entidad] || n.productos).filter((n) => n.campoInput);
			const camposInput1 = camposInput.filter((n) => n.campoInput == 1);
			const camposInput2 = camposInput.filter((n) => n.campoInput == 2);
			const imgDerPers = procsFM.obtieneAvatar(original, {...edicion, ...edicSession});

			// Datos Adicionales
			const camposDA = await variables.camposDaConVals(usuario_id);
			const gruposPers = procsPA.grupos.pers(camposDA);
			const gruposHechos = procsPA.grupos.hechos(camposDA);

			// Configura el título de la vista
			const nombre = prodComb.nombreCastellano || prodComb.nombreOriginal;
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
			const delLa = comp.obtieneDesdeEntidad.delLa(entidad);
			const titulo = "Edición - " + nombre;
			const tituloVista = "Edición" + delLa + entidadNombre;

			// Datos para la vista
			const status_id = original.statusRegistro_id;
			const paisesTop5 = [...paises].sort((a, b) => b.cantProds.cantidad - a.cantProds.cantidad).slice(0, 5);
			const paisesNombre = original.paises_id ? comp.paises_idToNombre(original.paises_id) : "";
			const datosProvs = comp.datosProvs(prodComb);
			const familia = "producto";
			const registro = prodComb;
			const dataEntry = prodComb;
			const prodEdic = true;

			// Va a la vista
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, tituloVista, origen, prodEdic, imgDerPers, status_id},
				...{entidad, entidadNombre, id, familia, registro, dataEntry, camposInput1, camposInput2, datosProvs},
				...{paises, paisesTop5, idiomas, paisesNombre, camposDA, gruposPers, gruposHechos},
				...{estrucPers: true, cartelGenerico: true, redirige: true},
			});
		},
		guardar: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, origen} = req.query;
			const usuario = req.session.usuario;
			const usuario_id = usuario.id;
			const revisorPERL = usuario.rol.revisorPERL;
			const idOrigen = "/?id=" + id + (origen ? "&origen=" + origen : "");

			// Reemplaza valores
			for (let prop in req.body)
				if (!req.body[prop]) req.body[prop] = null; // elimina los campos vacíos
				else if (typeof req.body[prop] == "string") req.body[prop] = req.body[prop].trim(); // pule los espacios innecesarios

			// Corrige/completa el valor de los checkbox
			const camposCheckBox = variables.camposDA.filter((n) => n.chkBox).map((n) => n.nombre);
			for (let campo of camposCheckBox) req.body[campo] = req.body[campo] ? "1" : "0";

			// Si recibimos un avatar, se completa la información
			if (req.file) {
				req.body.avatar = req.file.filename;
				req.body.avatarUrl = req.file.originalname;
				req.body.tamano = req.file.size;
			}

			// Obtiene el producto 'Original' y 'Editado'
			const params = {entidad, entId: id, usuario_id, excluirInclude: true};
			let [original, edicion] = await procsFM.obtieneOriginalEdicion(params);
			const avatarEdicInicial = edicion.avatar;

			// Averigua si corresponde actualizar el original
			const actualizaOrig =
				revisorPERL && // tiene que ser un revisorPERL
				original.statusRegistro_id == creadoAprob_id && // el registro debe estar en el status 'creadoAprob'
				!edicion.id && // no debe tener una edición
				entidad != "capitulos"; // no debe ser un capitulo

			// Averigua si hay errores de validación
			// 1. Se debe agregar el id del original para mantenerlo fiel
			// 2. Se debe agregar la edición, para que aporte su campo 'avatar'
			const prodComb = {...original, ...edicion, ...req.body, id};
			prodComb.epocaOcurrencia = revisorPERL; // si es un revisorPERL, agrega la obligatoriedad de que haya completado los campos 'epocaOcurrencia_id' y 'publico_id'
			prodComb.publico = revisorPERL;
			const errores = await validaFM.consolidado({datos: {...prodComb, entidad}});

			// Acciones si hay errores sensibles - recarga la vista
			if (errores.sensible) {
				// Si recibimos un archivo avatar editado, lo elimina
				if (req.file) comp.gestionArchivos.elimina(carpProvisorio, req.file.filename);

				// Guarda los datos editados, sin el de avatar
				req.session.edicProd = req.body;
				delete req.session.edicProd.avatar;

				// Recarga la vista
				return res.redirect(req.originalUrl);
			}

			// Acciones si corresponde actualizar el original
			if (actualizaOrig) {
				// Actualiza el registro original
				await baseDatos.actualizaPorId(entidad, id, prodComb);

				// 3. Si es una colección, revisa si corresponde actualizar ese campo en sus capítulos
				if (entidad == "colecciones")
					for (let prop in req.body)
						if (original[prop] != req.body[prop]) await procesos.transfDatosDeColParaCaps(original, req.body, prop);

				// Varias
				const edicsEliminadas = procsFM.elimina.demasEdiciones({entidad, original: prodComb, id}); // Elimina otras ediciones que tengan los mismos valores
				const statusAprob = procesos.accionesPorCambioDeStatus({entidad, registro: prodComb}); // Se fija si corresponde cambiar el status
				await Promise.all([statusAprob, edicsEliminadas]);
				edicion = null; // Limpia el valor de la edicion, para que no se recargue el url
			}
			// De lo contrario, actualiza la edicion
			else {
				// Combina la información
				edicion = {...edicion, ...req.body};

				// Guarda o actualiza la edición, y achica 'edición a su mínima expresión
				edicion = await procsFM.guardaActEdic({entidad, original, edicion, usuario_id});
			}

			// Acciones sobre el archivo avatar, si recibimos uno
			if (req.file)
				if (actualizaOrig) {
					comp.gestionArchivos.mueveImagen(prodComb.avatar, carpProvisorio, carpProds.final); // Mueve el archivo de la edición para reemplazar el original
					if (original.avatar) comp.gestionArchivos.elimina(carpProds.final, original.avatar); // Elimina el anterior archivo de imagen original
				} else {
					comp.gestionArchivos.mueveImagen(prodComb.avatar, carpProvisorio, carpProds.revisar); // Mueve el archivo de la edición para su revisión
					if (avatarEdicInicial) comp.gestionArchivos.elimina(carpProds.revisar, avatarEdicInicial); // Elimina el anterior archivo de imagen editada
				}

			// Elimina los datos de la session y cookie
			delete req.session.edicProd;
			res.clearCookie("edicProd");

			// Fin
			return origen == "TE"
				? res.redirect("/" + entidad + "/inactivar-captura" + idOrigen) // Regresa a Revisión
				: res.redirect("/" + entidad + "/detalle/p" + idOrigen); // Redirige a detalle
		},
	},
	califica: {
		form: async (req, res) => {
			// Variables
			const tema = "prodRud";
			const codigo = "califica";
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id} = req.query;
			const origen = "DT";
			const usuario_id = req.session.usuario ? req.session.usuario.id : "";

			// Obtiene la versión más completa posible del producto
			let [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id});
			original = await procesos.obtieneColCaps.consolidado(original, entidad, usuario_id);
			const prodComb = {...original, ...edicion, id: original.id};

			// Info para el bloque Derecho
			const bloqueDer = {producto: true, registro: await procsFM.bloques.registro({...prodComb, entidad})};
			const imgDerPers = procsFM.obtieneAvatar(original, edicion).edic;

			// Más variables
			const condicion = {usuario_id, entidad, entidad_id: id};
			const interesDelUsuario = await procesos.obtieneInteresDelUsuario(condicion);

			// Configura el título de la vista
			const nombre = prodComb.nombreCastellano || prodComb.nombreOriginal;
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
			const elLa = comp.obtieneDesdeEntidad.elLa(entidad);
			const titulo = "Calificá - " + nombre;
			const tituloVista = "Calificá" + elLa + entidadNombre;

			// Ayuda para el título
			const ayudasTitulo = [];
			if ([pppOpcsObj.sinPref.id, pppOpcsObj.laQuieroVer.id].includes(interesDelUsuario.id))
				ayudasTitulo.push("Sólo podés calificar una película si ya la viste.");
			if (interesDelUsuario.id == pppOpcsObj.sinPref.id)
				ayudasTitulo.push("Si la calificás, cambiaremos tu preferencia como 'Ya vista'");
			ayudasTitulo.push("Necesitamos saber TU opinión, no la de otras personas.");

			// Datos para la vista
			const status_id = original.statusRegistro_id;
			const atributosTitulo = ["Deja Huella", "Entretiene", "Calidad Técnica"];
			const include = ["feValores", "entretiene", "calidadTecnica"];
			const iconoDL = iconos.califica;
			const iconoDB = iconos.graficos;
			const califUsuario = (await baseDatos.obtienePorCondicion("calRegistros", condicion, include)) || {};
			const {statusAlineado} = await procsFM.statusAlineado({entidad, prodRclv: prodComb});

			// Va a la vista
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, tituloVista, ayudasTitulo, origen},
				...{entidad, id, familia: "producto", status_id},
				...{registro: prodComb, interesDelUsuario},
				...{imgDerPers, tituloImgDerPers: prodComb.nombreCastellano},
				...{bloqueDer, atributosTitulo, califUsuario, statusAlineado},
				...{iconosMobile: true, iconoDL, iconoDB, redirige: true},
			});
		},
		guardar: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id: entidad_id, feValores_id, entretiene_id, calidadTecnica_id} = {...req.query, ...req.body};
			const usuario_id = req.session.usuario.id;
			let condicion;

			// Verifica errores
			const errores = valida.califica({feValores_id, entretiene_id, calidadTecnica_id});
			if (errores.hay) return res.redirect(req.originalUrl);

			// Obtiene el resultado
			const valores = {usuario_id, entidad, entidad_id, feValores_id, entretiene_id, calidadTecnica_id};
			let resultado = 0;
			for (const criterio of calCriterios) {
				const {atributo_id, atributo, ponderacion} = criterio;
				const ID = valores[atributo_id];
				const atributoCalif = atributosCalific[atributo].find((n) => n.id == ID);
				const valor = atributoCalif.valor;
				resultado += (valor * ponderacion) / 100;
			}
			valores.resultado = Math.round(resultado);

			// Averigua si existe la calificacion
			condicion = {usuario_id, entidad, entidad_id};
			const existe = await baseDatos.obtienePorCondicion("calRegistros", condicion);
			existe
				? await baseDatos.actualizaPorId("calRegistros", existe.id, valores)
				: await baseDatos.agregaRegistro("calRegistros", valores);

			// Actualiza las calificaciones del producto
			await procesos.actualizaCalifProd({entidad, entidad_id});

			// Actualiza la ppp
			condicion = {usuario_id, entidad, entidad_id};
			const interesDelUsuario = await baseDatos.obtienePorCondicion("pppRegistros", condicion);
			const novedades = {usuario_id, entidad, entidad_id, ppp_id: pppOpcsObj.yaLaVi.id};
			interesDelUsuario
				? await baseDatos.actualizaPorId("pppRegistros", interesDelUsuario.id, novedades)
				: await baseDatos.agregaRegistro("pppRegistros", novedades);

			// Fin
			return res.redirect(req.originalUrl);
		},
	},
	ordenaCaps: {
		form: async (req, res) => {
			// Variables
			const tema = "prodRud";
			const codigo = "ordenaCaps";
			const {id} = req.query;
			const origen = req.query.origen || "DT";
			const titulo = "Ordena Capítulos";

			// Obtiene la colección
			const entidad = "colecciones";
			const {usuario} = req.session;
			const usuario_id = usuario && usuario.id;
			let [coleccion, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id});
			coleccion = await procesos.obtieneColCaps.consolidado(coleccion, entidad, usuario_id);

			// Obtiene los capítulos
			const capitulos = await baseDatos
				.obtieneTodosPorCondicion("capitulos", {coleccion_id: id})
				.then((n) => comp.ordenaCaps(n));

			// Valores para la vista
			const registro = {...coleccion, ...edicion, id: coleccion.id, capitulos};
			const imgDerPers = procsFM.obtieneAvatar(coleccion, edicion).edic;
			const familia = "producto";

			// Fin
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, origen},
				...{registro, id, entidad, familia, imgDerPers},
			});
		},
		enConstruccion: (req, res) => {
			const informacion = {
				mensajes: ["Vista en construcción"],
				iconos: [variables.vistaEntendido(req.session.urlAnterior)],
				trabajando: true,
			};
			return res.render("CMP-0Estructura", {informacion});
		},
	},
};
