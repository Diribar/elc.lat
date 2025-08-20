"use strict";
window.addEventListener("load", async () => {
	// Obtiene datos del BE
	const registrosBD = await fetch(ruta).then((n) => n.json());

	// Variables
	const DOM = {grafico: document.querySelector("#zonaDeGraficos #cuadro #grafico")};
	const diasSem = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
	const hoy = new Date().toISOString().slice(0, 10);
	let diaSemHoy = new Date().getDay() - 1;
	if (diaSemHoy < 0) diaSemHoy += 7;
	let regsAgregar

	// Crea las variables del gráfico
	const consolidado = {};
	for (let diaSem of diasSem) for (let hora = 0; hora < 24; hora++) consolidado[diaSem+"-"+hora]=0

	// let semAnt = [...consolidado];
	// let ultMes = [...consolidado];

	// Semana actual
	let semActual = {...consolidado}
	regsAgregar=registrosBD.filter(n=>n.fecha

	)

	// Fin
	return;
});
// https://developers.google.com/chart/interactive/docs/gallery/columnchart
