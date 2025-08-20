"use strict";
window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		trsResumen: document.querySelectorAll("tbody tr.resumen"),
		mostrarOcultarTodas: document.querySelectorAll("tbody tr.resumen td .mostrar i"),
	};

	// Eventos
	DOM.mostrarOcultarTodas.forEach((mostrarOcultar, i) => {
		mostrarOcultar.addEventListener("click", () => {
			// Obtiene las filas a mostrar/ocultar
			const id = DOM.trsResumen[i].id;
			const filasMostrarOcultar = document.querySelectorAll("tbody tr#" + id + ":not(.resumen)");

			// Acciones de ocultar o mostrar
			const mostrar = mostrarOcultar.className.includes("fa-circle-plus");
			for (let fila of filasMostrarOcultar) mostrar ? fila.classList.remove("ocultar") : fila.classList.add("ocultar");
			mostrar
				? mostrarOcultar.classList.replace("fa-circle-plus", "fa-circle-minus")
				: mostrarOcultar.classList.replace("fa-circle-minus", "fa-circle-plus");
		});
	});

	// Fin
	return
});
