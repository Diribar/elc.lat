"use strict";
window.addEventListener("load", async () => {
	// Obtiene datos del BE
	const regsBD = await fetch(ruta).then((n) => n.json());

	// Variables
	const DOM = {grafico: document.querySelector("#zonaDeGraficos #cuadro #grafico")};
	const ejeX = regsBD.map((n) => n.nombre);
	const ejeY = regsBD.map((n) => n.links);

	// Consolida el resultado
	const resultado = [["Prov.", "Cant. de Links"]];
	for (let i = 0; i < ejeX.length; i++) resultado.push([ejeX[i], ejeY[i]]);

	const dibujarGrafico = () => {
		// Opciones
		const {grafico, opciones} = FN_charts.opciones(DOM, "pie");

		// Hace visible el gráfico
		const data = new google.visualization.arrayToDataTable(resultado);
		grafico.draw(data, opciones);

		// Fin
		return;
	};

	// Dibujar el gráfico
	google.charts.setOnLoadCallback(dibujarGrafico);

	// Fin
	return;
});
// https://developers.google.com/chart/interactive/docs/gallery/piechart
