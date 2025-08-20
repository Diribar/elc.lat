"use strict";

// Variables
const cron = require("node-cron");
const procesos = require("./RT-Procesos");
const mailDeFeedback = require("./RT-MailFeedback");
const linksVencidos = require("./RT-LinksVencidos");
const minRutinasHora = 2; // minuto en el que se ejecuta las rutinas horarias: 0➜compartidas, 1➜diarias, 2➜horas
// const prNavegsDia = require("./RT-NavegsDia");

// Exportar
module.exports = {
	// Start-up y Configuración de Rutinas
	startupMasConfiguracion: async function () {
		// Rutinas iniciales
		RT_comp.variablesDiarias();
		comp.variablesSemanales();
		await comp.actualizaCantLinksPorSem();
		await comp.actualizaStatusErrores.consolidado();
		await this.FechaHoraUTC();
		ImagenesDerecha = RT_comp.lectura(carpRutsComp).ImagenesDerecha;

		// Stoppers
		const info = {...RT_info};
		if (!Object.keys(info).length) return;
		if (!info.RutinasDiarias || !Object.keys(info.RutinasDiarias).length) return;
		if (!info.RutinasHorarias || !info.RutinasHorarias.length) return;

		// this.rutinas.verificaLinksAutoms();

		// Rutinas programadas - compartidas diarias: 0:00hs
		cron.schedule("1 0 * * *", () => this.FechaHoraUTC(), {timezone: "Etc/Greenwich"}); // Rutinas diarias (a las 0:01hs)
		cron.schedule(minRutinasHora + " * * * *", () => this.RutinasHorarias(), {timezone: "Etc/Greenwich"}); // Rutinas horarias (a las X:02hs)

		// Fin
		const tiempoTranscurrido = (Date.now() - horarioStartUp).toLocaleString("pt"); // 'es' no coloca el separador de miles
		console.log("\n✅ Rutinas de inicio terminadas en", tiempoTranscurrido, "mseg., el", new Date().toLocaleString());
		return;
	},

	// Consolidados
	FechaHoraUTC: async function () {
		// Variables
		hoy = comp.fechaHora.anoMesDia(new Date());
		const info = {...RT_info};
		const minutos = new Date().getMinutes();

		// Filtros
		if (!Object.keys(info).length || !info.RutinasDiarias || !Object.keys(info.RutinasDiarias).length) return;

		// Si la 'FechaUTC' actual es igual a la del archivo JSON, termina la función
		const {FechaUTC, HoraUTC} = RT_comp.fechaHoraUTC();
		if (info.FechaUTC == FechaUTC) return;

		// Encabezado de las rutinas diarias - si llegó hasta acá, es porque cambió el día
		console.log("\nRutinas diarias:");
		const comienzo = Date.now();

		// Actualiza los valores de la rutina "FechaHoraUTC" en el archivo JSON
		const feedback = {FechaUTC, HoraUTC, FechaHoraUTC: "NO"};
		RT_comp.guardaArchivoDeRutinas({datos: feedback, carpeta: __dirname}); // Actualiza la fecha y hora, más el valor "NO" en el campo "FechaHoraUTC"
		const duracion = Date.now() - comienzo;
		RT_comp.finRutinasDiariasSemanales({campo: "FechaHoraUTC", duracion, carpeta: __dirname}); // Actualiza el valor "SI" en el campo "FechaHoraUTC", y avisa que se ejecutó

		// Actualiza los campos de Rutinas Diarias
		const feedback_RD = {};
		for (let rutinaDiaria in info.RutinasDiarias) feedback_RD[rutinaDiaria] = "NO"; // cuando se ejecute cada rutina, se va a actualizar a 'SI'
		RT_comp.guardaArchivoDeRutinas({datos: feedback_RD, menu: "RutinasDiarias", carpeta: __dirname}); // actualiza el valor "NO" en los campos de "RutinasDiarias"
		await this.RutinasDiarias(); // ejecuta las rutinas diarias

		// Verifica si se deben correr las rutinas horarias
		if (minutos > minRutinasHora) await this.RutinasHorarias();

		// Fin
		return;
	},
	RutinasDiarias: async function () {
		// Actualiza las variables diarias
		RT_comp.variablesDiarias();

		// Actualiza todas las rutinas diarias
		const {RutinasDiarias} = RT_info;
		for (let rutinaDiaria in RutinasDiarias) {
			// No aplica para el entorno de test
			if (entPrueba && rutinaDiaria != "imagenDerecha") continue; // en test, sólo se debe ejecutar la rutina 'imagenDerecha'

			// Realiza la rutina
			const comienzo = Date.now();
			await this.rutinas[rutinaDiaria](); // ejecuta la rutina
			const duracion = Date.now() - comienzo;
			RT_comp.finRutinasDiariasSemanales({campo: rutinaDiaria, duracion, menu: "RutinasDiarias", carpeta: __dirname}); // actualiza el archivo JSON
		}
		console.log("✅ Fin de rutinas diarias");

		// Rutinas semanales
		await this.SemanaUTC();

		// Fin
		return;
	},
	SemanaUTC: async function () {
		comp.variablesSemanales();

		// Obtiene la información del archivo JSON
		const info = {...RT_info};
		if (!Object.keys(info).length) return;
		if (!info.RutinasSemanales || !Object.keys(info.RutinasSemanales).length) return;
		const rutinasSemanales = info.RutinasSemanales;

		// Obtiene la fecha y hora UTC actual
		const {FechaUTC, HoraUTC} = RT_comp.fechaHoraUTC();

		// Si la 'semanaUTC' actual es igual a la del archivo JSON, actualiza los links y termina la función
		if (info.semanaUTC == semanaUTC) {
			// Si llegó hasta acá, es porque cambió el día pero no la semana
			this.rutinas.verificaLinksAutoms();
			return;
		}

		// Actualiza los campos de semana
		console.log("\nRutinas semanales:");
		const feedback = {FechaSemUTC: FechaUTC, HoraSemUTC: HoraUTC, semanaUTC, SemanaUTC: "NO"}; // Con el paso de 'finRutinasDiariasSemanales', se actualiza a 'SI'
		const comienzo = Date.now();
		RT_comp.guardaArchivoDeRutinas({datos: feedback, carpeta: __dirname});
		const duracion = Date.now() - comienzo;
		RT_comp.finRutinasDiariasSemanales({campo: "SemanaUTC", duracion, carpeta: __dirname});

		// Actualiza los campos de Rutinas Semanales
		const feedback_RS = {};
		for (let rutinaSemanal in rutinasSemanales) feedback_RS[rutinaSemanal] = "NO"; // Cuando se ejecuta cada rutina, se actualiza a 'SI'
		RT_comp.guardaArchivoDeRutinas({datos: feedback_RS, menu: "RutinasSemanales", carpeta: __dirname});
		await this.RutinasSemanales();

		// Fin
		return;
	},
	RutinasSemanales: async function () {
		// No aplica para el entorno de test
		if (entPrueba) return;

		// Actualiza las rutinasSemanales
		const {RutinasSemanales} = RT_info;
		for (let rutinaSemanal in RutinasSemanales) {
			const comienzo = Date.now();
			await this.rutinas[rutinaSemanal]();
			const duracion = Date.now() - comienzo;
			RT_comp.finRutinasDiariasSemanales({campo: rutinaSemanal, duracion, menu: "RutinasSemanales", carpeta: __dirname});
		}
		console.log("✅ Fin de rutinas semanales");

		// Verifica los links automatizados - si llegó hasta acá, es porque cambió la semana
		this.verificaLinksAutoms();

		// Fin
		return;
	},
	RutinasHorarias: async function () {
		// No aplica para el entorno de test
		if (entPrueba) return;

		// Obtiene la información del archivo JSON
		const {RutinasHorarias} = RT_info;

		// Actualiza todas las rutinas horarias
		console.log("\nRutinas horarias:");
		for (let rutina of RutinasHorarias) {
			const comienzo = Date.now();
			await this.rutinas[rutina]();
			const duracion = Date.now() - comienzo;
			procesos.finRutinasHorarias(rutina, duracion);
		}
		console.log("✅ Fin de rutinas horarias");

		// Fin
		return;
	},

	// Rutinas
	rutinas: {
		// Gestiones horarias
		feedbackParaUsers: async () => {
			// Obtiene de la base de datos, la información de todo el historial pendiente de comunicar
			const {regsStatus, regsEdic} = await mailDeFeedback.obtieneElHistorial();
			const regsTodos = [...regsStatus, ...regsEdic];

			// Si no hay registros a comunicar, termina el proceso
			if (!regsTodos.length) {
				procesos.finRutinasHorarias("feedbackParaUsers", 0);
				return;
			}

			// Variables
			const usuarios_id = [...new Set(regsTodos.map((n) => n.sugeridoPor_id || n.statusOriginalPor_id))]; // obtiene el id de los usuarios a los que hay que notificarles
			const usuarios = await baseDatos.obtieneTodosPorCondicion("usuarios", {id: usuarios_id}, "pais");
			const nombre = "ELC Películas - Rutinas";
			const asunto = "Revisión de las sugerencias realizadas";
			let mailsEnviados = [];

			// Rutina por usuario
			for (let usuario of usuarios) {
				// Si corresponde, saltea la rutina
				const stopper = procesos.stoppersFeedbackParaUsers(usuario);
				if (stopper) continue;

				// Variables
				const email = usuario.email;
				const regsStatusUs = regsStatus.filter((n) => n.statusOriginalPor_id == usuario.id);
				const regsEdicUs = regsEdic.filter((n) => n.sugeridoPor_id == usuario.id);
				let cuerpoMail = "";

				// Arma el cuerpo del mail
				if (regsStatusUs.length) cuerpoMail += await mailDeFeedback.mensajeStatus(regsStatusUs);
				if (regsEdicUs.length) cuerpoMail += await mailDeFeedback.mensajeEdicion(regsEdicUs);

				// Envía el mail y actualiza la BD
				const otrosDatos = {regsStatusUs, regsEdicUs, usuario};
				const mailEnviado =
					usuario.id != usAutom_id && // si es el usuario automático, no envía el mail
					(!entDesarr || [1, 11].includes(usuario.id)) // en entDesarr, sólo envía el mail a los usuarios del programador
						? comp
								.enviaMail({nombre, email, asunto, comentario: cuerpoMail}) // Envía el mail
								.then((mailEnv) => mailDeFeedback.eliminaRegs.consolidado({mailEnv, ...otrosDatos}))
						: mailDeFeedback.eliminaRegs.consolidado({mailEnv: true, ...otrosDatos});
				mailsEnviados.push(mailEnviado);
			}

			// Espera a que se procese el envío de todos los emails
			await Promise.all(mailsEnviados);

			// Fin
			return;
		},
		actualizaProdsAlAzar: async () => {
			// Variables
			const condicion = {statusRegistro_id: aprobados_ids};
			const entidades = variables.entidades.prods;
			const prodsAzar = await baseDatos.obtieneTodos("prodsAzar");
			const camposNulos = {pelicula_id: null, coleccion_id: null, grupoCol_id: null, capitulo_id: null};
			let id = 0;

			// Rastrilla los productos
			for (let entidad of entidades) {
				// Variables
				const productos = await baseDatos.obtieneTodosPorCondicion(entidad, condicion);
				if (entidad == "capitulos") productos.sort((a, b) => a.coleccion_id - b.coleccion_id);
				const campo_id = comp.obtieneDesdeEntidad.campo_id(entidad);

				// Rastrilla los productos
				for (let producto of productos) {
					// Variables
					id++;
					const azar = comp.azar();
					const datos = {...camposNulos, [campo_id]: producto.id, azar};
					if (entidad != "peliculas")
						datos.grupoCol_id = entidad == "colecciones" ? producto.id : producto.coleccion_id;

					// Guarda los cambios - Si existe un registro con el id, lo pisa
					if (prodsAzar.length && prodsAzar[0].id == id) {
						baseDatos.actualizaPorId("prodsAzar", id, datos);
						prodsAzar.shift();
					}
					// Guarda los cambios - Si no existe un registro con el id, lo agrega
					else baseDatos.agregaRegistro("prodsAzar", {id, ...datos});
				}
			}

			// Elimina los sobrantes
			baseDatos.eliminaPorCondicion("prodsAzar", {id: {[Op.gt]: id}});

			// Fin
			return;
		},
		eliminaCapturasVencidas: async () => {
			// Variables
			const haceDosHoras = comp.fechaHora.nuevoHorario(-2);
			const condicion = {capturadoEn: {[Op.lt]: haceDosHoras}};

			// Actualiza la BD
			baseDatos.eliminaPorCondicion("capturas", condicion);

			// Fin
			return;
		},

		// Gestiones diarias
		imagenDerecha: () => {
			// Obtiene las fechas necesarias
			ImagenesDerecha = RT_comp.lectura(carpRutsComp).ImagenesDerecha;
			const fechas = Object.keys(ImagenesDerecha);

			// Otras variables
			const carpDestino = path.join(carpImgsProp, "ImagenDerecha");
			const rutaNombreInstitucional = path.join(carpImgsProp, "Varios", "Institucional.jpg");

			// Borra los archivos de imagen que no se corresponden con las fechas
			RT_comp.borraLosArchsImgDerObs({carpeta: carpDestino, fechas});

			// Rutina por día
			for (let fecha of fechas) {
				// Variables
				const rutaNombreCompartido = path.join(carpImgsComp, "4-ImagenDerecha", fecha + ".jpg");
				const rutaNombreDestino = path.join(carpDestino, fecha + ".jpg");

				// Si no existe el archivo de destino, lo agrega
				if (!comp.gestionArchivos.existe(rutaNombreDestino)) {
					const rutaNombreOrigen = comp.gestionArchivos.existe(rutaNombreCompartido)
						? rutaNombreCompartido
						: rutaNombreInstitucional; // si no existe una imagen que debería existir, le asigna la institucional
					comp.gestionArchivos.copiaImagen(rutaNombreOrigen, rutaNombreDestino, carpDestino);
				}
			}

			// Fin
			return;
		},
		eliminaLinksInactivos: async () => {
			// Variables
			const fechaDeCorte = comp.fechaHora.nuevoHorario(-25);

			// Elimina las ediciones
			await baseDatos
				.obtieneTodos("linkEdics", "link")
				.then((n) => n.filter((m) => m.link.statusRegistro_id == inactivo_id && m.link.statusSugeridoEn < fechaDeCorte)) // deja solamente las ediciones que tienen links inactivos
				.then((n) => n.map((m) => m.id)) // se queda sólo con los ids
				.then(async (ids) => await baseDatos.eliminaPorCondicion("linkEdics", {id: ids})); // elimina esas ediciones

			// Elimina los links
			const condicion = {statusRegistro_id: inactivo_id, statusSugeridoEn: {[Op.lt]: fechaDeCorte}};
			await baseDatos.eliminaPorCondicion("links", condicion);

			// Elimina los historiales de links
			comp.eliminaRegsSinEntidadId("links");

			// Fin
			return;
		},
		ABM_noRevisores: async () => {
			// Si no hay casos, termina
			const {regs, edics} = await procesos.ABM_noRevs();
			if (!(regs.perl.length + edics.perl.length + regs.links.length + edics.links.length)) return;

			// Variables
			const nombre = "ELC Películas - Rutinas";
			const asunto = {perl: "Productos y Rclvs prioritarios a revisar", links: "Links prioritarios a revisar"};
			let mailsEnviados = [];
			const cuerpoMail = mailDeFeedback.mensRevsTablero({regs, edics});

			// Obtiene los usuarios revisorPERL y revisorLinks
			let perl = baseDatos.obtieneTodosPorCondicion("usuarios", {rolUsuario_id: rolesRevPERL_ids});
			let links = baseDatos.obtieneTodosPorCondicion("usuarios", {rolUsuario_id: rolesRevLinks_ids});
			[perl, links] = await Promise.all([perl, links]);
			const revisores = {perl, links};

			// Rutina por usuario
			for (let tipo of ["perl", "links"])
				if (regs[tipo].length || edics[tipo].length)
					for (let revisor of revisores[tipo])
						mailsEnviados.push(
							comp.enviaMail({nombre, email: revisor.email, asunto: asunto[tipo], comentario: cuerpoMail[tipo]})
						); // Envía el mail y actualiza la BD

			// Avisa que está procesando el envío de los mails
			await Promise.all(mailsEnviados);

			// Fin
			return;
		},
		navegsDia: async () => {
			// Variables
			let espera = [];
			let condicion;

			// Obtiene los registros de días anteriores
			const fechaMax = new Date(hoy);
			condicion = {fecha: {[Op.lt]: fechaMax}};
			const navegsDia = await baseDatos.obtieneTodosPorCondicion("navegsDia", condicion);
			if (!navegsDia.length) return;

			// Procesos
			// espera.push(prNavegsDia.porRuta.control(navegsDia));
			// espera.push(prNavegsDia.porProd.control(navegsDia));
			// espera.push(prNavegsDia.porHora.control(navegsDia));
			// await Promise.all(espera);

			// Elimina los registros de días anteriores
			const fechaEliminar = new Date(new Date(hoy).getTime() - unDia * 3);
			condicion = {fecha: {[Op.lt]: fechaEliminar}};
			await baseDatos.eliminaPorCondicion("navegsDia", condicion);

			// Fin
			return;
		},

		// Diarias, ejecutadas por semanales
		verificaLinksAutoms: async () => {
			// Variables
			const distOkRu = "ok.ru/video";
			const distYT = "youtube.com";
			const distDM = "dailymotion.com";

			// Obtiene los links a revisar
			let links = await baseDatos
				.obtieneTodosPorCondicion("links", {statusRegistro_id: [...creados_ids, aprobado_id], prodAprob: true})
				.then((n) => n.sort((a, b) => a.statusRegistro_id - b.statusRegistro_id)); // para que se revisen primero los que están en status menor

			// Primera revisión
			console.log("Primera revisión");
			const YT = {links: links.filter((n) => n.url.startsWith(distYT)), prov: "youTube"};
			await linksVencidos.porProv(YT);
			const okRu = {links: links.filter((n) => n.url.startsWith(distOkRu)), prov: "okRu"};
			await linksVencidos.porProv(okRu);
			const DM = {links: links.filter((n) => n.url.startsWith(distDM)), prov: "dm"};
			// await linksVencidos.porProv(DM);

			// Segunda revisión
			console.log("Segunda revisión");
			links = await baseDatos.obtieneTodosPorCondicion("links", {statusRegistro_id: inactivar_id, prodAprob: true});
			okRu.links = links.filter((n) => n.url.startsWith(distOkRu));
			await linksVencidos.porProv(okRu);
			DM.links = links.filter((n) => n.url.startsWith(distDM));
			// await linksVencidos.porProv(DM);

			// Actualiza la cantidad de links por semana
			comp.actualizaCantLinksPorSem();

			// Fin
			console.log("Terminado!");
			return;
		},

		// Rutinas semanales - Gestiones
		estableceLosNuevosLinksVencidos: async function () {
			// Variables generales
			const novedades = {statusRegistro_id: creadoAprob_id, statusSugeridoPor_id: usAutom_id, statusSugeridoEn: ahora};
			const condicion = {statusRegistro_id: aprobado_id, prodAprob: true};
			const fechaDeCorte = new Date(lunesDeEstaSemana + unaSemana);
			const ahora = new Date();
			const espera = [];
			let fechaVencim;

			// Actualiza el status a 'creadoAprob_id' en todos los links con fecha vencida
			fechaVencim = {[Op.lt]: fechaDeCorte}; // con fecha menor al corte
			espera.push(baseDatos.actualizaPorCondicion("links", {...condicion, fechaVencim}, novedades));

			// Actualiza el status a 'creadoAprob_id' en todos los links con fecha null y que no sean de actualización automática
			fechaVencim = {[Op.is]: null}; // sin fecha
			const links = await baseDatos.obtieneTodosPorCondicion("links", {...condicion, fechaVencim}, "prov");
			const ids = links.filter((n) => !n.prov.validacAutom).map((m) => m.id);
			if (ids.length) espera.push(baseDatos.actualizaPorId("links", ids, novedades));

			// Fin
			await Promise.all(espera);
			return;
		},
		actualizaPaisesConMasProductos: async () => {
			// Variables
			const condicion = {statusRegistro_id: aprobados_ids};
			const entidades = ["peliculas", "colecciones"];
			let paisesIds = {};

			// Obtiene la frecuencia por país
			for (let entidad of entidades) {
				// Obtiene todos los registros de la entidad
				await baseDatos
					.obtieneTodosPorCondicion(entidad, condicion)
					.then((n) => n.filter((m) => m.paises_id)) // quita los registros sin país
					.then((registros) =>
						registros.map((registro) => {
							const paises_id = registro.paises_id.split(" ");
							for (let pais_id of paises_id) paisesIds[pais_id] ? paisesIds[pais_id]++ : (paisesIds[pais_id] = 1);
						})
					);
			}

			// Actualiza la frecuencia por país
			paises.forEach((pais, i) => {
				const cantidad = paisesIds[pais.id] || 0;
				paises[i].cantProds.cantidad = cantidad; // actualiza la variable en 'global'
				baseDatos.actualizaPorCondicion("paisesCantProds", {pais_id: pais.id}, {cantidad});
			});

			// Fin
			return;
		},
		actualizaLinksPorProv: async () => {
			// Obtiene todos los links activos
			const linksTotales = await baseDatos.obtieneTodosPorCondicion("links", {statusRegistro_id: aprobados_ids});

			// Links por proveedor
			for (let linkProv of linksProvs.filter((n) => n.urlDistintivo)) {
				const cantidad = linksTotales.filter((n) => n.url.startsWith(linkProv.urlDistintivo)).length;
				baseDatos.actualizaPorCondicion("linksProvsCantLinks", {link_id: linkProv.id}, {cantidad});
			}

			// Fin
			return;
		},

		// Rutinas semanales - Desvíos del estándar
		revisaCorrigeSolapam: async () => await comp.actualizaSolapam(),
		revisaCorrigeLinksEnProd: async () => {
			// Variables
			let esperar = [];
			let IDs;

			// Rutina por peliculas y capitulos
			for (let entidad of ["peliculas", "capitulos"]) {
				// Obtiene los ID de los registros de la entidad
				IDs = await baseDatos
					.obtieneTodosPorCondicion(entidad, {statusRegistro_id: aprobados_ids})
					.then((n) => n.map((m) => m.id));

				// Ejecuta la función linksEnProd
				for (let id of IDs) esperar.push(comp.linksEnProd({entidad, id}));
			}
			await Promise.all(esperar).then(async () => {
				// Rutina por colecciones
				IDs = await baseDatos
					.obtieneTodosPorCondicion("colecciones", {statusRegistro_id: aprobados_ids})
					.then((n) => n.map((m) => m.id));
				for (let id of IDs) await comp.actualizaCalidadDeLinkEnCol(id);
			});

			// Fin
			return;
		},
		revisaCorrigeCalidadesDeLinkEnColes: async () => {
			// Variables
			const colecciones = await baseDatos.obtieneTodos("colecciones");

			// Rutina
			for (let coleccion of colecciones) await comp.actualizaCalidadDeLinkEnCol(coleccion.id);

			// Fin
			return;
		},
		revisaCorrigeProdAprobEnLink: async () => {
			// Obtiene todos los links con su producto asociado
			const links = await baseDatos.obtieneTodos("links", variables.entidades.prodAsocs);

			// Actualiza su valor
			comp.actualizaProdAprobEnLink(links);

			// Fin
			return;
		},
		revisaCorrigeProdsEnRclv: async () => {
			// Obtiene las rclvEnts
			const rclvEnts = variables.entidades.rclvs;

			// Rutina por entidad
			for (let entidad of rclvEnts) {
				// Obtiene los ID de los registros de la entidad
				const IDs = await baseDatos.obtieneTodos(entidad).then((n) => n.map((m) => m.id));

				// Rutina por ID
				for (let id of IDs) comp.actualizaProdsEnRclv({entidad, id});
			}

			// Fin
			return;
		},
		revisaCorrigeAprobadoConAvatarLink: async () => {
			// Variables
			const condicion = {statusRegistro_id: aprobado_id, avatar: {[Op.like]: "%/%"}};
			let descargas = [];

			// Revisa, descarga, actualiza
			for (let entidad of ["peliculas", "colecciones", ...variables.entidades.rclvs]) {
				// Variables
				const familias = comp.obtieneDesdeEntidad.familias(entidad);
				const carpeta = familias == "productos" ? carpProds.final : carpRclvs.final;

				// Descarga el avatar y actualiza el valor en el campo del registro original
				descargas.push(
					baseDatos.obtieneTodosPorCondicion(entidad, condicion).then((n) =>
						n.map((m) => {
							const nombre = Date.now() + path.extname(m.avatar);
							const rutaNombre = path.join(carpeta, nombre);
							comp.gestionArchivos.descarga(m.avatar, rutaNombre);
							baseDatos.actualizaPorId(entidad, m.id, {avatar: nombre});
						})
					)
				);
			}
			await Promise.all(descargas);

			// Fin
			return;
		},
		revisaCorrigeRclv_idEnCapsSiLaColeTieneUnValor: async () => {
			// Variables
			const {rclvCampos_id} = variables.entidades;
			const colecciones = await baseDatos.obtieneTodos("colecciones");

			// Rutina por rclvCampo_id
			for (let rclvCampo_id of rclvCampos_id) {
				// Variables
				let espera = [];

				// Rutina por colección
				for (let coleccion of colecciones)
					if (coleccion[rclvCampo_id] > varios_id) {
						// Variables
						const condicion = {coleccion_id: coleccion.id, [rclvCampo_id]: ninguno_id};
						const datos = {[rclvCampo_id]: coleccion[rclvCampo_id]};

						// Actualiza el 'rclvCampo_id'
						espera.push(baseDatos.actualizaPorCondicion("capitulos", condicion, datos));
					}

				// Es necesario para que no se superponga más de un guardado simultáneamente en un registro
				espera = await Promise.all(espera);
			}

			// Fin
			return;
		},
		eliminaRegsSinEntidadId: () => comp.eliminaRegsSinEntidadId(), // se prescinde del await porque es una sola linea de comando
		elimImgsSinRegEnBd_PR: async () => {
			await comp.elimImgsSinRegEnBd_PR.consolidado("productos");
			await comp.elimImgsSinRegEnBd_PR.consolidado("rclvs");
			return;
		},

		// Rutinas semanales - Eliminaciones de mantenimiento
		eliminaMisConsultasExcedente: async () => {
			// Elimina misConsultas > límite
			let misConsultas = await baseDatos.obtieneTodosConOrden("misConsultas", "id", "DESC");
			const limite = 20;
			while (misConsultas.length) {
				// Obtiene los registros del primer usuario
				const usuario_id = misConsultas[0].usuario_id;
				const registros = misConsultas.filter((n) => n.usuario_id == usuario_id);

				// Elimina los registros sobrantes en la BD
				if (registros.length > limite) {
					const idsBorrar = registros.map((n) => n.id).slice(limite);
					baseDatos.eliminaPorId("misConsultas", idsBorrar);
				}

				// Revisa las consultas de otro usuario
				misConsultas = misConsultas.filter((n) => n.usuario_id != usuario_id);
			}

			// Fin
			return;
		},
		eliminaCalifsSinPPP: async () => {
			// Variables
			const calRegistros = await baseDatos.obtieneTodos("calRegistros");
			const pppRegistros = await baseDatos.obtieneTodos("pppRegistros");

			// Si una calificación no tiene ppp, la elimina
			for (let calRegistro of calRegistros) {
				const {usuario_id, entidad, entidad_id} = calRegistro;
				if (!pppRegistros.find((n) => n.usuario_id == usuario_id && n.entidad == entidad && n.entidad_id == entidad_id))
					await baseDatos.eliminaPorId("calRegistros", calRegistro.id);
			}

			// Fin
			return;
		},
		idDeTablas: async () => {
			// Variables
			const tablas = [
				...["edicsHistorial", "statusHistorial"],
				...["prodEdics", "rclvEdics", "linkEdics"],
				...["prodsAzar", "capturas"],
				...["calRegistros", "misConsultas", "consRegsPrefs", "pppRegistros"],
				...["capsSinLink", "novsPeliculas"],
			];

			// Actualiza los valores de ID
			for (let tabla of tablas) {
				// Variables
				const registros = await baseDatos.obtieneTodos(tabla);
				let id = 1;

				// Actualiza los IDs - es crítico que sea un 'for', porque el 'forEach' no respeta el 'await'
				for (let registro of registros) {
					if (registro.id != id) await baseDatos.actualizaPorId(tabla, registro.id, {id}); // tiene que ser 'await' para no duplicar ids
					id++;
				}

				// Actualiza el próximo valor de ID
				const texto = bdNombre + "." + bd[tabla].tableName;
				await sequelize.query("ALTER TABLE " + texto + " AUTO_INCREMENT = " + id + ";");
			}

			// Fin
			return;
		},
	},
};
