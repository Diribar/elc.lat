"use strict";
window.addEventListener("load", () => {
	// Variables
	let DOM = {
		datos: document.querySelector("#cuerpo #datos") || document.querySelector("#cuerpo #tabla"),
		imgDerecha: document.querySelector("#imgDerecha"),
	};
	DOM = {
		...DOM,
		// Íconos del título
		iconosDelTitulo: document.querySelector("#tituloPrincipal #iconosDelTitulo"),

		// Sector Cuerpo
		datosLargos: DOM.datos.querySelector("#datosLargos"),
		datosBreves: DOM.datos.querySelector("#datosBreves"),

		// Sector Imagen Derecha
		imagen: DOM.imgDerecha.querySelector("img"),
		links: DOM.imgDerecha.querySelector("#links"),
		sectorIconos: DOM.imgDerecha.querySelector("#sectorIconos"),
	};

	// Más variables
	if (DOM.sectorIconos) {
		DOM.mobile = DOM.sectorIconos.querySelector("#mobile");
		DOM.iconoVer = DOM.mobile.querySelector("#iconoVer");
		DOM.iconoDL = DOM.mobile.querySelector("#iconoDL");
		DOM.iconoDB = DOM.mobile.querySelector("#iconoDB");
	}
	let parado = window.matchMedia("(orientation: portrait)").matches;
	let muestra;

	// Funciones
	const FN = {
		startUp: () => {
			if (parado) {
				if (DOM.datosBreves) DOM.datosBreves.classList.add("toggle"); // oculta datosBreves

				// Si existe links, los muestra y muestra iconoDL
				if (DOM.links) {
					DOM.links.classList.remove("toggle");
					if (DOM.datosLargos) DOM.datosLargos.classList.add("toggle"); // oculta datosLargos
					if (DOM.iconoDL) DOM.iconoDL.classList.remove("toggle"); // muestra iconoDL
					if (DOM.iconoDB) DOM.iconoDB.classList.add("toggle"); // oculta iconoDB
				}
				// Si no existe links, muestra DL e ícono DB
				else {
					if (DOM.datosLargos) DOM.datosLargos.classList.remove("toggle"); // muestra datosLargos
					if (DOM.iconoDL) DOM.iconoDL.classList.add("toggle"); // oculta iconoDL
					if (DOM.iconoDB) DOM.iconoDB.classList.remove("toggle"); // muestra iconoDB
				}
			} else {
				// Datos Largos
				if (DOM.datosLargos) DOM.datosLargos.classList.remove("toggle"); // muestra datosLargos
				if (DOM.iconoDL) DOM.iconoDL.classList.add("toggle"); // oculta iconoDL

				// Datos Breves
				if (DOM.datosBreves) DOM.datosBreves.classList.add("toggle"); // oculta datosBreves
				if (DOM.iconoDB) DOM.iconoDB.classList.remove("toggle"); // muestra iconoDB

				// Links
				if (DOM.links) DOM.links.classList.remove("toggle");
			}

			// Varios
			if (DOM.iconoVer) DOM.iconoVer.classList.add("toggle"); // oculta iconoVer
			muestra = true;

			// Fin
			return;
		},
		imagenParado: function () {
			// Si se está mostrando, oculta todo
			if (muestra) {
				DOM.datos.classList.add("ocultar");
				if (DOM.iconosDelTitulo) DOM.iconosDelTitulo.classList.add("ocultar");
			}
			// Si está todo oculto, muestra
			else {
				DOM.datos.classList.remove("ocultar");
				if (DOM.iconosDelTitulo) DOM.iconosDelTitulo.classList.remove("ocultar");
			}
			this.imagenAcostado();
		},
		imagenAcostado: () => {
			// Si se está mostrando, oculta todo
			if (muestra) {
				if (DOM.links) DOM.links.classList.add("ocultar");
				if (DOM.sectorIconos) DOM.sectorIconos.classList.add("ocultar");
				muestra = false;
			}
			// Si está todo oculto, muestra
			else {
				if (DOM.links) DOM.links.classList.remove("ocultar");
				if (DOM.sectorIconos) DOM.sectorIconos.classList.remove("ocultar");
				muestra = true;
			}
		},
	};

	// Event listeners - Muestra 'ver'
	if (DOM.iconoVer) DOM.iconoVer.addEventListener("click", () => FN.startUp());

	// Event listeners - Muestra datosLargos
	if (DOM.iconoDL)
		DOM.iconoDL.addEventListener("click", () => {
			// Datos
			DOM.datosLargos.classList.remove("toggle"); // muestra datosLargos
			DOM.datosBreves.classList.add("toggle"); // oculta datosBreves

			// Íconos
			DOM.iconoDL.classList.add("toggle"); // oculta iconoDL
			DOM.iconoDB.classList.remove("toggle"); // muestra iconoDB

			// Links
			if (parado && DOM.links) DOM.links.classList.add("toggle");
		});

	// Event listeners - Muestra datosBreves
	if (DOM.iconoDB)
		DOM.iconoDB.addEventListener("click", () => {
			// Datos
			DOM.datosLargos.classList.add("toggle"); // oculta datosLargos
			DOM.datosBreves.classList.remove("toggle"); // muestra datosBreves

			// Íconos
			DOM.iconoDB.classList.add("toggle"); // oculta iconoDB
			DOM.iconoVer
				? DOM.iconoVer.classList.remove("toggle") // muestra iconoVer
				: DOM.iconoDL.classList.remove("toggle"); // muestra iconoDL

			// Links
			if (parado && DOM.links) DOM.links.classList.add("toggle");
		});

	// Event listeners - Start-up / 'click' en la imagen
	for (let sector of [DOM.imagen, DOM.sectorIconos])
		if (sector)
			sector.addEventListener("click", (e) => {
				if (e.target.localName == "img" || e.target.id == "sectorIconos")
					parado ? FN.imagenParado() : FN.imagenAcostado();
			});

	// Event listeners - Recarga la vista si se gira
	screen.orientation.addEventListener("change", () => location.reload());

	// Start-up
	FN.startUp();
	if (DOM.mobile) DOM.mobile.classList.remove("invisible");
});

// Variables
const tarea = location.pathname;
const califica = tarea.includes("/califica/p");
const rclvDetalle = tarea.includes("/detalle/r");
