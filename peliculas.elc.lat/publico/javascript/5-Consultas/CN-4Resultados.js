"use strict";

const FN_resultados = {
	obtiene: async function () {
		// Si no se cumplen las condiciones mínimas, termina la función
		if (!v.layout_id) return;

		// Oculta el contador y todos los carteles
		DOM.contadorDeProds.classList.add("ocultar");
		for (let cartel of DOM.carteles) cartel.classList.add("ocultar");

		// Acciones si el usuario no está logueado y es requerido
		if (!v.usuario_id && v.layoutBD.grupoSelect == "loginNeces") {
			DOM.loginNecesario.classList.remove("ocultar");
			return;
		}

		// Si la opción es 'misPrefs' y el usuario no tiene 'PPPs', muestra el cartel 'cartelOrdenPPP' y termina
		if (v.usuario_id && v.layoutBD.codigo == "misPrefs" && !v.usuarioTienePPP) {
			DOM.cartelOrdenPPP.classList.remove("ocultar");
			return;
		}

		// Si corresponde, completa la información
		if (v.layoutBD.codigo.startsWith("santoral")) {
			v.ahora = new Date();
			prefs.dia = v.ahora.getDate();
			prefs.mes = v.ahora.getMonth() + 1;
		}

		// Busca la información en el BE
		const APIs = [{ruta: "obtiene-los-resultados/?datos=" + JSON.stringify(prefs), duracion: 1000}]; // 'duración' son los milisegs que se estima que puede durar el fetch
		v.resultados = await barraProgreso(ruta, APIs);

		// Tapa y limpia los resultados anteriores
		DOM.botones.innerHTML = "";

		// Acciones en consecuencia
		if (prefs.entidad == "productos") v.productos = v.resultados;
		if (!v.resultados || !v.resultados.length) DOM.noTenemos.classList.remove("ocultar"); // si no hay resultados, muestra el cartel 'noTenemos'

		// Contador
		this.contador();

		// Fin
		return;
	},
	// Contador para productos
	contador: () => {
		// Variables
		const total = v.resultados ? v.resultados.length : 0;

		// Contador para Productos
		if (v.entidad == "productos") DOM.contadorDeProds.innerHTML = total;
		// Contador para rclvs
		else {
			// Variables
			const cantRclvs = total;
			let cantProds = 0;
			if (v.resultados) for (let rclv of v.resultados) cantProds += rclv.productos.length;

			// Actualiza el contador
			DOM.contadorDeProds.innerHTML = cantRclvs + " x " + cantProds;
		}

		// Muestra el contador
		DOM.contadorDeProds.classList.remove("ocultar");

		// Fin
		return;
	},
	muestra: function () {
		// Si no hubieron resultados, interrumpe la función
		if (!v.resultados || !v.resultados.length) return;

		// Oculta el telón de fondo
		if (v.mostrarResultados) DOM.telonFondo.classList.add("ocultar");

		// Limpia los resultados anteriores
		DOM.botones.innerHTML = "";

		// Deriva a botones
		DOM.zonaDisponible.classList.remove("aumentaCn");
		DOM.zonaDisponible.classList.add("aumentaCn");
		botones.general();

		// Si el usuario no vio el video, muestra el cartel 'ver video'
		v.contadorDeMostrarResults++;
		// if (v.usuario_id && !v.videoConsVisto && v.contadorDeMostrarResults == 1)
		// 	DOM.cartelVerVideo.classList.remove("ocultar");

		if (!(v.contadorDeMostrarResults % 5)) {
			if (v.usuario_id) {
				// Si el usuario no vio el video, muestra un cartel
				//if (!v.videoConsVisto) DOM.cartelVerVideo.classList.remove("ocultar");
				// Si el usuario no tiene 'PPPs', muestra un cartel
				//else
				if (!v.usuarioTienePPP) DOM.cartelUsSinPPP.classList.remove("ocultar");
			}
			// Si el usuario no está logueado, muestra un cartel
			else if (!v.usuario_id) DOM.cartelLoginPend.classList.remove("ocultar");
		}

		// Fin
		return;
	},
};

