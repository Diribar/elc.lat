"use strict";
// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");
const validaFM = require("../2.0-Familias/FM-FN-Validar");
const procsProd = require("../2.1-Prods-RUD/PR-FN-Procesos");
const procsRclv = require("../2.2-RCLVs/RCLV-FN-Procesos");
const validaRclv = require("../2.2-RCLVs/RCLV-FN-Validar");
const procsLinks = require("../2.3-Links/LK-FN-Procesos");
const procesos = require("./RE-Procesos");

module.exports = {
	// Tablero
	tableroControl: async (req, res) => {
		// Variables
		const tema = "revisionEnts";
		const codigo = "tableroControl";
		const revId = req.session.usuario.id;

		// Productos y Rclvs
		let prodsRclvs = procesos.tablRev.obtieneProdsRclvs(); // Correcciones de Status

		// Productos y Ediciones
		let prods1 = procesos.tablRev.obtieneProds1(revId); // Altas y Ediciones
		let prods2 = procesos.tablRev.obtieneProds2(revId); // Pendientes de aprobar sinEdición,
		let prods3 = procesos.tablRev.obtieneProds3(); // películas y colecciones repetidas

		// Rclvs
		let rclvs1 = procesos.tablRev.obtieneRclvs1(revId);
		let rclvs2 = procesos.tablRev.obtieneRclvs2(revId);

		// Links
		let sigProd = procesos.obtieneSigProd({revId});

		// Espera a que se actualicen todos los resultados
		let datos = [prods1, prods2, prods3, rclvs1, rclvs2, sigProd];
		[prods1, prods2, prods3, rclvs1, rclvs2, sigProd] = await Promise.all(datos);
		let prods = {...prods1, ...prods2, ...prods3};
		let rclvs = {...rclvs1, ...rclvs2};

		// Consolida las altas de productos
		let AL = [...prods1.AL_conEdicion, ...prods2.AL_sinEdicion];
		delete prods1.AL_conEdicion;
		delete prods2.AL_sinEdicion;
		AL.sort((a, b) => b.fechaRef - a.fechaRef);
		prods.AL = AL;

		// Consolida y procesa los productos y rclvs
		prodsRclvs = procesos.tablRev.procesaProdsRclvs(prodsRclvs);
		prods = procesos.tablRev.procesaProds(prods);
		rclvs = procesos.tablRev.procesaRclvs(rclvs);

		// Obtiene información para la vista
		const dataEntry = req.session.tableros && req.session.tableros.entidades ? req.session.tableros.entidades : {};
		const mostrarRclvs = Object.values(rclvs).reduce((acum, i) => acum + i.length, 0);

		// Va a la vista
		// return res.send(prods);
		return res.render("CMP-0Estructura", {
			...{tema, codigo, titulo: "Tablero de Revisión"},
			...{prodsRclvs, prods, rclvs, sigProd, dataEntry, mostrarRclvs},
		});
	},

	// Revisión de registros
	form: {
		altaProd: async (req, res) => {
			// Variables
			const tema = "revisionEnts";
			const codigo = "alta/p";
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id} = req.query;
			const origen = req.query.origen || "TE"; // puede venir de Detalle
			const familia = comp.obtieneDesdeEntidad.familia(entidad);

			// Obtiene el registro original
			let include = [...comp.obtieneTodosLosCamposInclude(entidad)];
			include.push("statusRegistro", "creadoPor", "statusSugeridoPor");
			if (entidad == "colecciones") include.push("capitulos");
			if (entidad == "capitulos") include.push("coleccion");
			const original = await baseDatos.obtienePorId(entidad, id, include);

			// Obtiene avatar original
			let imgDerPers = original.avatar;
			imgDerPers = imgDerPers
				? (!imgDerPers.includes("/") ? "/imgsPropio/1-Productos/Revisar/" : "") + imgDerPers
				: "/imgsPropio/Avatar/Prod-Generico.jpg";

			// Configura el título de la vista
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
			const titulo = "Revisar el Alta de" + (entidad == "capitulos" ? "l " : " la ") + entidadNombre;
			// Ayuda para el titulo
			const ayudasTitulo = [
				"Necesitamos que nos digas si estás de acuerdo en que está alineado con nuestro perfil.",
				"Si considerás que no, te vamos a pedir que nos digas el motivo.",
			];

			// Info para el bloque Izquierdo
			const {infoGral, actores} = procsProd.bloqueIzq(original);
			const bloqueIzq = {infoGral, actores};

			// Bloque Derecho
			const bloqueDer = {
				registro: await procsFM.bloques.registro({...original, entidad}),
				usuario: await procsFM.bloques.usuario(original.statusSugeridoPor_id, entidad),
			};

			// Info para la vista
			const statusRegistro_id = original.statusRegistro_id;
			const statusCreado = statusRegistro_id == creado_id;
			const statusLink_id = [creado_id, aprobado_id, recuperar_id];
			const links = await procsProd.obtieneLinksDelProducto({entidad, id, statusLink_id, origen: "RA"});
			const status_id = statusRegistro_id;
			const asocs = variables.entidades.rclvAsocs;
			const datosProvs = comp.datosProvs(original);

			// Va a la vista
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, ayudasTitulo, origen},
				...{entidad, id, familia, status_id, statusCreado},
				...{entidadNombre, registro: original, links},
				...{imgDerPers, tituloImgDerPers: original.nombreCastellano},
				...{bloqueIzq, bloqueDer, rclvs: [], asocs, datosProvs},
				...{urlActual: req.session.urlActual, cartelRechazo: true},
			});
		},
		edicion: async (req, res) => {
			// Tema y Código
			const tema = "revisionEnts";
			const {tarea} = comp.partesDelUrl(req);
			let codigo = tarea.slice(1); // No se puede poner 'const', porque puede cambiar a 'edicion/avatar'

			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, edicId} = req.query;
			const origen = req.query.origen || "TE"; // puede venir de Detalle
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			const entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
			const delLa = comp.obtieneDesdeEntidad.delLa(entidad);
			const titulo = "Revisión de la Edición" + delLa + entidadNombre;

			// Obtiene el producto 'Original' y 'Editado'
			const usuario_id = await baseDatos.obtienePorId(entEdic, edicId).then((n) => n.editadoPor_id);
			let [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id});
			original = await procsProd.obtieneColCaps.consolidado(original, entidad, usuario_id);

			// Acciones si el avatar está presente en la edición
			if (edicion.avatar) {
				// Reemplazo automático
				const reempAutom = await procesos.edicForm.reemplAvatarAutom({entidad, original, edicion});
				if (reempAutom) return res.redirect(req.originalUrl); // Recarga la ruta

				// Reemplazo manual
				const reempManual = procesos.edicForm.reemplAvatarManual({codigo, titulo, original, edicion});
				return res.render("CMP-0Estructura", {
					...{tema, origen, entidad, id, familia, entidadNombre, urlActual: req.session.urlActual},
					...reempManual,
				});
			}

			// Acciones si existe el campo 'avatarUrl' en la edición y no existía el campo 'avatar'
			if (edicion.avatarUrl) {
				await baseDatos.actualizaPorId(entEdic, edicId, {avatarUrl: null}); // Actualiza el registro 'edición'
				return res.redirect(req.originalUrl);
			}

			// Si el avatar original es un url, descarga el archivo y actualiza el registro 'original'
			if (original.avatar && original.avatar.includes("/") && entidad != "capitulos")
				procesos.descargaAvatarOriginal(original, entidad);

			// Más variables
			const canonNombre = familia == "rclv" ? comp.canonNombre(original) : null;
			const bloqueDer = {
				registro: await procsFM.bloques.registro({...original, entidad}),
				usuario: await procsFM.bloques.usuario(usuario_id),
			};
			const imgDerPers = procsFM.obtieneAvatar(original).orig;
			const motivos = edicsMotivos.filter((m) => m.prods);

			// Obtiene los ingresos y reemplazos
			const [ingresos, reemplazos] = await procesos.edicForm.ingrReempl(original, edicion);

			// Variables para la vista
			const datosProvs = comp.datosProvs(original);
			const ayudasTitulo = [
				"Necesitamos que nos digas si estás de acuerdo con la información editada.",
				"Si considerás que no, te vamos a pedir que nos digas el motivo.",
			];

			// Va a la vista
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, ayudasTitulo, origen}, //title: original.nombreCastellano,
				...{entidad, id, familia, registro: original, prodOrig: original, prodEdic: edicion},
				...{canonNombre, entidadNombre, imgDerPers, datosProvs},
				...{ingresos, reemplazos, motivos, bloqueDer, urlActual: req.session.urlActual},
				...{cartelGenerico: true},
			});
		},
		links: async (req, res) => {
			// Variables
			const tema = "revisionEnts";
			const codigo = "abmLinks";
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id} = req.query;
			const revId = req.session.usuario.id;
			const origen = "TE";

			// Configura el título
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
			const titulo = "Revisar los Links de" + (entidad == "capitulos" ? "l " : " la ") + entidadNombre;

			// Obtiene el prodOrig con sus links originales para verificar que los tenga
			let [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id: revId});
			original = await procsProd.obtieneColCaps.consolidado(original, entidad, revId);
			const producto = {...original, ...edicion, id: original.id};

			// Obtiene todos los links
			const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
			const include = ["statusRegistro", "ediciones", "prov", "tipo", "motivo"];
			const links = await baseDatos.obtieneTodosPorCondicion("links", {[campo_id]: id}, include);
			links.sort((a, b) => a.tipo_id - b.tipo_id);
			for (let link of links) {
				if (!link.prov.embededAgregar || !link.gratuito) link.href = "//" + link.url;
				link.cond = procsLinks.condicion(link, revId, tema);
				link.idioma = link.castellano ? "enCast" : link.subtitulos ? "subtCast" : "otroIdioma";
			}
			producto.links = links;

			// Errores del producto a verificar
			const informacion = procesos.prodSinLinks(producto, req.session.urlAnterior);
			if (informacion) return res.render("CMP-0Estructura", {informacion});

			// Información para la vista
			const avatar = producto.avatar
				? (!producto.avatar.includes("/") ? "/imgsPropio/1-Productos/Final/" : "") + producto.avatar
				: "/imgsPropio/Avatar/Prod-Generico.jpg";
			const motivos = statusMotivos.filter((n) => n.links).map((n) => ({id: n.id, descripcion: n.descripcion}));
			const camposARevisar = variables.camposRevisar.links.map((n) => n.nombre);
			const imgDerPers = procsFM.obtieneAvatar(producto).orig;
			const ayudasTitulo = ["Sé muy cuidadoso de aprobar sólo links que respeten los derechos de autor"];
			const interesDelUsuario = await procsProd.obtieneInteresDelUsuario({usuario_id: revId, entidad, entidad_id: id});

			// Va a la vista
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, ayudasTitulo, origen},
				...{entidad, id, registro: producto, prodOrig: producto, avatar, usuario_id: revId, familia: "producto"},
				...{links, linksProvs, linksTipos, motivos},
				...{camposARevisar, calidadesDeLink, interesDelUsuario},
				...{imgDerPers, cartelGenerico: true},
			});
		},
		cambiarMotivo: async (req, res) => {
			// Variables
			const tema = "fmCrud";
			const codigo = "cambiarMotivo";
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, origen, prodRclv, ultHist} = {...req.query, ...req.body};
			const petitFams = comp.obtieneDesdeEntidad.petitFams(entidad);
			const titulo = "Cambiar el Motivo";

			// Datos para la vista
			const motivo = ultHist.motivo_id ? statusMotivos.find((n) => n.id == ultHist.motivo_id) : null;
			const motivos = statusMotivos.filter((n) => n[petitFams]);
			const entidades = variables.entidades[petitFams];
			const entsNombre = variables.entidades[petitFams + "Nombre"];
			const imgDerPers = procsFM.obtieneAvatar(prodRclv).orig;
			const familia = comp.obtieneDesdeEntidad.familia(entidad);

			// Envía la info a la vista
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, origen},
				...{familia, entidad, id, registro: prodRclv, motivo, ultHist, imgDerPers},
				...{entidades, entsNombre, motivos},
				cartelGenerico: true,
			});
		},
		unificarStatus: async (req, res) => {
			// Variables
			const tema = "fmCrud";
			const codigo = "corregirStatus";
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const esLink = entidad == "links";
			const titulo = "Corregir el Status";
			const {id, prodRclv: registro} = {...req.query, ...req.body};
			const origen = "TE";

			// Obtiene el historial
			const historialStatus = await procsFM.historialDeStatus.obtiene({entidad, ...registro});

			// Datos para la vista
			const imgDerPers = esLink ? "/imgsPropio/Varios/Link.jpg" : procsFM.obtieneAvatar(registro).orig;
			const familia = comp.obtieneDesdeEntidad.familia(entidad);

			// Producto o Rclv
			if (esLink) {
				const prodEnt = comp.obtieneDesdeCampo_id.prodEnt(registro);
				const prodCampo_id = comp.obtieneDesdeCampo_id.prodCampo_id(registro);
				const prodId = registro[prodCampo_id];
				const producto = await baseDatos.obtienePorId(prodEnt, prodId);
				registro.nombreCastellano = "Link - " + producto.nombreCastellano;
			}

			// Fin
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, origen},
				...{entidad, id, registro, imgDerPers},
				...{historialStatus, familia},
				cartelGenerico: true,
			});
		},
		regSinHistorial: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, prodRclv: registro} = {...req.query, ...req.body};
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);
			const producto = familia == "producto";

			// Obtiene el status del registro
			const statusRegistro_id =
				entidad == "capitulos"
					? registro.statusColeccion_id
					: producto && (await validaFM.consolidado({datos: registro}).then((n) => n.hay))
					? creadoAprob_id
					: aprobado_id;

			// Obtiene los demás datos
			const datos = {
				statusRegistro_id,
				statusSugeridoPor_id: registro.statusSugeridoPor_id || usAutom_id,
				statusSugeridoEn: registro.statusFinalEn || new Date(),
				altaRevisadaEn: registro.altaRevisadaEn || new Date(),
			};
			if (statusRegistro_id != creadoAprob_id && familia == "producto" && !registro.altaTermEn)
				datos.altaTermEn = new Date();

			// CONSECUENCIAS SIEMPRE - Actualiza el registro en la BD --> es crítico el uso del 'await'
			await baseDatos.actualizaPorId(entidad, id, datos);

			// CONSECUENCIAS SI ES PRODUCTO - Impacto en tabla 'azar'
			if (producto && aprobados_ids.includes(statusRegistro_id)) {
				// Variables
				const azar = comp.azar();
				const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
				const datos = {[campo_id]: id, azar};
				if (entidad != "peliculas") datos.grupoCol_id = registro.coleccion_id || id;

				// Agrega o actualiza un registro con el campo 'azar'
				baseDatos.agregaActualizaPorCondicion("prodsAzar", {[campo_id]: id}, datos);
			}

			// CONSECUENCIAS SI ES PRODUCTO - Impactos en rclvs y links --> debe estar después de que se grabó el registro
			if (producto) await procsFM.accsEnDepsPorCambioDeStatus(entidad, {...registro, statusRegistro_id});

			// CONSECUENCIAS SI NO ES CAPÍTULO - Si el avatar de un "no capítulo" es un url, descarga el archivo y actualiza el registro
			if (entidad != "capitulos" && statusRegistro_id == aprobado_id && registro.avatar && registro.avatar.includes("/"))
				procesos.descargaAvatarOriginal(registro, entidad);

			// CONSECUENCIAS SI ES COLECCIONES - Impacto en capitulos y links
			if (entidad == "colecciones") {
				// 1. Actualiza el status de los capítulos
				statusRegistro_id == aprobado_id
					? await procsProd.cambioDeStatusCaps(id)
					: await baseDatos.actualizaPorCondicion(
							"capitulos",
							{coleccion_id: id},
							{...datos, statusColeccion_id: statusRegistro_id, statusSugeridoPor_id: usAutom_id}
					  );

				// 2. Actualiza el campo 'prodAprob' en los links de sus capítulos
				procesos.cambioStatus.actualizaProdAprobEnLink(id, statusRegistro_id);

				// 3. Si la colección fue aprobada, actualiza sus status de links
				if (aprobados_ids.includes(statusRegistro_id)) {
					// Si no existe su registro 'capsSinLink', lo agrega
					if (!(await baseDatos.obtienePorCondicion("capsSinLink", {coleccion_id: id})))
						await baseDatos.agregaRegistro("capsSinLink", {coleccion_id: id});

					// Actualiza su link
					comp.actualizaCalidadDeLinkEnCol(id);
				}
			}

			// CONSECUENCIAS SI ES CAPÍTULOS - Impacto en links de su colección
			if (entidad == "capitulos") comp.actualizaCalidadDeLinkEnCol(registro.coleccion_id);

			// CONSECUENCIAS SI ES 'EPOCAS DEL AÑO' Y ESTÁ APROBADO - Impactos en sí mismo
			if (entidad == "epocasDelAno" && statusRegistro_id == aprobado_id) {
				// Si tiene imagen, la copia en su carpeta
				if (original.avatar) {
					const {carpetaAvatars} = req.body;
					const rutaNombreOrigen = path.join(carpRclvs.final, original.avatar);
					const rutaNombreDestino = path.join(carpImgsComp, "3-EpocasDelAno", carpetaAvatars, original.avatar);
					comp.gestionArchivos.copiaImagen(rutaNombreOrigen, rutaNombreDestino);
				}
				// Actualiza el solapamiento
				comp.actualizaSolapam();
			}

			// CONSECUENCIAS SIEMPRE - Impacto en la variable 'statusErrores' - Debe estar posterior a 'statusHistorial'
			statusErrores = statusErrores.filter((n) => !n.SH || n.entidad_id != id || n.entidad != entidad);
			comp.actualizaStatusErrores.consolidado();

			// Opciones de redireccionamiento
			const destino = "/" + entidad + "/inactivar/" + siglaFam + "/?id=" + id + "&origen=TE"; // Inactivar

			// Fin
			return res.redirect(destino);
		},
	},
	guardar: {
		cambioStatus: async (req, res) => {
			// Variables
			let datos = await procesos.cambioStatus.obtieneDatos(req);
			const {entidad, id, original, statusOriginal_id, statusFinal_id} = datos;
			const {codigo, producto, rclv, motivo_id, comentario, aprobado} = datos;
			const {idOrigen, revId, ahora, revisorPERL, petitFams, usuario_id, campoDecision} = datos;
			const nuevoAvatar = req.file && req.file.filename;
			datos = {}; // limpia la variable 'datos'
			let penalizac;

			// DATOS - sólo si es un alta de rclv y validación de error
			if (rclv && codigo == "alta") {
				// Obtiene los datos
				datos = {entidad, ...req.body, ...req.query, revisorPERL, imgOpcional: true};
				if (req.file) datos.avatar = nuevoAvatar;
				if (req.file) datos.tamano = req.file.size;

				// Averigua si hay errores de validación y toma acciones
				const errores = await validaRclv.consolidado(datos);
				if (errores.hay) {
					// Si se agregó un archivo avatar, lo elimina
					if (req.file) comp.gestionArchivos.elimina(carpProvisorio, nuevoAvatar);

					// Guarda session y cookie
					delete datos.avatar;
					delete datos.tamano;
					req.session[entidad] = datos;
					res.cookie(entidad, datos, {maxAge: unDia});

					// Fin
					return res.redirect(req.originalUrl);
				}

				// Limpia la variable 'datos' con el Data Entry procesado
				datos.avatar = nuevoAvatar || original.avatar;
				datos = procsRclv.altaEdicGuardar.procesaLosDatos(datos);
			}

			// DATOS - se necesitan con seguridad
			datos = {
				...datos,
				statusRegistro_id: statusFinal_id,
				statusSugeridoPor_id: revId,
				statusSugeridoEn: ahora,
			};
			if (motivo_id) datos.motivo_id = motivo_id;
			if (!original.altaRevisadaEn) datos.altaRevisadaEn = ahora;
			if (!original.altaRevisadaPor_id) datos.altaRevisadaPor_id = revId;
			if (rclv && !original.leadTimeCreacion)
				datos.leadTimeCreacion = comp.obtieneLeadTime(original.creadoEn, datos.altaRevisadaEn);

			// CONSECUENCIAS SIEMPRE - Si existen, elimina session y cookies
			if (req.session[entidad]) delete req.session[entidad];
			if (req.cookies[entidad]) res.clearCookie(entidad);

			// CONSECUENCIAS SIEMPRE - Actualiza el registro original --> es crítico el uso del 'await'
			await baseDatos.actualizaPorId(entidad, id, datos);

			// CONSECUENCIAS SI ES PRODUCTO
			if (producto) {
				// Impacto en tabla 'azar'
				if (aprobados_ids.includes(statusFinal_id)) {
					// Variables
					const azar = comp.azar();
					const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
					const datos = {[campo_id]: id, azar};
					if (entidad != "peliculas") datos.grupoCol_id = entidad == "colecciones" ? id : original.coleccion_id;

					// Agrega o actualiza un registro con el campo 'azar'
					baseDatos.agregaActualizaPorCondicion("prodsAzar", {[campo_id]: id}, datos);
				}

				// Impactos en rclvs y links --> debe estar después de que se grabó el original
				await procsFM.accsEnDepsPorCambioDeStatus(entidad, {...original, statusRegistro_id: statusFinal_id});

				// Si se aprobó un 'recuperar' y el avatar es un url, descarga el archivo y actualiza el registro 'original'
				const corresponde = codigo == "recuperar" && aprobado && original.avatar && original.avatar.includes("/");
				if (["peliculas", "colecciones"].includes(entidad) && corresponde)
					procesos.descargaAvatarOriginal(original, entidad);

				// Impacto en capitulos y links
				if (entidad == "colecciones") {
					// 1. Actualiza el status de los capítulos
					statusFinal_id == aprobado_id
						? await procsProd.cambioDeStatusCaps(id)
						: await baseDatos.actualizaPorCondicion(
								"capitulos",
								{coleccion_id: id},
								{...datos, statusColeccion_id: statusFinal_id, statusSugeridoPor_id: usAutom_id}
						  );

					// 2. Actualiza el campo 'prodAprob' en los links de sus capítulos
					procesos.cambioStatus.actualizaProdAprobEnLink(id, statusFinal_id);

					// 3. Si la colección fue aprobada, actualiza sus status de links
					if (aprobados_ids.includes(statusFinal_id)) {
						// Si no existe su registro 'capsSinLink', lo agrega
						if (!(await baseDatos.obtienePorCondicion("capsSinLink", {coleccion_id: id})))
							await baseDatos.agregaRegistro("capsSinLink", {coleccion_id: id});

						// Actualiza su link
						comp.actualizaCalidadDeLinkEnCol(id);
					}
				}

				// Impacto en links de su colección
				if (entidad == "capitulos") comp.actualizaCalidadDeLinkEnCol(original.coleccion_id);
			}

			// CONSECUENCIAS SI ES RCLV
			if (rclv) {
				// Avatar
				procesos.cambioStatus.avatarRclv(req.file, original);

				// Impactos en 'productos'
				if (statusFinal_id == inactivo_id) {
					// Borra el vínculo en las ediciones de producto y las elimina si quedan vacías
					procsFM.elimina.vinculoEdicsProds({rclvEnt: entidad, rclvID: id});

					// Sus productos asociados dejan de estar vinculados y si no pasan el control de error y estaban aprobados, pasan al status 'creadoAprob'
					await procesos.cambioStatus.prodsAsocs(entidad, id);
				}

				// Impacto en 'edicsHistorial' y 'usuario'
				if (codigo == "alta") procesos.cambioStatus.edicRclvAprobRech(entidad, original, revId);

				// Impactos en sí mismo
				if (entidad == "epocasDelAno") {
					// Si es un alta y tiene imagen, la copia en su carpeta
					const algunAvatar = nuevoAvatar || original.avatar;
					if (codigo == "alta" && algunAvatar) {
						const {carpetaAvatars} = req.body;
						const rutaNombreOrigen = path.join(carpRclvs.final, algunAvatar);
						const rutaNombreDestino = path.join(carpImgsComp, "3-EpocasDelAno", carpetaAvatars, algunAvatar);
						comp.gestionArchivos.copiaImagen(rutaNombreOrigen, rutaNombreDestino);
					}
					// Si es un aprobado, actualiza el solapamiento
					if (statusFinal_id == aprobado_id) comp.actualizaSolapam();
				}
			}

			// CONSECUENCIAS SIEMPRE - Impacto en 'statusHistorial'
			if (true) {
				// Elimina el registro con statusFinal 'inactivar_id' o 'recuperar_id'
				const condicion = {entidad, entidad_id: id, statusFinal_id: [inactivar_id, recuperar_id]};
				baseDatos.eliminaPorCondicion("statusHistorial", condicion);

				// Agrega un registro
				const datosHist = {
					...{entidad, entidad_id: id, aprobado}, // entidad
					...{statusOriginalPor_id: usuario_id, statusFinalPor_id: revId}, // personas
					...{statusOriginal_id: statusOriginal_id, statusFinal_id}, // status
					...{statusOriginalEn: original.statusSugeridoEn}, // fecha
					...{motivo_id, comentario},
				};
				const motivo = motivo_id && statusMotivos.find((n) => n.id == motivo_id);
				if (motivo && motivo.penalizac) {
					penalizac = Number(motivo.penalizac);
					datosHist.penalizac = penalizac; // Agrega una 'duración' sólo si el usuario intentó un status "aprobado"
				}
				await baseDatos.agregaRegistro("statusHistorial", datosHist); // es crítico el uso del await, para actualizar la variable 'statusErrores'

				// Impacto en la variable 'statusErrores' - Debe estar posterior a 'statusHistorial'
				if (inacRecup_ids.includes(statusOriginal_id)) await comp.actualizaStatusErrores.consolidado();

				// Aumenta el valor de aprob/rech en el registro del usuario, en el campo 'original'
				baseDatos.variaElValorDeUnCampo("usuarios", usuario_id, campoDecision);

				// Lo penaliza si corresponde
				if (penalizac) comp.penalizacAcum(usuario_id, motivo, petitFams);
			}

			// Opciones de redireccionamiento
			const destino =
				producto && codigo == "alta"
					? "/revision/edicion/" + entidad + idOrigen // producto creado y aprobado
					: "/" + entidad + "/inactivar-captura" + idOrigen; // otros casos con origen

			// Fin
			return res.redirect(destino);
		},
		avatar: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, edicId, rechazar, motivo_id} = {...req.query, ...req.body};
			const entEdic = comp.obtieneDesdeEntidad.entEdic(entidad);
			const revId = req.session.usuario.id;
			const original = await baseDatos.obtienePorId(entidad, id);
			const campo = "avatar";
			const aprob = !rechazar;
			let edicion = await baseDatos.obtienePorId(entEdic, edicId);
			const originalGuardado = aprob ? {...original, [campo]: edicion[campo]} : {...original};

			// 1. PROCESOS PARTICULARES PARA AVATAR
			await procesos.procsParticsAvatar({entidad, original, edicion, aprob});
			if (entEdic == "prodEdics") delete edicion.avatarUrl;

			// 2. PROCESOS COMUNES A TODOS LOS CAMPOS
			edicion = await procesos.edicAprobRech({
				...{entidad, original, originalGuardado},
				...{edicion, revId, campo, aprob, motivo_id},
			});

			// 3. Acciones si se terminó de revisar la edición de un producto
			if (!edicion && entEdic == "prodEdics")
				await procsProd.accionesPorCambioDeStatus({entidad, registro: originalGuardado});

			// Fin
			if (edicion) return res.redirect(req.originalUrl);
			else return res.redirect("/revision/tablero");
		},
		solapam: async (req, res) => {
			// Variables
			const {entidad, id} = req.query;
			const revId = req.session.usuario.id;
			const ahora = comp.fechaHora.ahora();
			let datos = {...req.body, entidad}; // la 'entidad' hace falta para una función posterior

			// Averigua si hay errores de validación y toma acciones
			const errores = await validaRclv.fecha(datos);
			if (errores) {
				// Guarda session y cookie
				req.session.epocasDelAno = datos;
				res.cookie("epocasDelAno", datos, {maxAge: unDia});

				// Fin
				return res.redirect(req.originalUrl);
			}

			// Procesa los datos del Data Entry
			datos = procsRclv.altaEdicGuardar.procesaLosDatos(datos);
			for (let prop in datos) if (datos[prop] === null) delete datos[prop];

			// Actualiza el registro original
			datos = {...datos, editadoPor_id: revId, editadoEn: ahora};
			await baseDatos.actualizaPorId("epocasDelAno", id, datos);

			// Actualiza el solapamiento
			comp.actualizaSolapam(); // no hace falta el await, porque no se usa en la vista

			// Fin
			return res.redirect("/revision/tablero");
		},
		cambiarMotivo: async (req, res) => {
			// Variables
			const {siglaFam, entidad} = comp.partesDelUrl(req);
			const {id, motivo_id, entDupl, idDupl, ultHist, origen} = {...req.query, ...req.body};
			const {statusFinal_id} = ultHist;

			// Genera el comentario
			let {comentario} = req.body;
			comentario = await procsFM.comentario({entidad, id, motivo_id, comentario, entDupl, idDupl, statusFinal_id});

			// Actualiza el motivo en el último registro del historial
			await baseDatos.actualizaPorId("statusHistorial", ultHist.id, {motivo_id, comentario});

			// Genera la 'cola'
			let cola = "/?id=" + id;
			if (origen) cola += "&origen=" + origen;

			// Fin
			return res.redirect("/" + entidad + "/historial/" + siglaFam + cola);
		},
		unificarStatus: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {id, ultHist, prodRclv: registro, opcion} = {...req.query, ...req.body};
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);
			const producto = familia == "producto";
			const rclv = familia == "rclv";

			// Obtiene los datos para cambiar el registro prodRclv
			const {statusFinal_id: statusRegistro_id} = ultHist;
			const datos = {
				statusRegistro_id,
				statusSugeridoPor_id: ultHist.statusFinalPor_id,
				statusSugeridoEn: ultHist.statusFinalEn,
				altaRevisadaEn: registro.altaRevisadaEn || ultHist.statusFinalEn,
			};
			if (producto && statusRegistro_id != creadoAprob_id && !registro.altaTermEn) datos.altaTermEn = datos.altaRevisadaEn;

			// CONSECUENCIAS SIEMPRE - Actualiza el registro en la BD --> es crítico el uso del 'await'
			await baseDatos.actualizaPorId(entidad, id, datos);

			// CONSECUENCIAS SI ES PRODUCTO
			if (producto) {
				// Impacto en tabla 'azar'
				if (aprobados_ids.includes(statusRegistro_id)) {
					// Variables
					const azar = comp.azar();
					const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);
					const datos = {[campo_id]: id, azar};
					if (entidad != "peliculas") datos.grupoCol_id = registro.coleccion_id || id;

					// Agrega o actualiza un registro con el campo 'azar'
					baseDatos.agregaActualizaPorCondicion("prodsAzar", {[campo_id]: id}, datos);
				}

				// Impactos en rclvs y links --> debe estar después de que se grabó el registro
				await procsFM.accsEnDepsPorCambioDeStatus(entidad, {...registro, statusRegistro_id});

				// COLECCIONES - Impacto en capitulos y links
				if (entidad == "colecciones") {
					// 1. Actualiza el status de los capítulos
					statusRegistro_id == aprobado_id
						? await procsProd.cambioDeStatusCaps(id)
						: await baseDatos.actualizaPorCondicion(
								"capitulos",
								{coleccion_id: id},
								{...datos, statusColeccion_id: statusRegistro_id, statusSugeridoPor_id: usAutom_id}
						  );

					// 2. Actualiza el campo 'prodAprob' en los links de sus capítulos
					procesos.cambioStatus.actualizaProdAprobEnLink(id, statusRegistro_id);

					// 3. Si la colección fue aprobada, actualiza sus status de links
					if (aprobados_ids.includes(statusRegistro_id)) {
						// Si no existe su registro 'capsSinLink', lo agrega
						if (!(await baseDatos.obtienePorCondicion("capsSinLink", {coleccion_id: id})))
							await baseDatos.agregaRegistro("capsSinLink", {coleccion_id: id});

						// Actualiza su link
						comp.actualizaCalidadDeLinkEnCol(id);
					}
				}

				// NO CAPÍTULO - Si el avatar es un url, descarga el archivo y actualiza el registro
				const corresponde = statusRegistro_id == aprobado_id && registro.avatar && registro.avatar.includes("/");
				if (entidad != "capitulos" && corresponde) procesos.descargaAvatarOriginal(registro, entidad);

				// CAPÍTULOS - Impacto en links de su colección
				if (entidad == "capitulos") comp.actualizaCalidadDeLinkEnCol(registro.coleccion_id);
			}

			// CONSECUENCIAS SI ES RCLV
			if (rclv) {
				// Impactos en 'productos'
				if (statusRegistro_id == inactivo_id) {
					// Borra el vínculo en las ediciones de producto y las elimina si quedan vacías
					procsFM.elimina.vinculoEdicsProds({rclvEnt: entidad, rclvID: id});

					// Sus productos asociados dejan de estar vinculados y si no pasan el control de error y estaban aprobados, pasan al status 'creadoAprob'
					await procesos.cambioStatus.prodsAsocs(entidad, id);
				}

				// 'EPOCAS DEL AÑO' Y APROBADO - Impactos en sí mismo
				if (entidad == "epocasDelAno" && statusRegistro_id == aprobado_id) {
					// Si tiene imagen, la copia en su carpeta
					if (original.avatar) {
						const {carpetaAvatars} = req.body;
						const rutaNombreOrigen = path.join(carpRclvs.final, original.avatar);
						const rutaNombreDestino = path.join(carpImgsComp, "3-EpocasDelAno", carpetaAvatars, original.avatar);
						comp.gestionArchivos.copiaImagen(rutaNombreOrigen, rutaNombreDestino);
					}
					// Actualiza el solapamiento
					comp.actualizaSolapam();
				}
			}

			// CONSECUENCIAS SIEMPRE - Impacto en la variable 'statusErrores'
			statusErrores = statusErrores.filter((n) => !n.ST || n.entidad_id != id || n.entidad != entidad);
			await comp.actualizaStatusErrores.consolidado();

			// Opciones de redireccionamiento
			let destino;
			if (opcion == "historial")
				destino = "/" + entidad + "/inactivar-captura/?id=" + id + "&origen=TE"; // Tablero de revisión
			else if (producto || rclv)
				destino =
					statusRegistro_id == recuperar_id
						? "/revision/recuperar/" + entidad + "/?id=" + id // Revisión de recuperar
						: statusRegistro_id == inactivar_id
						? "/revision/inactivar/" + entidad + "/?id=" + id // Revisión de inactivar
						: statusRegistro_id == inactivo_id
						? "/" + entidad + "/recuperar/" + siglaFam + "/?id=" + id + "&origen=TE" // Recuperar
						: "/" + entidad + "/inactivar/" + siglaFam + "/?id=" + id + "&origen=TE";
			else {
				// Obtiene el producto
				const link = await baseDatos.obtienePorId("links", id);
				const prodEnt = comp.obtieneDesdeCampo_id.prodEnt(link);
				const prodCampo_id = comp.obtieneDesdeCampo_id.prodCampo_id(link);
				const prodId = link[prodCampo_id];

				// Destino
				destino = "/" + prodEnt + "/abm-links/p/?id=" + prodId;
			}

			// Fin
			return res.redirect(destino);
		},
	},
};
