"use strict";
window.addEventListener("load", async () => {
	// Obtiene datos del BE
	const datos = await fetch(ruta).then((n) => n.json());

	// Variables
	const DOM = {grafico: document.querySelector("#cuadro #grafico")};
	const {cantLinksVencPorSem: cantLinks, primerLunesDelAno, lunesDeEstaSemana, unaSemana, linksSems} = datos;
	const semanaActual = (lunesDeEstaSemana - primerLunesDelAno) / unaSemana + 1;
	const {promSem} = cantLinks;
	const promSemTotal = promSem.prods + 1;
	const maxEjeY =
		promSemTotal <= 30
			? Math.ceil(promSemTotal / 5) * 5
			: Math.ceil(promSemTotal / 20) * 20;
	const lunesSemana53 = primerLunesDelAno + unaSemana * 52; // son 52 semanas posteriores al primer lunes del año
	const ano52Sems = new Date(lunesSemana53).getUTCFullYear() > new Date(primerLunesDelAno).getUTCFullYear();

	// Genera el resultado
	let resultado = [["Semana", "Caps.", "PelisColes."]];
	let restar = 0;
	let ticksHoriz = [];
	for (let ejeX = 0; ejeX <= linksSems; ejeX++) {
		// Agrega los valores X
		const semana = ejeX + semanaActual;
		if (semana == 53 && ano52Sems) restar = 52;
		if (semana == 54 && !restar) restar = 53;
		ticksHoriz.push({v: ejeX, f: String(semana - restar)});

		// Agrega los valores Y
		const capitulos = cantLinks[ejeX].capitulos;
		const pelisColes = cantLinks[ejeX].pelisColes;
		resultado.push([ejeX, capitulos, pelisColes]);
	}

	const dibujarGrafico = () => {
		// Opciones
		const {grafico, opciones} = FN_charts.opciones(DOM, "columnas");
		opciones.colors = ["rgb(37,64,97)", "rgb(31,73,125)", "rgb(79,98,40)"];
		opciones.vAxis.viewWindow = {min: 0, max: maxEjeY};
		opciones.hAxis.ticks = ticksHoriz;
		opciones.title = "Prom. Semanal: " + promSem.capitulos + " + " + promSem.pelisColes + " = " + promSem.prods;

		// Opciones del gráfico
		if (revision) opciones.hAxis.textColor = "none";
		else {
			opciones.vAxis.title = "Cantidad de links";
			opciones.hAxis.title = "Semana";
		}

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
