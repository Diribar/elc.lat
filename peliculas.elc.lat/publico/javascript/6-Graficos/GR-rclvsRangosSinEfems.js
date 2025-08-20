"use strict";
window.addEventListener("load", async () => {
	// Obtiene regsBD del BE
	const regsBD = await fetch(ruta).then((n) => n.json());

	// Variables
	const DOM = {grafico: document.querySelector("#zonaDeGraficos #cuadro #grafico")};

	// Genera el resultado
	const resultado = [["Fecha", "Rango", {role: "annotation"}]];
	for (let reg of regsBD) resultado.push([reg.nombre, reg.rango, ""]);

	const dibujarGrafico = () => {
		// Opciones
		const {grafico, opciones} = FN_charts.opciones(DOM, "columnas");
		opciones.colors = ["firebrick"];
		opciones.legend = {position: "none"};
		opciones.vAxis.title = "Días";

		// Hace visible el gráfico
		const data = new google.visualization.arrayToDataTable(resultado);
		grafico.draw(data, opciones);

		// Fin
		return;
	};

	// Dibuja el gráfico
	google.charts.setOnLoadCallback(dibujarGrafico);

	// Fin
	return;
});
// https://developers.google.com/chart/interactive/docs/gallery/columnchart
