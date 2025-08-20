"use strict";
window.addEventListener("load", () => {
	// Variables
	const DOM = {
		// General
		yaExistentes: document.querySelectorAll(".yaExistentes"),
		linksUrl: document.querySelectorAll(".yaExistentes input[name='url'"),
		botonesEditar: document.querySelectorAll(".edicion"), // No lleva 'yaExistentes'

		// Objetos a ocultar
		taparMotivo: document.querySelectorAll(".yaExistentes .taparMotivo"),
		motivos: document.querySelectorAll(".yaExistentes .motivo"),
		iconosOut: document.querySelectorAll(".yaExistentes .out"),
	};
	const ruta = "/links/api/lk-inactiva-o-elimina/";

	// Inactiva o elimina
	DOM.iconosOut.forEach((botonOut, fila) => {
		botonOut.addEventListener("click", async () => {
			await inactivaEliminaLink({DOM, fila, botonOut, ruta});
			return
		});
	});
});
