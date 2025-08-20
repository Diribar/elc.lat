"use strict";
window.addEventListener("load", async () => {
	// Variables
	let form = document.querySelector("#datosLargos #recuadroDL form");
	let comentario = document.querySelector("#comentario textarea");
	let contador = document.querySelector("#comentario #contador");
	let desaprueba = document.querySelector("#sectorIconos label[for='desaprueba']");

	// Activa o desactiva el botón submit
	const botonDesaprobar = () =>
		comentario.value && comentario.value.length > 3
			? desaprueba.classList.remove("inactivo")
			: desaprueba.classList.add("inactivo");

	// Event listeners
	// Comentario
	comentario.addEventListener("keypress", (e) => {
		// Previene el uso del 'enter'
		if (e.key == "Enter") e.preventDefault();

		// Limita el uso del teclado solamente a los caracteres que nos interesan
		let formato = /^[a-záéíóúüñ ,.'"\d\-]+$/i;
		if (!formato.test(e.key)) e.preventDefault();
	});
	comentario.addEventListener("input", (e) => {
		// Validaciones estándar
		amplio.input(e);

		// Quita caracteres indeseados
		if (comentario.value) comentario.value = comentario.value.replace(/[^a-záéíóúüñ ,.'"\d\-]+$/gi, "").slice(0, 100);

		// Actualiza el contador
		contador.innerHTML = 100 - comentario.value.length;

		// Actualiza el botón desaprobar
		botonDesaprobar();
	});
	DOM.comentario.addEventListener("change", (e) => edicionesChange(e));

	// Previene el submit si el botón está inactivo
	form.addEventListener("submit", (e) => {
		if (e.submitter.id == "desaprueba" && desaprueba.className.includes("inactivo")) e.preventDefault();
	});
});
