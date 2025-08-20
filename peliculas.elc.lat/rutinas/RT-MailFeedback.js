"use strict";

module.exports = {
	obtieneElHistorial: async () => {
		// Variables
		let registros = [];
		let condicion;

		// Obtiene los registros de "statusHistorial"
		condicion = {
			statusOriginal_id: [creado_id, inactivar_id, recuperar_id], // descarta los cambios que no sean revisiones
			comunicadoEn: null, // no fue comunicado
		};
		registros.push(
			baseDatos
				.obtieneTodosPorCondicion("statusHistorial", condicion)
				.then((n) => n.map((m) => ({...m, tabla: "statusHistorial"})))
		);

		// Obtiene los registros de "edicsHistorial"
		condicion = {comunicadoEn: null};
		registros.push(
			baseDatos
				.obtieneTodosPorCondicion("edicsHistorial", condicion, "motivo")
				.then((n) => n.map((m) => ({...m, tabla: "edicsHistorial"}))) // Agrega el nombre de la tabla
		);

		// Espera a que se reciba la info
		const [regsStatus, regsEdic] = await Promise.all(registros);

		// Fin
		return {regsStatus, regsEdic};
	},
	mensRevsTablero: ({regs, edics}) => {
		// Variables
		let cuerpoMail = {perl: "", links: ""};
		let registros, prods, rclvs;

		// Productos - Cambios de Status
		registros = regs.perl.filter((n) => n.familia == "producto");
		if (registros.length) {
			cuerpoMail.perl += formatos.h2("Productos");
			prods = true;
			let mensajes = "";
			for (let registro of registros) {
				// Variables
				let mensaje = registro.nombreCastellano ? registro.nombreCastellano : registro.nombreOriginal;

				// Formatos
				mensaje = formatos.a(mensaje, registro);
				mensajes += formatos.li(mensaje);
			}
			cuerpoMail.perl += formatos.ol(mensajes);
		}

		// Productos - Ediciones
		registros = edics.perl.filter((n) => n.familia == "producto");
		if (registros.length) {
			if (!prods) cuerpoMail.perl += formatos.h2("Productos");
			let mensajes = "";
			for (let registro of registros) {
				// Variables
				const operacion = "edicion/";
				let mensaje = registro.nombreCastellano ? registro.nombreCastellano : registro.nombreOriginal;

				// Formatos
				mensaje = formatos.a(mensaje, registro, operacion);
				mensajes += formatos.li(mensaje);
			}
			cuerpoMail.perl += formatos.ol(mensajes);
		}

		// Rclvs - Cambios de Status
		registros = regs.perl.filter((n) => n.familia == "rclv");
		if (registros.length) {
			cuerpoMail.perl += formatos.h2("Rclvs");
			rclvs = true;
			let mensajes = "";
			for (let registro of registros) {
				// Formatos
				let mensaje = formatos.a(registro.nombre, registro);
				mensajes += formatos.li(mensaje);
			}
			cuerpoMail.perl += formatos.ol(mensajes);
		}

		// Rclvs - Ediciones
		registros = edics.perl.filter((n) => n.familia == "rclv");
		if (registros.length) {
			if (!rclvs) cuerpoMail.perl += formatos.h2("Rclvs");
			let mensajes = "";
			for (let registro of registros) {
				// Variables
				const operacion = "edicion/";

				// Formatos
				let mensaje = formatos.a(registro.nombre, registro, operacion);
				mensajes += formatos.li(mensaje);
			}
			cuerpoMail.perl += formatos.ol(mensajes);
		}

		// Links
		registros = [...regs.links, ...edics.links];
		if (registros.length) {
			cuerpoMail.links += formatos.h2("Links");
			let mensajes = "";
			for (let registro of registros) {
				// Variables
				let mensaje = registro.nombreCastellano ? registro.nombreCastellano : registro.nombreOriginal;

				// Formatos
				mensaje = formatos.a(mensaje, registro, "");
				mensajes += formatos.li(mensaje);
			}
			cuerpoMail.links += formatos.ol(mensajes);
		}

		// Fin
		return cuerpoMail;
	},
	eliminaRegs: {
		consolidado: async function ({mailEnv, regsStatusUs, regsEdicUs, usuario}) {
			// Si el mail no fue enviado, lo avisa
			if (!mailEnv) {
				console.log("Mail no enviado a " + email);
				return;
			}

			// Acciones si el mail fue enviado
			if (regsStatusUs.length) await this.histStatus(regsStatusUs); // agrega la fecha de comunicado a los que quedan y elimina los demás
			if (regsEdicUs.length) await this.histEdics(regsEdicUs); // agrega la fecha de comunicado a los que quedan y elimina los demás
			await baseDatos.actualizaPorId("usuarios", usuario.id, {fechaRevisores: new Date()}); // actualiza el campo fecha_revisor en el registro de usuario
			if (usuario.id != usAutom_id) console.log("Mail enviado a " + usuario.email);

			// Fin
			return;
		},
		histStatus: async (regs) => {
			// Variables
			const ids = regs.map((n) => n.id);
			const condicion = {
				id: ids,
				statusOriginal_id: creado_id,
				statusFinal_id: aprobados_ids,
			};
			const comunicadoEn = new Date();

			// Elimina los que corresponda
			await baseDatos.eliminaPorCondicion("statusHistorial", condicion);

			// Agrega la fecha 'comunicadoEn'
			await baseDatos.actualizaPorCondicion("statusHistorial", {id: ids}, {comunicadoEn});

			// Fin
			return;
		},
		histEdics: async (regs) => {
			// Variables
			const comunicadoEn = new Date();

			// Elimina los registros
			for (let reg of regs) {
				// Condición: sin duración
				if (!reg.penalizac || reg.penalizac == "0.0") await baseDatos.eliminaPorId(reg.tabla, reg.id);
				else await baseDatos.actualizaPorId(reg.tabla, reg.id, {comunicadoEn});
			}

			// Fin
			return;
		},
	},

	// Feedback para usuarios
	mensajeStatus: async function (regsStatus) {
		// Variables
		let resultados = [];

		// De cada registro de status, obtiene los campos clave o los elabora
		for (let regStatus of regsStatus) {
			// Variables
			const familia = comp.obtieneDesdeEntidad.familia(regStatus.entidad);
			const {nombre, anchor} = await this.nombres(regStatus);
			if (!nombre) continue;

			// Más variables
			const aprobado =
				([creado_id, recuperar_id].includes(regStatus.statusOriginal_id) &&
					aprobados_ids.includes(regStatus.statusFinal_id)) ||
				(regStatus.statusOriginal_id == inactivar_id && regStatus.statusFinal_id == inactivo_id);
			const altaAprob = regStatus.statusOriginal_id == creado_id && aprobado;
			const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(regStatus.entidad);
			const statusOrigNombre = statusRegistros.find((n) => n.id == regStatus.statusOriginal_id).nombre;
			const statusFinalNombre = statusRegistros.find((n) => n.id == regStatus.statusFinal_id).nombre;

			// Motivo
			let motivo;
			if (!aprobado) {
				const motivoAux = statusMotivos.find((n) => n.id == regStatus.motivo_id);
				motivo = regStatus.comentario ? regStatus.comentario : motivoAux ? motivoAux.descripcion : "";
			}

			// Transforma el resultado
			resultados.push({
				...{familia, entidadNombre, nombre, anchor, altaAprob},
				...{statusOrigNombre, statusFinalNombre, aprobado, motivo},
			});
		}

		// Ordena la información según los campos de mayor criterio, siendo el primero la familia y luego la entidad
		resultados.sort((a, b) => (a.nombre < b.nombre ? -1 : a.nombre > b.nombre ? 1 : 0));
		resultados.sort((a, b) => (a.entidadNombre < b.entidadNombre ? -1 : a.entidadNombre > b.entidadNombre ? 1 : 0));
		resultados.sort((a, b) => (a.familia < b.familia ? -1 : a.familia > b.familia ? 1 : 0));

		// Crea el mensaje
		const mensajeGlobal = this.creaElMensajeStatus(resultados);

		// Fin
		return mensajeGlobal;
	},
	mensajeEdicion: async function (regsEdic) {
		// Variables
		let resultados = [];
		let mensajesAcum = "";
		let mensajesCampo, mensaje, color;

		// De cada registro, obtiene los campos clave o los elabora
		for (let regEdic of regsEdic) {
			// Variables
			const aprobado = !regEdic.motivo_id;
			const familia = comp.obtieneDesdeEntidad.familia(regEdic.entidad);
			const {nombre, anchor} = await this.nombres(regEdic);
			if (!nombre) continue;

			// Alimenta el resultado
			resultados.push({
				...{aprobado, familia, nombre, anchor},
				entidadNombre: comp.obtieneDesdeEntidad.entidadNombre(regEdic.entidad),
				entidad_id: regEdic.entidad_id,
				campo: regEdic.titulo,
				valorAprob: regEdic.valorAprob,
				valorDesc: regEdic.valorDesc,
				motivo: !aprobado ? regEdic.motivo.descripcion : "",
			});
		}

		// Ordena la información según los campos de mayor criterio, siendo el primero la familia y luego la entidad
		resultados = this.ordenarEdic(resultados);

		// Crea el mensaje en formato texto para cada entidad, y sus campos
		resultados.forEach((n, i) => {
			// Acciones por nueva entidad/entidad_id
			if (
				!i ||
				(i && (n.entidadNombre != resultados[i - 1].entidadNombre || n.entidad_id != resultados[i - 1].entidad_id))
			) {
				// Título de la entidad y nombre del producto
				mensaje = n.entidadNombre + ": <b>" + n.anchor + "</b>";
				mensajesAcum += formatos.li(mensaje);
				// Borra los mensajes anteriores que tuviera
				mensajesCampo = "";
			}

			// Adecua la info para el avatar
			if (n.campo == "Avatar") {
				// Variables
				const texto = n.aprobado ? {aprob: "sugerida", desc: "anterior"} : {aprob: "vigente", desc: "sugerida"};
				n.valorAprob = this.avatarConLink(n.familia, n.valorAprob, texto.aprob);
				n.valorDesc = this.avatarConLink(n.familia, n.valorDesc, texto.desc);
			}

			// Dots + campo
			mensaje = n.campo + ": ";
			mensaje += n.aprobado
				? n.valorAprob && n.valorDesc
					? "<em><b>" + n.valorAprob + "</b></em> reemplazó a <em>" + n.valorDesc + "</em>"
					: "<em><b>" + n.valorAprob + "</b></em>"
				: "se mantuvo <em><b>" +
				  (n.valorAprob ? n.valorAprob : "(vacío)") +
				  "</b></em> como mejor opción que <em>" +
				  (n.valorDesc ? n.valorDesc : "(vacío)") +
				  "</em>. Motivo: " +
				  n.motivo.toLowerCase();

			color = n.aprobado ? "green" : "firebrick";
			mensajesCampo += formatos.li(mensaje, color);

			// Acciones por fin de la entidad/entidad_id
			if (
				i == resultados.length - 1 ||
				n.entidadNombre != resultados[i + 1].entidadNombre ||
				n.entidad_id != resultados[i + 1].entidad_id
			)
				mensajesAcum += formatos.ul(mensajesCampo);
		});

		// Crea el mensajeGlobal
		const titulo = formatos.h2("Ediciones");
		mensajesAcum = formatos.ol(mensajesAcum);
		const mensajeGlobal = titulo + mensajesAcum;

		// Fin
		return mensajeGlobal;
	},
	// Feedback para usuarios - auxiliar
	nombres: async (reg) => {
		// Variables
		const {entidad, entidad_id} = reg;
		const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);
		let nombre, anchor;

		// Fórmulas
		if (reg.entidad != "links") {
			// Obtiene el registro
			const prodRclv = await baseDatos.obtienePorId(reg.entidad, reg.entidad_id);
			if (!prodRclv) return {};

			// Obtiene los nombres
			nombre = comp.nombresPosibles(prodRclv);
			anchor =
				"<a " +
				("href='" + urlHost + "/" + entidad + "/detalle/" + siglaFam + "/") +
				("?id=" + entidad_id) +
				"' style='color: inherit; text-decoration: none'" +
				(">" + nombre + "</a>");
		} else {
			// Obtiene el registro
			const asocs = variables.entidades.prodAsocs;
			const link = await baseDatos.obtienePorId("links", reg.entidad_id, [...asocs, "prov"]);
			if (!link.id) return {};

			// Obtiene el nombre
			const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(link);
			nombre = comp.nombresPosibles(link[prodAsoc]);

			// Obtiene el anchor
			link.href = link.prov.embededAgregar ? urlHost + "/links/mirar/l/?id=" + link.id : "//" + link.url;
			anchor = "<a href='" + link.href + "' style='color: inherit; text-decoration: none'>" + nombre + "</a>";
		}

		// Fin
		return {nombre, anchor};
	},
	creaElMensajeStatus: (resultados) => {
		// Variables
		let mensajesAcum = "";
		let mensajesAltas = "";
		let mensajesAprob = "";
		let mensajesRech = "";
		let color;

		// Crea el mensaje en formato texto para cada registro de status, y se lo asigna a mensajesAprob o mensajesRech
		resultados.map((n) => {
			// Crea el mensaje
			let mensaje = n.entidadNombre + ": <b>" + n.anchor + "</b>";

			if (!n.altaAprob) {
				// Mensaje adicional
				mensaje += ", de status <em>" + n.statusOrigNombre.toLowerCase() + "</em>";
				mensaje += " a status <em>" + n.statusFinalNombre.toLowerCase() + "</em>";

				// Mensaje adicional si hay un motivo
				if (n.motivo) mensaje += ". <u>Motivo</u>: " + n.motivo;
			}

			// Le asigna un color
			color = n.aprobado ? "green" : "firebrick";
			mensaje = formatos.li(mensaje, color);

			// Agrega el mensaje al sector que corresponda
			n.altaAprob
				? (mensajesAltas += mensaje) // altas aprobadas
				: n.aprobado
				? (mensajesAprob += mensaje) // otros cambios aprobados
				: (mensajesRech += mensaje); // rechazados
		});

		// Crea el mensajeGlobal, siendo primero los aprobados y luego los rechazados
		if (mensajesAltas) mensajesAcum += formatos.h2("Altas APROBADAS") + formatos.ol(mensajesAltas);
		if (mensajesAprob) mensajesAcum += formatos.h2("Status - Cambios APROBADOS") + formatos.ol(mensajesAprob);
		if (mensajesRech) mensajesAcum += formatos.h2("Status - Cambios RECHAZADOS") + formatos.ol(mensajesRech);

		// Fin
		return mensajesAcum;
	},
	ordenarEdic: (resultados) =>
		resultados.sort((a, b) =>
			a.familia < b.familia // Familia
				? -1
				: a.familia > b.familia
				? 1
				: a.entidadNombre < b.entidadNombre // Entidad
				? -1
				: a.entidadNombre > b.entidadNombre
				? 1
				: a.nombre < b.nombre // Nombre del Producto o Rclv, o url del Link
				? -1
				: a.nombre > b.nombre
				? 1
				: a.entidad_id < b.entidad_id // Para nombres iguales, separa por id
				? -1
				: a.entidad_id > b.entidad_id
				? 1
				: a.aprobado > b.aprobado // Primero los campos aprobados
				? -1
				: a.aprobado < b.aprobado
				? 1
				: a.campo < b.campo // Orden alfabético de los campos
				? -1
				: a.campo > b.campo
				? 1
				: 0
		),
	avatarConLink: (familia, valor, texto) => {
		// Variables
		const terminacion = '" style="color: inherit; text-decoration: none"><u>' + texto + "</u></a>";
		const rutaDir = familia == "producto" ? carpProds.final : carpRclvs.final;
		const rutaArchUrl = (familia == "producto" ? "/imgsPropio/1-Productos" : "/imgsComp/2-Rclvs") + "/Final/" + valor;
		texto = "la imagen " + texto;

		// Fin
		return !valor
			? "" // si no tiene un valor
			: valor.includes("/")
			? '<a href="' + valor + terminacion // si es una imagen externa a ELC
			: comp.gestionArchivos.existe(path.join(rutaDir, valor))
			? '<a href="' + urlHost + rutaArchUrl + terminacion // si se encuentra el archivo
			: texto; // si no se encuentra el archivo
	},
};