const botones = {
	general: function () {
		// Agrega el resultado al botón
		for (let resultado of v.resultados) {
			const boton = this.boton(resultado);
			DOM.botones.append(boton);
		}

		// Genera las variables 'ppp'
		if (v.entidad == "productos") {
			DOM.ppps = DOM.botones.querySelectorAll(".registro #ppp");
			v.ppps = Array.from(DOM.ppps);
		}

		// Foco en el primer botón
		DOM.botones.querySelector("button").focus();

		// Fin
		return;
	},
	boton: function (registro) {
		// Variables
		const {entidad, id, productos, religion_id, cfc, avatar, nombreCastellano, nombre} = registro;
		const familia = ["peliculas", "colecciones", "capitulos"].includes(entidad) ? "producto" : "rclv";
		const siglaFam = familia[0];
		const esUnProducto = familia == "producto";

		// Crea el elemento 'li' que engloba todo el registro
		const li = document.createElement("li");
		li.className = "registro";
		li.tabIndex = "-1";

		// Crea el anchor
		const anchor = document.createElement("a");
		anchor.href = "/" + entidad + "/detalle/" + siglaFam + "/?id=" + id;
		anchor.tabIndex = "-1";
		// Ids de productos del rclv
		if (familia == "rclv") {
			let prodsCons = [];
			for (let producto of productos) prodsCons.push([producto.entidad, producto.id]);
			anchor.href += "&prodsCons=" + JSON.stringify(prodsCons); // para filtrar en la vista de detalle
		}
		li.appendChild(anchor);

		// Crea el botón
		const button = document.createElement("button");
		button.type = "text";
		button.className = "flexRow pointer ";
		if (religion_id) button.className += religion_id.toLowerCase();
		else if (cfc) button.className += "cfc";
		anchor.appendChild(button);

		// Crea la imagen
		const img = document.createElement("img");
		const carpeta = esUnProducto ? "/imgsPropio/1-Productos" : "/imgsComp/2-Rclvs";
		img.className = "imagenChica";
		img.src = avatar ? (avatar.includes("/") ? avatar : carpeta + "/Final/" + avatar) : "/imgsPropio/Avatar/Sin-Avatar.jpg";
		img.alt = esUnProducto ? nombreCastellano : nombre;
		img.title = esUnProducto ? nombreCastellano : nombre;
		img.style = "view-transition-name: " + entidad + id;
		button.appendChild(img);

		// Crea el sector de informacion
		const informacion = document.createElement("div");
		informacion.id = "informacion";
		informacion.className = "flexCol";
		button.appendChild(informacion);

		// Datos de un producto o rclv
		if (esUnProducto) this.datosProducto({informacion, producto: registro});
		if (!esUnProducto) this.datosRclv({informacion, rclv: registro});

		// Fin
		return li;
	},
	datosProducto: function ({informacion, producto}) {
		// Crea la infoSup
		const infoSup = document.createElement("div");
		infoSup.id = "infoSup";
		infoSup.className = "infoFormato";
		informacion.appendChild(infoSup);

		// Crea nombreCastellano, anoEstreno, direccion, iconos
		const elementos = ["nombreCastellano", "anoEstreno", "direccion", "iconos"];
		const aux = {};
		for (const elemento of elementos) {
			aux[elemento] = document.createElement("p");
			aux[elemento].id = elemento;
			aux[elemento].className = "interlineadoChico";
			infoSup.appendChild(aux[elemento]);
		}

		// Particularidades
		aux.nombreCastellano.innerHTML = producto.nombreCastellano;
		aux.anoEstreno.innerHTML = producto.anoEstreno + " - " + producto.entidadNombre;

		// Particularidades de Dirección
		const em = document.createElement("em");
		em.innerHTML = producto.direccion;
		aux.direccion.innerHTML = "Dirección: ";
		aux.direccion.appendChild(em);

		// Preferencias por producto
		if (producto.ppp) {
			const icono = document.createElement("i");
			icono.id = "ppp";
			icono.className = "scale " + producto.ppp.icono;
			icono.title = producto.ppp.nombre;
			icono.tabIndex = "-1";
			aux.iconos.appendChild(icono);
		}

		// Links
		if (producto.linksGral) {
			const icono = document.createElement("i");
			icono.id = "tieneLink";
			icono.className = "fa-solid fa-link";
			icono.title = "Tiene link";
			icono.tabIndex = "-1";
			aux.iconos.appendChild(icono);
		}

		// Crueldad
		if (producto.crueldad) {
			const icono = document.createElement("i");
			icono.id = "crueldad";
			icono.className = "fa-solid fa-circle-exclamation";
			icono.title = "Crueldad sensible";
			icono.tabIndex = "-1";
			aux.iconos.appendChild(icono);
		}

		// Calificación
		if (producto.calificacion) {
			aux.iconos.innerHTML += producto.calificacion + "%";
			aux.iconos.title = "Calificación";
		}

		// Crea la infoInf
		const infoInf = document.createElement("div");
		infoInf.id = "infoInf";
		infoInf.className = "infoFormato";
		informacion.appendChild(infoInf);

		// Agrega el rclv en infoInf
		const rclv = FN_auxiliares.obtieneElRclv(producto);
		if (rclv) infoInf.appendChild(rclv);

		// Fin
		return;
	},
	datosRclv: function ({informacion, rclv}) {
		// Variables
		let elementos;

		// Crea la infoSup
		const infoSup = document.createElement("div");
		infoSup.id = "infoSup";
		infoSup.className = "infoFormato";
		informacion.appendChild(infoSup);

		// Crea nombreCastellano, anoEstreno, direccion, ppp
		elementos = ["nombre", "canonRol", "fechaDelAno"];
		let auxSup = {};
		for (let elemento of elementos) {
			if (elemento == "canonRol" && !rclv.canonNombre && !rclv.rolIglesiaNombre) continue;
			auxSup[elemento] = document.createElement("p");
			auxSup[elemento].id = elemento;
			auxSup[elemento].className = "interlineadoChico";
			infoSup.appendChild(auxSup[elemento]);
		}

		// Otras particularidades
		auxSup.nombre.innerHTML = rclv.nombre;
		if (rclv.canonNombre || rclv.rolIglesiaNombre) {
			auxSup.canonRol.innerHTML = "";
			if (rclv.canonNombre) auxSup.canonRol.innerHTML += rclv.canonNombre;
			if (rclv.canonNombre && rclv.rolIglesiaNombre) auxSup.canonRol.innerHTML += " - ";
			if (rclv.rolIglesiaNombre) auxSup.canonRol.innerHTML += rclv.rolIglesiaNombre;
		}
		if (rclv.fechaDelAno) auxSup.fechaDelAno.innerHTML = "Fecha: " + rclv.fechaDelAno;

		// Crea la infoInf
		const infoInf = document.createElement("div");
		infoInf.id = "infoInf";
		infoInf.className = "infoFormato";
		informacion.appendChild(infoInf);

		// Crea nombreCastellano, anoEstreno, direccion, ppp
		elementos = ["epocaOcurrencia", "anoOcurrencia", "productos"];
		let auxInf = {};
		for (let elemento of elementos) {
			if (!rclv[elemento]) continue;
			if (elemento == "epocaOcurrencia" && rclv.anoOcurrencia) continue; // si existe el año de ocurrencia, omite la época de ocurrencia
			auxInf[elemento] = document.createElement("p");
			auxInf[elemento].id = elemento;
			auxInf[elemento].className = "interlineadoChico";
			infoInf.appendChild(auxInf[elemento]);
		}

		// Contenido escrito
		if (auxInf.epocaOcurrencia) auxInf.epocaOcurrencia.innerHTML = rclv.epocaOcurrencia;
		if (rclv.anoOcurrencia)
			auxInf.anoOcurrencia.innerHTML = (rclv.entidad == "personajes" ? "Nacimiento: " : "Comienzo: ") + rclv.anoOcurrencia;
		auxInf.productos.innerHTML = "Películas: " + rclv.productos.length;

		// Fin
		return;
	},
};

