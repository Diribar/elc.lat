"use strict";
// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");
const procesos = require("./RCLV-FN-Procesos");
const valida = require("./RCLV-FN-Validar");

module.exports = {
	detalle: async (req, res) => {
		// Variables
		const tema = "rclvCrud";
		const codigo = "detalle";
		const {entidad} = comp.partesDelUrl(req);
		const {id} = req.query;
		let {prodsCons} = req.query;
		const origen = req.query.origen; // puede venir de mantenimiento
		const {usuario} = req.session;
		const usuario_id = usuario && usuario.id;
		const delLa = comp.obtieneDesdeEntidad.delLa(entidad);
		const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		let imgDerPers;

		// Obtiene el rclv 'Original' y 'Editado'
		const [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id});
		const rclvComb = {...original, ...edicion, id: original.id};

		// Obtiene los productos del rclv
		const prodsDelRclv = await procesos.prodsDelRclv.consolidado(entidad, rclvComb, usuario_id, prodsCons);

		// Actualiza 'prodsCons'
		prodsCons = !!prodsDelRclv.find((prod) => prod.fueraDeConsulta);

		// Ayuda para el titulo
		const ayudasTitulo =
			prodsDelRclv.length == 1
				? ["Es la única película que tenemos en nuestra base de datos."]
				: prodsDelRclv.length > 1
				? [
						"Son las películas que tenemos en nuestra base de datos.",
						"Están ordenadas desde la más reciente a la más antigua.",
				  ]
				: null;

		// Bloque de la derecha
		const bloqueDer = {
			rclv: procsFM.bloques.rclv({...rclvComb, entidad}),
			registro: await procsFM.bloques.registro({...rclvComb, entidad}),
		};

		// Imagen derecha
		if (req.query.hoyLocal) {
			const {hoyLocal} = req.query;
			const rutaNombre = path.join(carpImgsProp, "ImagenDerecha", hoyLocal + ".jpg");
			const existe = comp.gestionArchivos.existe(rutaNombre);
			if (existe) imgDerPers = "/imgsPropio/ImagenDerecha/" + hoyLocal + ".jpg";
		}
		if (!imgDerPers) imgDerPers = procsFM.obtieneAvatar(original, edicion).edic;

		// Datos para la vista
		const status_id = original.statusRegistro_id;
		const canonNombre = comp.canonNombre(rclvComb);
		const rclvNombre = rclvComb.nombre;
		const revisorPERL = usuario && usuario.rol.revisorPERL;
		const creadoPor_id = rclvComb.creadoPor_id;
		const tituloVista = "Detalle" + delLa + entidadNombre;
		const titulo = entidadNombre + " - " + canonNombre + " " + rclvComb.nombre;
		const iconoDL = iconos.prod;
		const iconoDB = iconos.rclv;
		const ea = comp.obtieneDesdeEntidad.ea(entidad);
		const {statusAlineado} = await procsFM.statusAlineado({entidad, prodRclv: rclvComb});

		// Ir a la vista
		return res.render("CMP-0Estructura", {
			...{tema, codigo, tituloVista, titulo, ayudasTitulo, origen, revisorPERL, usuario},
			...{entidad, entidadNombre, id, familia, status_id, creadoPor_id, registro: rclvComb, statusAlineado},
			...{imgDerPers, bloqueDer, prodsDelRclv, canonNombre, rclvNombre, ea, prodsCons},
			...{iconosMobile: true, iconoDL, iconoDB},
		});
	},
	altaEdic: {
		form: async (req, res) => {
			// Variables
			const {baseUrl, tarea, entidad} = comp.partesDelUrl(req);
			const tema = baseUrl == "/revision" ? "revisionEnts" : "rclvCrud";
			let codigo = tarea.slice(1);
			if (codigo == "alta") codigo += "/r"; // CRUD: 'agregar', 'edicion'; REVISIÓN: 'alta/r', 'solapamiento'
			const origen = req.query.origen || "DT"; // CRUD: DT, PDA, PED; REVISIÓN: TE

			// Más variables
			const {id, prodEnt, prodId} = req.query;
			const usuario_id = req.session.usuario.id;
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			const personajes = entidad == "personajes";
			const hechos = entidad == "hechos";
			const eventos = entidad == "eventos";
			const epocasDelAno = entidad == "epocasDelAno";
			let dataEntry = {};
			let apMars, edicId, bloqueDer;

			// Configura el título de la vista
			const delLa = comp.obtieneDesdeEntidad.delLa(entidad);
			const unaUn = comp.obtieneDesdeEntidad.unaUn(entidad);
			const titulo =
				(codigo == "agregar"
					? "Agregar" + unaUn
					: codigo == "edicion"
					? "Edición" + delLa
					: "Revisión del Alta" + delLa) + entidadNombre;

			// Variables específicas para personajes
			if (personajes)
				apMars = await baseDatos.obtieneTodosConOrden("hechos", "anoComienzo").then((n) => n.filter((m) => m.ama));

			// Pasos exclusivos para edición y revisión
			if (codigo != "agregar") {
				// Obtiene el original y edicion
				const [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id});
				edicId = edicion.id;

				// Actualiza el data entry de session
				dataEntry = {...original, ...edicion, id, edicId: edicion.id};
				const session = req.session[entidad] || req.cookies && req.cookies[entidad];
				if (session) {
					dataEntry = {...dataEntry, ...session};
					req.session[entidad] = null;
					res.clearCookie(entidad);
				}

				// Obtiene el día y el mes
				dataEntry = {...comp.fechaHora.fechaDelAno(dataEntry), ...dataEntry};

				// Datos Breves
				if (tema == "revisionEnts")
					bloqueDer = {
						registro: await procsFM.bloques.registro({...original, entidad}),
						usuario: await procsFM.bloques.usuario(original.statusSugeridoPor_id, entidad),
					};
			}

			// Tipo de fecha
			dataEntry.tipoFecha_id = procesos.altaEdicForm.tipoFecha_id(dataEntry, entidad);
			if (!dataEntry.prioridad_id) dataEntry.prioridad_id = procesos.altaEdicForm.prioridad_id(dataEntry, entidad);

			// Imagen Personalizada
			const imgDerPers = procsFM.obtieneAvatar(dataEntry).edic;

			// Info para la vista
			const statusCreado = tema == "revisionEnts" && dataEntry.statusRegistro_id == creado_id;
			const ent = personajes ? "Pers" : hechos ? "Hecho" : "";
			const originalUrl = req.originalUrl;
			const opcsHoyEstamos =
				dataEntry.genero_id && dataEntry.hoyEstamos_id
					? hoyEstamos.filter(
							(n) =>
								(n.entidad == entidad || !n.entidad) && // la entidad coincide o es universal
								(n.genero_id == dataEntry.genero_id || !n.genero_id) // el genero coincide o es universal
					  )
					: [];
			const opcsLeyNombre =
				dataEntry.nombre && dataEntry.leyNombre
					? procesos.altaEdicForm.opcsLeyNombre({...dataEntry, personajes, hechos})
					: [];
			const ayudas = procesos.altaEdicForm.ayudas(entidad);
			const statusAlineado = codigo == "alta/r";
			const cartelGenerico = codigo == "edicion";
			const cartelRechazo = tema == "revisionEnts";
			const anoMin = anoHoy - !!epocasDelAno;
			const carpsImagsEpocaDelAno = fs.readdirSync(path.join(carpImgsComp, "3-EpocasDelAno"));

			// Ir a la vista
			return res.render("CMP-0Estructura", {
				...{tema, codigo, origen, titulo},
				...{entidad, id, prodEnt, prodId, edicId, familia: "rclv", ent, familia},
				...{personajes, hechos, eventos, epocasDelAno, prioridadesRclv, carpsImagsEpocaDelAno},
				...{dataEntry, imgDerPers, statusCreado, bloqueDer, ayudas, anoMin},
				...{apMars, originalUrl, opcsHoyEstamos, opcsLeyNombre, statusAlineado},
				...{cartelGenerico, cartelRechazo, estrucPers: true},
			});
		},
		guardar: async (req, res) => {
			// Variables - puede venir de agregarProd, edicionProd, detalleRclv, revision
			const {tarea, entidad} = comp.partesDelUrl(req);
			const {id, prodEnt, prodId, eliminarEdic} = req.query;
			const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
			const origen = req.query.origen || "DT";
			const usuario_id = req.session.usuario.id;
			let errores;

			// Elimina los campos vacíos y pule los espacios innecesarios
			for (let prop in req.body)
				if (!req.body[prop]) delete req.body[prop];
				else if (typeof req.body[prop] == "string") req.body[prop] = req.body[prop].trim();

			// Obtiene los datos
			const datos = {entidad, ...req.body, ...req.query, imgOpcional: true};

			// Si recibimos un avatar, se completa la información
			if (req.file) {
				datos.avatar = req.file.filename;
				datos.tamano = req.file.size;
			}

			// Acciones si el usuario elimina la edición
			if (eliminarEdic) {
				// Variables
				const condicion = {[campo_id]: id, editadoPor_id: usuario_id};

				// Borra el eventual avatar guardado en la edicion y elimina la edición de la BD
				const edicion = await baseDatos.obtienePorCondicion("rclvEdics", condicion);
				if (edicion && edicion.avatar) comp.gestionArchivos.elimina(carpRclvs.revisar, edicion.avatar);
				if (edicion) await baseDatos.eliminaPorId("rclvEdics", edicion.id);

				// Actualiza el 'originalUrl'
				let posicion = req.originalUrl.indexOf("&edicId");
				const urlInicial = req.originalUrl.slice(0, posicion);
				let urlFinal = req.originalUrl.slice(posicion + 1);
				posicion = urlFinal.indexOf("&");
				urlFinal = posicion > 0 ? urlFinal.slice(posicion) : "";
				req.originalUrl = urlInicial + urlFinal;
				req.originalUrl = req.originalUrl.replace("&eliminarEdic=true", "");
			}
			// Averigua si hay errores de validación
			else errores = await valida.consolidado(datos);

			// Acciones si hay errores o se eliminó la edición
			if (eliminarEdic || (errores && errores.hay)) {
				if (errores && errores.hay) {
					// Guarda session y cookie
					const session = {...req.body};
					req.session[entidad] = session;
					res.cookie(entidad, session, {maxAge: unDia});
				}
				// Si se agregó un archivo avatar, lo elimina
				if (req.file) comp.gestionArchivos.elimina(carpProvisorio, datos.avatar);

				// Redirige a la vista 'form'
				return res.redirect(req.originalUrl);
			}

			// Obtiene el dataEntry y guarda los cambios
			const DE = procesos.altaEdicGuardar.procesaLosDatos(datos);
			const {original, edicion, edicN} = await procesos.altaEdicGuardar.guardaLosCambios(req, res, DE);

			// Acciones si se agregó un registro 'rclv'
			if (tarea == "/agregar") {
				// Si el origen es "Datos Adicionales", actualiza su session y cookie
				if (origen == "PDA") {
					req.session.datosAdics = {...req.session.datosAdics, [campo_id]: original.id};
					res.cookie("datosAdics", req.session.datosAdics, {maxAge: unDia});
				}
				// Si el origen es "Edición de Producto", crea o actualiza la edición
				if (origen == "PED") {
					// Obtiene el registro original del producto, y su edición ya creada (si existe)
					const params = {entidad: prodEnt, entId: prodId, usuario_id, excluirInclude: true};
					let [prodOrig, prodEdic] = await procsFM.obtieneOriginalEdicion(params);

					// Actualiza la edición
					prodEdic = {...prodEdic, [campo_id]: original.id};

					// Crea o actualiza la edición
					await procsFM.guardaActEdic({entidad: prodEnt, original: prodOrig, edicion: prodEdic, usuario_id});
				}
			}

			// Acciones si recibimos un avatar
			if (req.file) {
				// Lo mueve de 'Provisorio' a 'Revisar'
				comp.gestionArchivos.mueveImagen(DE.avatar, carpProvisorio, carpRclvs.revisar);

				// Elimina el eventual anterior
				if (tarea == "/edicion") {
					// Si es un registro propio y en status creado, borra el eventual avatar original
					if (original.creadoPor_id == usuario_id && original.statusRegistro_id == creado_id) {
						if (original.avatar) comp.gestionArchivos.elimina(carpRclvs.revisar, original.avatar);
					}
					// Si no está en status 'creado', borra el eventual avatar_edicion anterior
					else if (edicion && edicion.avatar) comp.gestionArchivos.elimina(carpRclvs.revisar, edicion.avatar);
				}
			}

			// Si corresponde, actualiza el solapamiento
			if (entidad == "epocasDelAno" && !edicion && !edicN) comp.actualizaSolapam(); // no hace falta el await, porque no se usa en la vista

			// Obtiene el url de la siguiente instancia
			let destino = "/" + entidad + "/inactivar-captura/?id=" + (id ? id : 1) + "&origen=" + origen;
			if (origen == "PED") destino += "&prodEnt=" + prodEnt + "&prodId=" + prodId;

			// Redirecciona a la siguiente instancia
			return res.redirect(destino);
		},
	},
	prodsPorReg: async (req, res) => {
		// Variables
		const entidad = comp.obtieneEntidadDesdeUrl(req);
		const condicion = {id: {[Op.ne]: 1}};
		const include = [...variables.entidades.prods, "prodEdics"];
		const registros = {};
		const resultado = {};

		// Lectura
		await baseDatos
			.obtieneTodosPorCondicion(entidad, condicion, include)
			// Averigua la cantidad de includes por registro rclv
			.then((regs) => {
				for (let reg of regs) {
					registros[reg.nombre] = 0;
					for (let entInclude of include) registros[reg.nombre] += reg[entInclude].length;
				}
			})
			// Ordena los registros por su cantidad de productos, en orden descendente
			.then(() => {
				// Ordena los métodos según la cantidad de productos
				const metodos = Object.keys(registros);
				metodos.sort((a, b) =>
					registros[b] != registros[a]
						? registros[b] - registros[a] // por cantidad de productos
						: a < b // por orden alfabético
						? -1
						: 1
				);

				// Crea un objeto nuevo, con los métodos ordenados
				for (let metodo of metodos) resultado[metodo] = registros[metodo];
			});

		// Fin
		return res.send(resultado);
	},
};