// Variables
const normalize = "style='font-family: Calibri; line-height 1; color: rgb(37,64,97); ";

// Funciones
const formatos = {
	h2: (texto) => "<h2 " + normalize + "font-size: 18px'>" + texto + "</h2>",
	h3: (texto) => "<h3 " + normalize + "font-size: 16px'>" + texto + "</h3>",
	ol: (texto) => "<ol " + normalize + "font-size: 14px'>" + texto + "</ol>",
	ul: (texto) => "<ul " + normalize + "font-size: 14px'>" + texto + "</ul>",
	li: (texto, color) => {
		let formato = normalize;
		if (color) formato = formato.replace("rgb(37,64,97)", color);
		return "<li " + formato + "font-size: 14px'>" + texto + "</li>";
	},
	a: (texto, registro) => {
		// Variables
		const siglaFam = comp.obtieneDesdeEntidad.siglaFam(registro.entidad);
		const operacion = {[creado_id]: "alta/" + siglaFam, [inactivar_id]: "inactivar", [recuperar_id]: "recuperar"}; // operaciones de revisión para prioritarios

		// Arma la respuesta
		let respuesta = '<a href="' + urlHost + "/revision/"; // baseUrl
		respuesta += operacion[registro.statusRegistro_id] + "/"; // tarea
		respuesta += registro.entidad + "/?id=" + registro.id; // entidad + id
		respuesta += '" style="color: inherit; text-decoration: none"'; // formato
		respuesta += ">" + texto + "</a>"; // texto del mensaje

		// Fin
		return respuesta;
	},
};
