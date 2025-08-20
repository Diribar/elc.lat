"use strict";
window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		// Íconos del título
		quitarFiltros: document.querySelector("#iconosDelTitulo #consultas #iconoOcultarMostrar .fa-circle-xmark"),
		aplicarFiltros: document.querySelector("#iconosDelTitulo #consultas #iconoOcultarMostrar .fa-rotate-right"),
		leyenda: document.querySelector("#iconosDelTitulo #consultas .mostrarLeyenda"),

		// Encabezado
		vinculadas: document.querySelector("#encabezado #vinculadas span"),

		// Productos
		listado: document.querySelector("#cuadroDeResultados #listado"),
		productos: document.querySelectorAll("#cuadroDeResultados li.prodsNuevos"),
		prodsFueraCons: document.querySelectorAll("#cuadroDeResultados li.prodsNuevos.fueraDeConsulta"),
		prodsPerennes: document.querySelectorAll("#cuadroDeResultados li.prodsNuevos:not(.fueraDeConsulta)"),
	};

	// Variables
	const cantPerenne = DOM.prodsPerennes.length;
	const cantFueraCons = DOM.prodsFueraCons.length;
	const cantTotal = cantFueraCons + cantPerenne;

	// Si no existen 'prodsFueraCons' o 'prodsPerennes' termina la función
	if (!cantFueraCons || !cantPerenne) return desplazamHoriz();

	// Funciones
	const quitaProdsFueraCons = () => {
		if (cantFueraCons) for (const prod of DOM.prodsFueraCons) prod.parentNode.removeChild(prod);
	};
	const agregaProdsFueraCons = () => {
		// Rutina por cada producto del total
		DOM.productos.forEach((producto, i) => {
			// Si es un producto perenne, interrumpe la función
			if (!producto.className.includes("fueraDeConsulta")) return;

			// Acciones si es el primer producto
			if (!i)
				DOM.listado.children.length
					? DOM.listado.insertBefore(producto, DOM.listado.children[0]) // si existen otros elementos
					: DOM.listado.appendChild(producto);
			// Acciones para los demás productos
			else DOM.listado.children[i - 1].after(producto);
		});

		// Fin
		return;
	};

	// Evento - Quita filtros
	DOM.quitarFiltros.addEventListener("click", () => {
		// Le quita la clase ocultar a cada botón
		for (const prod of DOM.prodsFueraCons) prod.classList.remove("ocultar");

		// Alterna los íconos a mostrar y ocultar
		DOM.quitarFiltros.classList.add("ocultar");
		DOM.aplicarFiltros.classList.remove("ocultar");

		// Actualiza la leyenda
		DOM.leyenda.innerHTML = "Se quitaron los filtros de la consulta";
		DOM.leyenda.classList.remove("ocultar");
		setTimeout(() => DOM.leyenda.classList.add("ocultar"), 1000);

		// Actualiza la cantidad de productos vinculadas
		if (DOM.vinculadas) DOM.vinculadas.innerHTML = cantTotal;

		// Funciones
		agregaProdsFueraCons();
		desplazamHoriz();

		// Fin
		return;
	});

	// Evento - Aplica filtros
	DOM.aplicarFiltros.addEventListener("click", () => {
		// Le agrega la clase ocultar a cada botón
		for (const prod of DOM.prodsFueraCons) prod.classList.add("ocultar");

		// Alterna los íconos a mostrar y ocultar
		DOM.aplicarFiltros.classList.add("ocultar");
		DOM.quitarFiltros.classList.remove("ocultar");

		// Actualiza la leyenda
		DOM.leyenda.innerHTML = "Se aplicaron los filtros de la consulta";
		DOM.leyenda.classList.remove("ocultar");
		setTimeout(() => DOM.leyenda.classList.add("ocultar"), 1000);

		// Actualiza la cantidad de productos vinculadas
		if (DOM.vinculadas) DOM.vinculadas.innerHTML = cantPerenne;

		// Funciones
		quitaProdsFueraCons();
		desplazamHoriz();

		// Fin
		return;
	});

	// Startup
	if (cantFueraCons) {
		quitaProdsFueraCons();
		for (let i = 0; i < DOM.productos.length; i++) DOM.productos[i].classList.remove("ocultar"); // quita el 'ocultar' de los productos de la variable, para que cuando se quite el filtro sean visibles
	}
	desplazamHoriz();

	// Fin
	return;
});