const FN_auxiliares = {
	titulo: (registroAct, indice) => {
		// Variables
		const layout = v.layoutBD.codigo;
		let titulo = "";

		// Casos particulares
		if (layout == "santoral") {
			// Variables
			const diaAnt = v.registroAnt.fechaDelAno_id;
			const diaActual = registroAct.fechaDelAno_id;

			// Resultado
			titulo =
				!diaAnt && diaActual < 92
					? "Primer"
					: (!diaAnt || diaAnt < 92) && diaActual >= 92 && diaActual < 183
					? "Segundo"
					: (!diaAnt || diaAnt < 183) && diaActual >= 183 && diaActual < 275
					? "Tercer"
					: (!diaAnt || diaAnt < 275) && diaActual >= 275
					? "Cuarto"
					: "";

			// Fin
			if (titulo) titulo += " Trimestre";
		}
		if (layout.startsWith("nombre")) {
			// Variables
			const nombreAnt = v.registroAnt.nombre ? v.registroAnt.nombre : v.registroAnt.nombreCastellano;
			const nombreActual = registroAct.nombre ? registroAct.nombre : registroAct.nombreCastellano;
			const prefijo = "Rango ";

			// Resultado
			titulo =
				!nombreAnt && nombreActual < "G"
					? "A - F"
					: (!nombreAnt || nombreAnt < "G") && nombreActual >= "G" && nombreActual < "N"
					? "G - M"
					: (!nombreAnt || nombreAnt < "N") && nombreActual >= "N"
					? "N - Z"
					: "";

			// Fin
			if (titulo) titulo = prefijo + titulo;
		}
		if (layout == "anoOcurrencia") {
			// Variables
			const epocaAnt = v.registroAnt.epocaOcurrencia_id;
			const epocaActual = registroAct.epocaOcurrencia_id;
			const anoAnt = v.registroAnt.anoOcurrencia;
			const anoRegActual = registroAct.anoOcurrencia;

			// Resultado
			if (epocaActual == "pst") {
				// Variables
				const mayor1800 = "Año 1.801 en adelante";
				const mayor1000 = "Años 1.001 al 1.800";
				const menorIgual1000 = "Años 34 al 1.000";

				titulo =
					!anoAnt || anoAnt < anoRegActual // ascendente
						? (!anoAnt || anoAnt <= 1800) && anoRegActual > 1800
							? mayor1800
							: (!anoAnt || anoAnt <= 1000) && anoRegActual > 1000
							? mayor1000
							: !anoAnt
							? menorIgual1000
							: ""
						: anoRegActual <= 1000 && anoAnt > 1000 // descendente
						? menorIgual1000
						: anoRegActual <= 1800 && anoAnt > 1800
						? mayor1000
						: "";
			}
			// Épocas anteriores
			else if (epocaAnt != epocaActual) titulo = registroAct.epocaOcurrencia;
		}
		if (layout == "misCalificadas") {
			const califAnt = v.registroAnt.calificacion;
			const califActual = registroAct.calificacion;
			if (!califActual && (califAnt || !Object.keys(v.registroAnt))) titulo = "Vistas sin calificar";
			else if (!indice) titulo = "Mis calificadas";
		}
		// Cambio de grupo
		if (layout == "misPrefs") {
			// Variables
			const nombreAnt = v.registroAnt.ppp ? v.registroAnt.ppp.nombre : "";
			const nombreActual = registroAct.ppp.nombre;

			// Resultado
			if (nombreAnt != nombreActual) titulo = nombreActual;
		}
		if (layout == "anoEstreno") {
			// Variables
			const nombreAnt = v.registroAnt.epocaEstreno;
			const nombreActual = registroAct.epocaEstreno;

			// Resultado
			if (nombreAnt != nombreActual) titulo = nombreActual;
		}

		// Una sola tabla
		if (!indice && ["calificacion", "misConsultas", "altaRevisadaEn"].includes(layout)) titulo = v.layoutBD.nombre;

		// Fin
		return titulo;
	},
	obtieneElRclv: (producto) => {
		for (let rclvNombre of v.rclvsNombre)
			if (producto[rclvNombre]) {
				// Crea el rclv con sus características
				const rclv = document.createElement("p");
				rclv.className = "interlineadoChico rclv";
				rclv.innerHTML = rclvNombre + ": ";

				// Crea el em
				const em = document.createElement("em");
				const fechaDelAno = producto.fechaDelAno;
				em.innerHTML = producto[rclvNombre] + (fechaDelAno ? " (" + fechaDelAno + ")" : "");
				rclv.appendChild(em);

				// Fin
				return rclv;
			}

		// Fin
		return false;
	},
};
