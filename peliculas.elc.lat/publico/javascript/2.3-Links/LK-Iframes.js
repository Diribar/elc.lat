"use strict";
// muestra el iframe del primer link sujeto a revisin
window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		cuerpo: document.querySelector("#cuerpoFooter #cuerpo"),
		filas: document.querySelectorAll(".yaExistentes"), // filas cuyo link no está en status inactivo
		celdasUrl: document.querySelectorAll(".yaExistentes td.url"),
		logos: document.querySelectorAll(".yaExistentes .url a img"), // todos los logos
	};

	// Crea los iframes
	for (const fila of DOM.filas) {
		// Agrega el entorno del iframe
		const contIframe = document.createElement("div");
		contIframe.id = "contIframe";
		contIframe.className = "absoluteCentro ocultar";
		DOM.cuerpo.appendChild(contIframe);

		// Valida si corresponde continuar
		if (fila.querySelector("td.url:has(a[href])")) continue;

		// Agrega el iframe
		const iframe = document.createElement("iframe");
		iframe.setAttribute("allow", "fullscreen");
		contIframe.className += " " + (fila.className.includes("inactivo_false") ? "activo" : "inactivo");
		contIframe.appendChild(iframe);

		// Tareas finales
		const link = fila.querySelector("td.url input[name='url']"); // el url original
		if (link && link.value) iframe.src = await fetch(rutaEmbeded + encodeURIComponent(link.value)).then((n) => n.json());
	}
	DOM.contIframes = DOM.cuerpo.querySelectorAll("#contIframe");

	// Muestra el iframe si se hace click sobre él, y en caso contrario lo oculta
	window.addEventListener("click", (e) => {
		DOM.logos.forEach((logo, i) => {
			if (logo != e.target) DOM.contIframes[i].classList.add("ocultar");
			else if (DOM.contIframes[i].innerHTML) DOM.contIframes[i].classList.remove("ocultar");
		});
	});

	// Start-up para revisión - muestra el iframe del primer link a revisar, y si no tiene no hace nada
	if (location.pathname.startsWith("/revision"))
		for (let i = 0; i < DOM.filas.length; i++)
			if (DOM.filas[i].className.includes("oscuro_false")) {
				if (DOM.contIframes[i].innerHTML) DOM.contIframes[i].classList.remove("ocultar");
				break;
			}

	// Fin
	return;
});

// Variables
const rutaEmbeded = "/links/api/lk-obtiene-embeded/?linkUrl=";
