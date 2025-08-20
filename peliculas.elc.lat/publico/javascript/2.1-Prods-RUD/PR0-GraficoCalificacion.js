"use strict";
window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		dondeUbicarLosResultados: document.querySelector("#calificacionesResultados"),
		datosLargos: document.querySelector("#cuerpo #datos #datosLargos"),
		datosBreves: document.querySelector("#cuerpo #datos #datosBreves"),
		iconoDB:document.querySelector("#mobile #iconoDB")
	};

	// Obtiene las calificaciones
	const ruta = "/producto/api/pr-obtiene-las-calificaciones/";
	const calificaciones = await fetch(ruta + "?entidad=" + entidad + "&id=" + id).then((n) => n.json());

	// Resultados de la calificación
	let resultados = "Gral.: <span>" + parseInt(calificaciones[0].valores[3]) + "%</span>";
	if (calificaciones.length == 2) resultados += " / Tuya: <span>" + parseInt(calificaciones[1].valores[3]) + "%</span>";
	DOM.dondeUbicarLosResultados.innerHTML = resultados;

	// Aspectos de la imagen de Google
	google.charts.load("current", {packages: ["corechart", "bar"]});
	google.charts.setOnLoadCallback(drawBarColors);

	// https://developers.google.com/chart/interactive/docs/gallery/barchart
	function drawBarColors() {
		// Arma los títulos
		const encabezado = ["Atributo"];
		for (const columna of calificaciones) encabezado.push(columna.autor);

		// Arma las filas
		const titulos = ["Deja\nHuella", "Entretiene", "Calidad\nTécnica"];
		const filas = [];
		for (let fila = 0; fila < titulos.length; fila++) {
			filas.push([]);
			for (let columna = 0; columna < calificaciones.length; columna++) {
				if (!columna) filas[fila].push(titulos[fila]);
				filas[fila].push(calificaciones[columna].valores[fila] / 100);
			}
		}
		// Consolida el resultado
		const resultado = [encabezado, ...filas];

		// Especifica la información
		const data = google.visualization.arrayToDataTable(resultado);

		// Opciones del gráfico
		const options = {
			backgroundColor: "rgb(255,242,204)",
			// width: "100%",
			fontSize: 8,
			animation: {
				duration: 100,
				easing: "out",
				startup: true,
			},
			numberStyle: "percent",
			colors: ["green", "lightgreen"],
			legend: {
				position: "bottom",
				alignment: "start",
				textStyle: {italic: true},
			},
			hAxis: {
				minValue: 0,
				maxValue: 1,
				ticks: [0, 0.5, 1],
				format: "percent",
			},
			vAxis: {textStyle: {fontSize: 12}},
			chartArea: {top: "10%", left: 65, width: 90},
		};

		// Hace visible el gráfico
		const grafico = new google.visualization.BarChart(document.getElementById("calificsGrafico"));
		grafico.draw(data, options);
	}

	// Estética para el start-up
	DOM.iconoDB.classList.add("inactivo")
	DOM.datosBreves.classList.replace("toggle", "esconderPorStartUp"); // inicialmente visibles en acostados
	setTimeout(() => {
		DOM.iconoDB.classList.remove("inactivo")
		DOM.datosBreves.classList.replace("esconderPorStartUp", "toggle"); // inicialmente oculto en acostados
	}, 1000);
});
