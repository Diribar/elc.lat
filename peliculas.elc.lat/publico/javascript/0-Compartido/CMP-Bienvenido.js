"use strict";
window.addEventListener("load", async () => {
	// Si no hay datos, interrumpe la función
	const botonEntendido = document.querySelector("#cartelGenerico #iconosCartel.bienvenido .fa-thumbs-up");
	if (!botonEntendido) return;

	// Evento
	document.addEventListener("keydown", async (e) => {
		if (e.key != "Enter") return
		e.preventDefault();
		await fetch("/api/cmp-bienvenido-aceptado"); // es clave el 'await' para que session.bienvenido sea 'true'
		location.reload();
	});
	botonEntendido.addEventListener("click", async (e) => {
		e.preventDefault();
		await fetch("/api/cmp-bienvenido-aceptado"); // es clave el 'await' para que session.bienvenido sea 'true'
		location.reload();
	});
});
