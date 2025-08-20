"use strict";

// Variables fijas
const mesesAbrev = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const unMinuto = 60 * 1000;
const caractsAmplio = /^[a-záéíóúüñ ,.'&$:;…"°¿?¡!+/()\d\-]+$/i;
const caractsBasico = /^[a-záéíóúüñ0-9. \-]+$/i;
const entidades = [
	...["peliculas", "colecciones", "capitulos"],
	...["personajes", "hechos", "temas", "eventos", "epocasDelAno"],
	...["links", "usuarios"],
];
const mensajeSoloCastell = "Sólo se admiten letras del abecedario castellano";

// Variables obtenidas del url
const {pathname} = location;
const entidad = entidades.find((n) => pathname.includes(n));
const id = new URL(location.href).searchParams.get("id");
const edicId = new URL(location.href).searchParams.get("edicId");
const origen = new URL(location.href).searchParams.get("origen");
let errores;

// Funciones
const keyPressed = (e) => {
	// Variables
	const localName = e.target.localName;
	const type = e.target.type;

	// Previene el uso del 'enter'
	if (e.key == "Enter" && localName == "textarea") e.preventDefault();

	// Limita el uso del teclado solamente a los caracteres que nos interesan
	if ((localName == "input" && type == "text") || localName == "textarea") {
		if (!caractsAmplio.test(e.key)) e.preventDefault();
	}

	// Fin
	return;
};
const amplio = {
	input: (e) => {
		if (!e.target.value) return;

		// Variables
		const localName = e.target.localName;
		const type = e.target.type;
		const valorInicial = e.target.value;
		let valor = valorInicial;

		// Validaciones
		if (!valor.length || ((localName != "input" || type != "text") && localName != "textarea")) return;

		// Reemplaza los caracteres que nos interesan
		valor = valor
			.replace(/[\t\n\r]/g, " ") // previene el uso de 'tab' y 'return'
			.replace(/[ ]/g, " "); // previene el uso de espacios 'raros'

		// Elimina los caracteres que no nos interesan
		let posicCursor = e.target.selectionStart;
		const valorRef = valor;
		valor = valor.replace(/[^a-záéíóúüñ ,.'&$:;…"°¿?¡!+/()\d\-]+/gi, "");

		// Reemplaza el valor del DOM
		if (valor != valorInicial) e.target.value = valor;
		if (valorRef != valor) e.target.selectionEnd = posicCursor - 1; // debe estar al final

		// Fin
		return;
	},
	validaCaracteres: (dato) => (!caractsAmplio.test(dato) ? mensajeSoloCastell : ""),
};
const basico = {
	input: (e) => {
		// Primeras tareas
		amplio.input(e);
		if (!e.target.value) return;

		// Reemplaza
		e.target.value = e.target.value.replace(/[^a-záéíóúüñ0-9. \-]+$/gi, "");

		// Fin
		return;
	},
	validaCaracteres: (dato) => (!caractsBasico.test(dato) ? mensajeSoloCastell : ""),
};
const edicionesChange = (e, respetarMinusc) => {
	if (!e.target.value) return;

	// Variables
	const localName = e.target.localName;
	const type = e.target.type;
	const valorInicial = e.target.value;
	let valor = valorInicial;

	// Validaciones
	if (!valorInicial.length || ((localName != "input" || type != "text") && localName != "textarea")) return;

	// Previene la repetición de espacios
	valor = valor.replace(/ +/g, " ");

	// El primer caracter no puede ser un espacio
	if (valor.slice(0, 1) == " ") valor = valor.slice(1);

	// El ultimo caracter no puede ser un espacio
	if (valor.slice(-1) == " ") valor = valor.slice(0, -1);

	// Primera letra en mayúscula
	if (!respetarMinusc) valor = valor.slice(0, 1).toUpperCase() + valor.slice(1);

	// Reemplaza el valor del DOM
	if (valor != valorInicial) e.target.value = valor;

	// Fin
	return;
};
const desplazamHoriz = () => {
	// Variables
	const DOM = {
		// Cuerpo
		cuerpo: document.querySelector("#cuerpo"),

		// Íconos
		izquierda: document.querySelector(".fa-caret-left"),
		derecha: document.querySelector(".fa-caret-right"),

		// Productos
		resultados: document.querySelector("#listado"),
		botones: document.querySelectorAll("#listado li"),
	};
	const botonesAncho = DOM.botones[0].offsetWidth; // incluye todo
	const resultadosAnchoVisible = DOM.resultados.clientWidth; // excluye los bordes
	const cantBotonesVisibles = parseInt(resultadosAnchoVisible / botonesAncho);
	let indiceFocus = 0;
	let posicion = 0;

	// Fórmulas
	const inactivaIconosMovim = () => {
		posicion == 0 ? DOM.izquierda.classList.add("inactivo") : DOM.izquierda.classList.remove("inactivo");
		posicion >= (DOM.botones.length - cantBotonesVisibles) * botonesAncho
			? DOM.derecha.classList.add("inactivo")
			: DOM.derecha.classList.remove("inactivo");
	};
	const movimientos = () => {
		// Mantiene el foco dentro de valores aceptables
		indiceFocus = Math.max(0, indiceFocus);
		indiceFocus = Math.min(indiceFocus, DOM.botones.length - 1);

		// Mantiene la posicion dentro de valores aceptables
		posicion = Math.min(posicion, indiceFocus * botonesAncho);
		posicion = Math.max(0, posicion, (indiceFocus - 1) * botonesAncho);

		// Foco en el botón y mueve el 'ul'
		DOM.botones[indiceFocus].focus();
		DOM.resultados.scrollTo(posicion, 0);

		// Fin
		inactivaIconosMovim();
		return;
	};

	// Desplazamiento por teclado
	DOM.cuerpo.addEventListener("keydown", (e) => {
		// Anular desplazamientos naturales
		let teclasDesplazamiento = [
			"Home",
			"End",
			"PageUp",
			"PageDown",
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"Tab",
		];
		if (teclasDesplazamiento.includes(e.key)) e.preventDefault();
		// Si fue otra tecla, termina el proceso
		else return;

		// Home y End
		if (e.key == "Home") indiceFocus = 0;
		else if (e.key == "End") indiceFocus = DOM.botones.length - 1;
		// Page Up / Down
		else if (e.key == "PageUp" || (e.key == "Tab" && e.shiftKey)) {
			indiceFocus = indiceFocus - cantBotonesVisibles;
			posicion = DOM.resultados.scrollLeft - resultadosAnchoVisible;
		} else if (e.key == "PageDown" || (e.key == "Tab" && !e.shiftKey)) {
			indiceFocus = indiceFocus + cantBotonesVisibles;
			posicion = DOM.resultados.scrollLeft + resultadosAnchoVisible;
		}
		// Arrows
		else if (e.key == "ArrowUp" || e.key == "ArrowLeft") indiceFocus = indiceFocus - 1;
		else if (e.key == "ArrowDown" || e.key == "ArrowRight") indiceFocus = indiceFocus + 1;

		// Fin
		movimientos();
	});
	// Desplazamiento por íconos
	DOM.izquierda.addEventListener("click", () => {
		if (!DOM.izquierda.className.includes("inactivo")) {
			indiceFocus = indiceFocus - cantBotonesVisibles;
			posicion = DOM.resultados.scrollLeft - resultadosAnchoVisible;
			movimientos(indiceFocus);
		} else DOM.botones[indiceFocus].focus();
	});
	DOM.derecha.addEventListener("click", () => {
		if (!DOM.derecha.className.includes("inactivo")) {
			indiceFocus = indiceFocus + cantBotonesVisibles;
			posicion = DOM.resultados.scrollLeft + resultadosAnchoVisible;
			movimientos(indiceFocus);
		} else DOM.botones[indiceFocus].focus();
	});

	// Statup
	inactivaIconosMovim();
};
const pierdeTiempo = (ms) => new Promise((n) => setTimeout(n, ms));
const revisaAvatar = async ({DOM, v, FN, version, indice}) => {
	// 1. Acciones si se omitió ingresar un archivo
	if (!DOM.inputAvatar.value) {
		// Vuelve a la imagen original
		DOM.imgAvatar.src = v.avatarInicial;

		// Oculta el iconoOK
		if (DOM.ocultaOK_imagen) DOM.ocultaOK_imagen.classList.add("ocultaOK_imagen");

		// Actualiza los errores
		v.esImagen = true;
		await FN.actualizaVarios(indice);

		// Fin
		return;
	}

	// 2. De lo contrario, actualiza los errores y el avatar
	let reader = new FileReader();
	reader.readAsDataURL(DOM.inputAvatar.files[0]);
	reader.onload = () => {
		let image = new Image();
		image.src = reader.result;

		// Acciones si es realmente una imagen
		image.onload = async () => {
			// Actualiza la imagen del avatar en la vista
			DOM.imgAvatar.src = reader.result;

			// Muestra el iconoOK
			if (DOM.ocultaOK_imagen) DOM.ocultaOK_imagen.classList.remove("ocultaOK_imagen");

			// Actualiza la variable 'avatar' en la versión 'edicN'
			if (DOM.inputAvatarEdicN && DOM.inputAvatarEdicN.value) version.edicN.avatar = DOM.inputAvatarEdicN.files[0].name;

			// Actualiza los errores
			v.esImagen = true;
			await FN.actualizaVarios(indice);

			// Fin
			return;
		};

		// Acciones si no es una imagen
		image.onerror = async () => {
			// Limpia el avatar
			DOM.imgAvatar.src = "/imgsPropio/Avatar/Sin-Avatar.jpg";

			// Actualiza la variable 'avatar' en la versión 'edicN'
			if (DOM.inputAvatarEdicN && DOM.inputAvatarEdicN.value) version.edicN.avatar = "";

			// Actualiza los errores
			v.esImagen = false;
			await FN.actualizaVarios(indice);

			// Limpia el input
			DOM.inputAvatar.value = ""; // va después de 'actualiza los errores' para poner en evidencia que el error es el tipo de archivo

			// Fin
			return;
		};
	};
};
const contenidoDelCartelGenerico = ({DOM, mensajes, clase, titulo, link}) => {
	// Mensajes - crea el sector
	DOM.mensajes = document.createElement("ul");
	DOM.mensajes.id = "mensajes";
	DOM.mensajes.style.listStyleType = "disc";
	DOM.contenedorMensajes.appendChild(DOM.mensajes);

	// Mensajes - contenido
	for (let mensaje of mensajes) {
		const li = document.createElement("li");
		li.innerHTML = mensaje;
		DOM.mensajes.appendChild(li);
	}

	// Crea el ícono
	const i = document.createElement("i");
	i.classList.add("fa-solid", clase);
	i.title = titulo;

	// Crea el anchor
	const a = document.createElement("a");
	a.href = link;
	a.tabIndex = "1";
	a.appendChild(i);

	// Crea el div 'iconosCartel'
	const div = document.createElement("div");
	div.id = "iconosCartel";
	div.appendChild(a);

	// Agrega todo al DOM
	DOM.cartelGenerico.appendChild(div);
	DOM.cartelGenerico.querySelector("#iconosCartel a").focus();

	// Fin
	return;
};
const obtieneSiglaFam = () =>
	["peliculas", "colecciones", "capitulos", "prodEdics"].includes(entidad)
		? "p"
		: ["personajes", "hechos", "temas", "eventos", "epocasDelAno", "rclvEdics"].includes(entidad)
		? "r"
		: entidad == "links"
		? "l"
		: entidad == "usuarios"
		? "u"
		: "";
const siglaFam = obtieneSiglaFam();
const barraProgreso = async (pre, APIs) => {
	// Variables
	const DOM = {
		cartelProgreso: document.querySelector("#cartelProgreso"),
		tituloCartel: document.querySelector("#cartelProgreso #titulo"),
		progreso: document.querySelector("#cartelProgreso #progreso"),
	};
	const pausa = 100; // milisegundos
	const pausaBreve = pausa / 4;
	let duracTotal = 0;
	let duracAcum = 0;
	let duracEstim = 0;
	let desvio = 0;
	let respuesta;

	// Muestra el cartelProgreso
	DOM.progreso.style.width = "0%";
	DOM.cartelProgreso.classList.add("aparece");
	DOM.cartelProgreso.classList.remove("ocultar");

	// Averigua la duración total
	for (let API of APIs) duracTotal += API.duracion;

	// Ejecuta las APIs
	const inicio = Date.now();
	for (let API of APIs) {
		// Busca la información
		let pendiente = true;
		respuesta = fetch(pre + API.ruta).then((n) => {
			pendiente = false;
			return n;
		});

		// Evoluciona el progreso mientras espera la información
		duracEstim += API.duracion;
		while (pendiente) {
			await pierdeTiempo(pausa - desvio);

			// Evoluciona el progreso
			if (duracAcum < duracEstim) {
				duracAcum += pausa;
				desvio = Date.now() - inicio - duracAcum;
				DOM.progreso.style.width = Math.round(((duracAcum + Math.min(desvio, pausa)) / duracTotal) * 100) + "%";
			}
		}
		respuesta = await respuesta;
		if (respuesta.statusText != "OK") {
			DOM.cartelProgreso.classList.add("ocultar");
			DOM.cartelProgreso.classList.remove("aparece");
			return "Tuvimos un problema con una API";
		}
	}

	// Completa la barra de progreso
	while (duracAcum < duracEstim) {
		await pierdeTiempo(pausaBreve);
		duracAcum += pausa;
		DOM.progreso.style.width = Math.round((duracAcum / duracTotal) * 100) + "%";
	}
	await pierdeTiempo(pausa);

	// Oculta el cartelProgreso
	DOM.cartelProgreso.classList.remove("aparece");
	DOM.cartelProgreso.classList.add("ocultar");

	// Fin
	return respuesta.json();
};
const inactivaEliminaLink = async ({DOM, fila, botonOut, ruta}) => {
	// Variables
	const columnas = DOM.taparMotivo.length / DOM.yaExistentes.length;
	DOM.motivosSelect = document.querySelectorAll(".yaExistentes .motivo select");

	// Muestra los motivos
	if (!botonOut.className.includes("fa-trash-can")) {
		// Oculta el botón de edicion
		if (DOM.botonesEditar && DOM.botonesEditar.length) DOM.botonesEditar[fila].classList.add("ocultar");

		// Reemplaza el ícono por el tacho
		botonOut.classList.replace("fa-circle-xmark", "fa-trash-can");

		// Oculta los 6 campos
		for (let columna = 0; columna < columnas; columna++) DOM.taparMotivo[fila * columnas + columna].classList.add("ocultar");

		// Muestra el select
		DOM.motivos[fila].classList.remove("ocultar");
		DOM.motivosSelect[fila].focus();
	}

	// Inactiva
	else {
		// Obtiene los datos
		let url = "?prodEnt=" + entidad + "&prodId=" + id;
		url += "&url=" + encodeURIComponent(DOM.linksUrl[fila].value);
		url += "&IN=NO";
		url += "&aprob=NO";
		url += "&motivo_id=" + DOM.motivosSelect[fila].value;

		// Envía la decisión y oculta la fila
		await fetch(ruta + url).then((n) => n.json());
		DOM.yaExistentes[fila].classList.add("ocultar");

		// Fin
		return;
	}
};
