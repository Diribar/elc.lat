"use strict";
window.addEventListener("load", () => {
	// DOM
	const DOM = {
		// Todos los lugares donde hacer click y qué mostrar
		clicks: document.querySelectorAll(".clickIcono"),
		vista: document.querySelectorAll(".clickVista"),

		// Relacionado con búsqueda rápida
		brIcono: document.querySelector("header #busquedaRapida .clickIcono"),
		brMostrar: document.querySelector("header #busquedaRapida .clickVista"), // es el contenedor del input
		brInput: document.querySelector("header #busquedaRapida .clickVista input"), // es el input

		// Varios
		menuMobile: document.querySelector("header #menuMobile"),
	};

	// Mensajes de ayuda
	window.addEventListener("click", (e) => {
		// Acciones que interrumpen la función
		if (
			(typeof e.target.className == "string" && e.target.className.includes("mmSG")) || // Si el click fue en el sector del Select de Gráficos - debe compararse con string, porque hay otros tipos que darían error
			e.target == DOM.brInput // Si el click es en el input de Búsqueda Rápida
		)
			return;

		// Rutina por cada dupla
		for (let i = 0; i < DOM.clicks.length; i++) {
			// Si el 'click' fue fuera de la vista, saltea la rutina
			if (e.target.parentElement == DOM.vista[i]) continue;

			// Se fija si el 'click' fue en el ícono y si está activo
			e.target == DOM.clicks[i] && !DOM.clicks[i].className.includes("inactivo")
				? DOM.vista[i].classList.toggle("ocultar") // caso exitoso, toggle de la vista
				: DOM.vista[i].classList.add("ocultar"); // caso fallido, oculta la vista
		}

		// Foco en búsqueda rápida
		if (e.target == DOM.brIcono && !DOM.brMostrar.className.includes("ocultar")) DOM.brInput.focus();

		// Si el click fue 'menú Mobile búsqueda rápida', muestra el input y hace foco en búsqueda rápida
		if (typeof e.target.className == "string" && e.target.className.includes("mmBR")) {
			DOM.brMostrar.classList.remove("ocultar");
			DOM.brInput.focus();
		}
	});
});
