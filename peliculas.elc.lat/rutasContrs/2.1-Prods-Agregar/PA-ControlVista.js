"use strict";

// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");
const validaFM = require("../2.0-Familias/FM-FN-Validar");
const valida = require("./PA-FN3-Validar");
const procesos = require("./PA-FN4-Procesos");

module.exports = {
	palabrasClave: {
		form: async (req, res) => {
			// Tema y Código
			const tema = "prodAgregar";
			const codigo = "palabrasClave";
			const titulo = "Agregar - Palabras Clave";

			// Obtiene el Data Entry de session y cookies
			const palabrasClave = req.session.palabrasClave || req.cookies.palabrasClave;

			// Variables para la vista
			const mensajesAyuda = [
				"Ingresá palabras del <b><u>Título de la Película</u></b>, en el idioma <b><em>original</em></b> o en <b><em>castellano</em></b>.",
				"Escribí de manera precisa todas las palabras que sepas.",
			];

			// Render del formulario
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, mensajesAyuda},
				dataEntry: {palabrasClave},
			});
		},
		guardar: async (req, res) => {
			// Elimina los campos vacíos y pule los espacios innecesarios
			for (let prop in req.body)
				if (!req.body[prop]) delete req.body[prop];
				else req.body[prop] = req.body[prop].trim();

			// Obtiene el Data Entry
			const {palabrasClave, metodo} = req.body;

			// Guarda el Data Entry en session y cookie de palabrasClave
			req.session.palabrasClave = palabrasClave;
			res.cookie("palabrasClave", palabrasClave, {maxAge: unDia});

			// Si hay errores de validación, redirecciona
			const errores = valida.palabrasClave(palabrasClave, 3);
			if (errores.hay) return res.redirect(req.originalUrl);

			// Si corresponde, redirecciona a 'ingreso manual'
			if (metodo == "Ingr. Man.") {
				req.session.IM = {palabrasClave};
				res.cookie("IM", {palabrasClave}, {maxAge: unDia});
				return res.redirect("agregar-im");
			}

			// Si corresponde, redirecciona a 'datos duros'
			if (metodo == "Datos Duros") return res.redirect("agregar-dd");
			if (metodo == "Datos Adics") return res.redirect("agregar-da");

			// Redirecciona a 'desambiguar'
			req.session.desambiguar = palabrasClave;
			res.cookie("desambiguar", palabrasClave, {maxAge: unDia});
			return res.redirect("agregar-ds");
		},
	},
	desambiguar: async (req, res) => {
		// Tema y Código
		const tema = "prodAgregar";
		const codigo = "desambiguar";
		const titulo = "Agregar - Desambiguar";

		// Obtiene la palabraClave
		if (!req.session.desambiguar) req.session.desambiguar = req.cookies.desambiguar;
		const palabrasClave = req.session.desambiguar;

		// Render del formulario
		return res.render("CMP-0Estructura", {
			...{tema, codigo, titulo},
			...{palabrasClave, omitirImagenDerecha: true},
		});
	},
	datosDuros: {
		form: async (req, res) => {
			// Tema y Código
			const tema = "prodAgregar";
			const codigo = "datosDuros";
			const titulo = "Agregar - Datos Duros";

			// Obtiene el Data Entry de session y cookies
			const datosDuros = req.session.datosDuros || req.cookies.datosDuros;

			// Acciones si existe un valor para el campo 'avatar'
			if (datosDuros.avatar) {
				// Elimina 'avatarUrl' para que la vista permita ingresar otra imagen
				delete datosDuros.avatarUrl;

				// Actualiza session y cookie
				req.session.datosDuros = datosDuros;
				res.cookie("datosDuros", datosDuros, {maxAge: unDia});
			}

			// Obtiene los errores
			const camposDD = variables.camposDD.filter((n) => n[datosDuros.entidad] || n.productos);
			const camposDD_nombre = camposDD.map((n) => n.nombre);
			const errores = await validaFM.datosDuros(camposDD_nombre, datosDuros);

			// Variables
			const camposInput = camposDD.filter((n) => n.campoInput);
			const paisesNombre = datosDuros.paises_id ? comp.paises_idToNombre(datosDuros.paises_id) : [];
			const paisesTop5 = [...paises].sort((a, b) => b.cantProds.cantidad - a.cantProds.cantidad).slice(0, 5); // 'paises' va entre corchetes, para no alterar su orden

			// Imagen derecha
			const imgDerPers = datosDuros.avatar
				? "/imgsComp/9-Provisorio/" + datosDuros.avatar
				: datosDuros.avatarUrl
				? datosDuros.avatarUrl
				: "/imgsPropio/Avatar/Sin-Avatar.jpg";

			// Datos para la vista
			const origen =
				req.session.FA || req.cookies.FA ? "agregar-fa" : req.session.IM || req.cookies.IM ? "agregar-im" : "agregar-ds";
			const camposInput1 = camposInput.filter((n) => n.campoInput == 1);
			const camposInput2 = camposInput.filter((n) => n.campoInput == 2);
			const datosProvs = comp.datosProvs(datosDuros);

			// Render del formulario
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo, origen},
				...{dataEntry: datosDuros, imgDerPers, errores},
				...{camposInput1, camposInput2, datosProvs},
				...{paises, paisesTop5, paisesNombre, idiomas},
			});
		},
		guardar: async (req, res) => {
			// Actualiza datosDuros con la info ingresada. Si se ingresa manualmente un avatar, no lo incluye
			let datosDuros = req.session.datosDuros || req.cookies.datosDuros;

			// Acciones si existe un archivo avatar ingresado anteriormente y ahora se ingresó otro
			if (datosDuros.avatar && req.file) {
				comp.gestionArchivos.elimina(carpProvisorio, datosDuros.avatar);
				delete datosDuros.avatar;
			}

			// Actualiza la variable 'datosDuros'
			datosDuros = {...datosDuros, ...req.body};

			// Elimina los campos vacíos y pule los espacios innecesarios
			for (let prop in datosDuros)
				if (!datosDuros[prop]) delete datosDuros[prop];
				else if (typeof datosDuros[prop] == "string") datosDuros[prop] = datosDuros[prop].trim();

			// Acciones si se ingresó un archivo de imagen (ej: IM)
			if (req.file) {
				// Obtiene la información sobre el avatar
				datosDuros.avatar = req.file.filename;
				datosDuros.tamano = req.file.size;
				datosDuros.avatarUrl = "Avatar ingresado manualmente en 'Datos Duros'";
			}

			// Guarda session de Datos Duros
			req.session.datosDuros = datosDuros;

			// Acciones si hay errores de validación
			const camposDD = variables.camposDD.filter((n) => n[datosDuros.entidad] || n.productos);
			const camposDD_nombre = camposDD.map((n) => n.nombre);
			const errores = await validaFM.datosDuros(camposDD_nombre, datosDuros);
			if (errores.hay) return res.redirect(req.originalUrl);

			// Guarda session y cookie de Datos Adicionales
			const datosAdics = {...datosDuros};
			delete datosAdics.tamano;
			req.session.datosAdics = datosAdics;
			res.clearCookie("datosDuros");
			res.cookie("datosAdics", datosAdics, {maxAge: unDia});

			// Campos que se agregan a los Datos Originales - nombreOriginal, nombreCastellano, anoEstreno, epocaEstreno_id, sinopsis
			if (datosDuros.fuente == "IM" || datosDuros.fuente == "FA") {
				// Variables - campos que se agregan (no se agrega el avatar)
				const {nombreOriginal, nombreCastellano, anoEstreno, sinopsis} = datosDuros;
				const epocaEstreno_id = epocasEstreno.find((n) => n.desde <= Number(anoEstreno)).id; // se debe agregar en el original

				// Se consolida la información
				let datosOriginales = req.session.datosOriginales || req.cookies.datosOriginales;
				datosOriginales = {...datosOriginales, nombreOriginal, nombreCastellano, anoEstreno, epocaEstreno_id, sinopsis}; // No se guarda nada en el avatar, para revisarlo en Revisión

				// Se guarda la cookie
				req.session.datosOriginales = datosOriginales;
				res.cookie("datosOriginales", datosOriginales, {maxAge: unDia});
			}

			// Redirecciona a la siguiente instancia
			return res.redirect("agregar-da");
		},
	},
	datosAdics: {
		form: async (req, res) => {
			// Tema y Código
			const tema = "prodAgregar";
			const codigo = "datosAdics";
			const titulo = "Agregar - Datos Adicionales";
			const usuario_id = req.session.usuario.id;

			// Prepara variables para la vista
			const datosAdics = req.session.datosAdics || req.cookies.datosAdics;
			const camposDA = await variables.camposDaConVals(usuario_id);
			const camposChkBox = camposDA.filter((n) => n.chkBox && (!n.exclusivo || n.exclusivo.includes(datosAdics.entidad)));
			const camposDE = Object.keys(datosAdics);

			// Grupos rclv
			const gruposPers = procesos.grupos.pers(camposDA);
			const gruposHechos = procesos.grupos.hechos(camposDA);

			// Datos para la vista
			const imgDerPers = datosAdics.avatar ? "/imgsComp/9-Provisorio/" + datosAdics.avatar : datosAdics.avatarUrl;
			const ayudas = procesos.datosAdics.ayudas;

			// Render del formulario
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo},
				...{dataEntry: datosAdics, imgDerPers, camposDA, camposDE, camposChkBox},
				...{gruposPers, gruposHechos, ayudas},
			});
		},
		guardar: async (req, res) => {
			// Obtiene el Data Entry de session y cookies
			let datosAdics = req.session.datosAdics || req.cookies.datosAdics;

			// Obtiene los datosAdics
			delete datosAdics.sinRclv;
			datosAdics = {...datosAdics, ...req.body};

			// Elimina los campos vacíos y pule los espacios innecesarios
			for (let prop in datosAdics)
				(!datosAdics[prop] && delete datosAdics[prop]) || // elimina los campos vacíos
					(typeof datosAdics[prop] == "string" && (datosAdics[prop] = datosAdics[prop].trim())); // pule los espacios innecesarios

			// Procesa algunos datos
			datosAdics = procesos.datosAdics.valsCheckBtn(datosAdics);
			datosAdics = procesos.datosAdics.quitaCamposRclv(datosAdics);
			datosAdics.actores = procesos.datosAdics.valorParaActores(datosAdics);

			// Guarda el data entry en session y cookie
			req.session.datosAdics = datosAdics;

			// Si hay errores de validación, redirecciona
			const camposDA = variables.camposDA.map((m) => m.nombre);
			const errores = await validaFM.datosAdics(camposDA, datosAdics);
			if (errores.hay) return res.redirect(req.originalUrl);

			// Guarda el data entry en session y cookie para el siguiente paso
			req.session.confirma = req.session.datosAdics;
			res.clearCookie("datosAdics");
			res.cookie("confirma", req.session.confirma, {maxAge: unDia});
			res.cookie("datosOriginales", req.cookies.datosOriginales, {maxAge: unDia});

			// Redirecciona a la siguiente instancia
			return res.redirect("agregar-cn");
		},
	},
	confirma: {
		form: (req, res) => {
			// Tema y Código
			const tema = "prodAgregar";
			const codigo = "confirma";
			const titulo = "Agregar - Confirma";
			let maximo;

			// Obtiene el Data Entry de session y cookies
			const confirma = req.session.confirma || req.cookies.confirma;

			// Datos de la producción
			maximo = 50;
			let direccion = confirma.direccion;
			if (direccion.length > maximo) {
				direccion = direccion.slice(0, maximo);
				if (direccion.includes(",")) direccion = direccion.slice(0, direccion.lastIndexOf(","));
			}

			// Datos de la actuación
			maximo = 170;
			let actores = confirma.actores;
			if (actores.length > maximo) {
				actores = actores.slice(0, maximo);
				if (actores.includes(",")) actores = actores.slice(0, actores.lastIndexOf(","));
			}

			// Imagen derecha
			const imgDerPers = !confirma.avatar ? confirma.avatarUrl : "/imgsComp/9-Provisorio/" + confirma.avatar;

			// Render del formulario
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo},
				...{dataEntry: confirma, direccion, actores, imgDerPers},
				tituloImgDerPers: confirma.nombreCastellano,
			});
		},
		guardar: async (req, res) => {
			// Variables
			const usuario_id = req.session.usuario.id;

			// Obtiene el Data Entry de session y cookies
			const confirma = req.session.confirma || req.cookies.confirma;
			const entidad = confirma.entidad;

			// Si se eligió algún rclv que no existe, vuelve a la instancia anterior
			if (!confirma.sinRclv) {
				const {existe, epocaOcurrencia_id} = await procesos.confirma.verificaQueExistanLosRclv(confirma);
				if (!existe) return res.redirect("agregar-da");
				else confirma.epocaOcurrencia_id = epocaOcurrencia_id;
			}

			// Guarda el registro original
			const original = {...req.cookies.datosOriginales, creadoPor_id: usuario_id, statusSugeridoPor_id: usuario_id};
			const registro = await baseDatos.agregaRegistroIdCorrel(entidad, original);

			// Si es una "collection" o "tv" (TMDB), agrega los capítulos en forma automática (no hace falta esperar a que concluya). No se guardan los datos editados, eso se realiza en la revisión
			if (confirma.fuente == "TMDB") {
				if (confirma.TMDB_entidad == "collection")
					procesos.confirma.agregaCaps_Colec({...registro, capsTMDB_id: confirma.capsTMDB_id});
				if (confirma.TMDB_entidad == "tv") procesos.confirma.agregaTemps_TV({...registro, cantTemps: confirma.cantTemps});
			}

			// Avatar - acciones si no se descargó (sólo para la mayoría de los TMDB y los FA)
			if (!confirma.avatar) {
				// Descarga el avatar en la carpeta 'Prods-Revisar'
				confirma.avatar = Date.now() + path.extname(confirma.avatarUrl);
				const rutaNombre = path.join(carpProds.revisar, confirma.avatar);
				comp.gestionArchivos.descarga(confirma.avatarUrl, rutaNombre); // No hace falta el 'await', el proceso no espera un resultado
			}
			// Avatar - si ya se había descargado el avatar (IM y algunos TMDB), lo mueve de 'provisorio' a 'revisar'
			else comp.gestionArchivos.mueveImagen(confirma.avatar, carpProvisorio, carpProds.revisar);

			// Guarda los datos de 'edición' - es clave escribir "edicion" así, para que la función no lo cambie
			await procsFM.guardaActEdic({original: {...registro}, edicion: {...confirma}, entidad, usuario_id});

			// Rclv - actualiza prodsAprob en rclvs <-- esto tiene que estar después del guardado de la edición
			if (confirma.personaje_id || confirma.hecho_id || confirma.tema_id)
				procsFM.accsEnDepsPorCambioDeStatus(entidad, registro); // No es necesario el 'await', el proceso no necesita ese resultado

			// SESSION Y COOKIES - Establece como vista anterior la vista del primer paso
			req.session.urlActual = "/";
			res.cookie("urlActual", "/", {maxAge: unDia});

			// SESSION Y COOKIES - Crea la cookie 'Terminaste' para la vista siguiente
			const terminaste = {entidad, id: registro.id, entidadNombre: confirma.entidadNombre};
			if (!original.avatar) terminaste.avatarEdic = true; // si el original no incluía un avatar, entonces ya se había descargado el de la edición
			req.session.terminaste = terminaste;
			res.clearCookie("confirma");
			res.cookie("terminaste", terminaste, {maxAge: unDia});

			// REDIRECCIONA --> es necesario que sea una nueva url, para que no se pueda recargar el post de 'guardar'
			return res.redirect("agregar-tr");
		},
	},
	terminaste: async (req, res) => {
		// Tema y Código
		const tema = "prodAgregar";
		const codigo = "terminaste";
		const titulo = "Agregar - Terminaste";
		const usuario_id = req.session.usuario.id;
		const terminaste = req.session.terminaste || req.cookies.terminaste;

		// Si no existe información, redirige al paso anterior
		if (!terminaste) return res.redirect("agregar-cn");

		// Elimina todas las sessions y cookies del proceso
		procesos.borraSessionCookies(req, res, "borrarTodo");

		// Obtiene los datos del producto
		const {entidad, id, entidadNombre, avatarEdic} = terminaste;
		const [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id, excluirInclude: true});
		const prodComb = {...original, ...edicion, id: original.id, entidadNombre};

		// Prepara la imagen Muchas Gracias
		const carpMuchasGracias = "/imgsPropio/MuchasGracias/";
		const ruta = path.join(carpImgsProp, "MuchasGracias");
		const nombre = comp.gestionArchivos.imagenAlAzar(ruta);
		const carpNombre = carpMuchasGracias + nombre;

		// Prepara variables para la vista
		const imgDerPers = procsFM.obtieneAvatar(original, edicion)[avatarEdic ? "edic" : "orig"];
		const tituloImgDerPers = prodComb.nombreCastellano;
		const origen = "DT";
		const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);
		const oa = comp.obtieneDesdeEntidad.oa(entidad);
		const tituloLink = "Califical" + oa;
		const agregaste = true;

		// Render del formulario
		return res.render("CMP-0Estructura", {
			...{tema, codigo, titulo, imagenMG: carpNombre, agregaste, origen, siglaFam},
			...{entidad, familia: "producto", id, prodComb, dataEntry: terminaste, oa, tituloLink},
			...{imgDerPers, tituloImgDerPers, status_id: creado_id},
		});
	},

	// Ingresos Manuales
	IM: {
		form: async (req, res) => {
			// Variables
			const tema = "prodAgregar";
			const codigo = "IM";
			const titulo = "Agregar - Tipo de Producto";

			// Si existe query, guarda los datos y los descarta del url
			const {entidad, coleccion_id, numTemp, numCap} = req.query;
			if (entidad || coleccion_id || numTemp || numCap) {
				// Copia session y cookie
				req.session.IM = {entidad, coleccion_id, numTemp, numCap};
				res.cookie("IM", {entidad, coleccion_id, numTemp, numCap}, {maxAge: unDia});

				// Redirige - no se puede usar 'req.originalUrl' para descartar el query
				return res.redirect(req.baseUrl + req.path);
			}

			// Entidades
			const {prodsNombre, prods} = variables.entidades;
			let entidades = [];
			prods.forEach((prod, i) => entidades.push({codigo: prod, nombre: prodsNombre[i]}));

			// Obtiene el Data Entry de session y cookies
			const IM = req.session.IM || req.cookies.IM || {};

			// Render del formulario
			return res.render("CMP-0Estructura", {
				...{tema, codigo, titulo},
				...{entidades, dataEntry: IM},
				...{autorizadoFA: req.session.usuario.autorizadoFA, urlActual: req.session.urlActual},
			});
		},
		guardar: async (req, res) => {
			// Prepara los datos y los guarda en 'session' y 'cookie'
			let IM = {...req.body, entidadNombre: comp.obtieneDesdeEntidad.entidadNombre(req.body.entidad)};
			if (req.query.ingreso_fa) IM.fuente = "FA";
			else IM = {...IM, fuente: "IM", imgOpcional: "NO"};

			// Copia session y cookie
			req.session.IM = IM;
			res.cookie("IM", IM, {maxAge: unDia});

			// Si hay errores de validación, redirecciona al Form
			const errores = await valida.IM(IM);
			if (errores.hay) return res.redirect(req.baseUrl + req.path); // No se puede usar 'req.originalUrl' porque en el query tiene la alusión a FA

			// Acciones si es un capítulo
			if (IM.entidad == "capitulos") {
				// Genera información a guardar
				IM.creadoPor_id = req.session.usuario.id;
				IM.statusSugeridoPor_id = req.session.usuario.id;

				// Acciones si es un 'IM'
				if (IM.fuente == "IM") {
					// Guarda el capítulo y obtiene su 'id'
					const id = await procesos.capsIMFA(IM);

					// Redirecciona a su edición
					return res.redirect("/capitulos/edicion/p/?id=" + id);
				}
			}

			// Si no es un capítulo, guarda en 'cookie' de datosOriginales
			else res.cookie("datosOriginales", IM, {maxAge: unDia});

			// Guarda en 'session' y 'cookie' del siguiente paso
			const sigPaso = IM.fuente == "FA" ? {codigo: "FA", url: "agregar-fa"} : {codigo: "datosDuros", url: "agregar-dd"};
			req.session[sigPaso.codigo] = IM;
			res.cookie(sigPaso.codigo, IM, {maxAge: unDia});

			// Redirecciona a la siguiente instancia
			return res.redirect(req.baseUrl + "/" + sigPaso.url); // se escribe así, porque si no falla para 'fa'
		},
	},
	FA: {
		form: async (req, res) => {
			// Variables
			const tema = "prodAgregar";
			const codigo = "FA";
			const titulo = "Agregar - Copiar FA";
			const dataEntry = req.session.FA || req.cookies.FA;

			// Fin
			return res.render("CMP-0Estructura", {tema, codigo, titulo, dataEntry});
		},
		guardar: async (req, res) => {
			// Obtiene el Data Entry de session y cookies y actualiza la información
			let FA = req.session.FA ? req.session.FA : req.cookies.FA;

			// Actualiza la información
			FA = {...FA, ...req.body};

			// Elimina los campos vacíos y pule los espacios innecesarios
			for (let prop in FA)
				if (!FA[prop]) delete FA[prop];
				else if (typeof FA[prop] == "string") FA[prop] = FA[prop].trim();

			// Actualiza session FA
			req.session.FA = FA;

			// Si hay errores de validación, redirecciona
			const errores = valida.FA(FA);
			if (errores.hay) return res.redirect(req.originalUrl);

			// Procesa la información
			const datosDuros = {...procesos.FA.infoFAparaDD(FA), ...FA};
			delete datosDuros.url;
			delete datosDuros.contenido;

			// Acciones si es un capítulo
			if (datosDuros.entidad == "capitulos") return procesos.capsIMFA(datosDuros, req, res);

			// Actualiza Session y Cookies de datosDuros
			req.session.datosDuros = datosDuros;
			res.clearCookie("FA");
			res.cookie("datosDuros", datosDuros, {maxAge: unDia});

			// Actualiza datosOriginales con FA_id
			const FA_id = datosDuros.FA_id;
			const datosOriginales = {...req.cookies.datosOriginales, FA_id}; // no se incluye el campo 'avatarUrl'
			res.cookie("datosOriginales", datosOriginales, {maxAge: unDia});

			// Redirecciona a la siguiente instancia
			return res.redirect("agregar-dd");
		},
	},
};
