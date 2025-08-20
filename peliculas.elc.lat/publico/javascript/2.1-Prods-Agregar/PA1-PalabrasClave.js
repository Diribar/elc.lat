"use strict";

window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		// Variables generales
		form: document.querySelector("#dataEntry"),
		botonSubmit: document.querySelector("#dataEntry #botonSubmit"),
		resultado: document.querySelector("#dataEntry #resultado"),

		// Datos
		inputPalsClave: document.querySelector("#dataEntry input[name='palabrasClave']"),
		inputMetodo: document.querySelector("#dataEntry input[name='metodo']"),

		// OK/Error
		iconoError: document.querySelector(".inputError .fa-circle-xmark"),
		iconoOK: document.querySelector(".inputError .fa-circle-check"),
		mensajeError: document.querySelector(".inputError .mensajeError"),
	};
	const tareas = {
		ingrMan: "Ingr. Man.",
		buscar: "Buscar",
		desambiguar: "Desambiguar",
		datosDuros: "Datos Duros",
		datosAdics: "Datos Adics",
	};
	rutas.validaPc = "/producto/api/pa-valida-pc/?";
	let resultados = {};

	// Funciones
	const FN = {
		particsInput: () => {
			// Actualiza el 'botonSubmit'
			const imBuscar = DOM.inputPalsClave.value.length < 3;
			DOM.botonSubmit.innerHTML = imBuscar ? tareas.ingrMan : tareas.buscar;

			// Actualiza el destino
			const proxTarea = imBuscar ? tareas.ingrMan : tareas.desambiguar;
			DOM.inputMetodo.value = proxTarea;

			// Actualiza el resultado
			DOM.resultado.innerHTML = "<br>";
			DOM.resultado.className = "sinResultado";

			// Fin
			return;
		},
		muestraElErrorMasBotonSubmit: async () => {
			// Variables
			const datosUrl = "&" + DOM.inputPalsClave.name + "=" + encodeURIComponent(DOM.inputPalsClave.value);

			// Valida los erroresPc
			const erroresPc = await fetch(rutas.validaPc + datosUrl).then((n) => n.json());
			const error = erroresPc.palabrasClave;

			// Muestra/oculta los íconos 'OK' y 'error', si el campo fue validado
			if (Object.keys(erroresPc).includes("palabrasClave")) {
				DOM.mensajeError.innerHTML = error;
				// Acciones si existe un mensaje de error
				if (error) {
					DOM.iconoOK.classList.add("ocultar");
					DOM.iconoError.classList.remove("ocultar");
				}
				// Acciones si no hay erroresPc
				else {
					DOM.iconoOK.classList.remove("ocultar");
					DOM.iconoError.classList.add("ocultar");
				}
			}

			// Actualiza el botón submit
			DOM.iconoOK.className.includes("ocultar")
				? DOM.botonSubmit.classList.add("inactivo")
				: DOM.botonSubmit.classList.remove("inactivo");

			// Fin
			return;
		},
		statusInicial: async function () {
			// Si el botón está inactivo, interrumpe la función
			if (DOM.botonSubmit.className.includes("inactivo")) return;

			// Averigua si existe la session 'pcHallazgos', y en caso que no, interrumpe la función
			resultados = await fetch(rutas.pre + rutas.buscaInfo).then((n) => n.json());
			if (!resultados || !resultados.mensaje) return;

			// Actualiza el mensaje y adecua el botón submit
			await this.muestraResultados();

			// Fin
			return;
		},
		submit: function (e) {
			// Previene el submit
			e.preventDefault();

			// Botón inactivo
			if (DOM.botonSubmit.className.includes("inactivo")) return this.muestraElErrorMasBotonSubmit();

			// Botón 'Buscar'
			if (DOM.botonSubmit.innerHTML == tareas.buscar) return this.botonBuscar();

			// Botón 'Avanzar
			if (DOM.botonSubmit.className.includes("verdeOscuro")) return DOM.form.submit();

			// Fin
			return;
		},
		botonBuscar: async function () {
			// Adecuaciones iniciales
			DOM.botonSubmit.classList.add("inactivo");
			DOM.botonSubmit.innerHTML = "Buscando";
			DOM.resultado.innerHTML = "<br>";

			// Obtiene los resultados
			const palabrasClave = DOM.inputPalsClave.value.trim();
			APIs_buscar[0].ruta = APIs_buscar[0].ruta.split("&")[0];
			APIs_buscar[0].ruta += "&palabrasClave=" + palabrasClave;
			resultados = await barraProgreso(rutas.pre, APIs_buscar);
			console.log(resultados);

			// Actualiza el mensaje y adecua el botón submit
			await this.muestraResultados();

			// Fin
			return;
		},
		muestraResultados: async () => {
			// Variables
			const {prodsNuevos, prodsYaEnBD, hayMas, mensaje} = resultados;

			// Publica el resultado
			DOM.resultado.innerHTML = mensaje.palabrasClave;
			const formato = prodsNuevos && prodsNuevos.length && !hayMas ? "Exitoso" : "Invalido";
			DOM.resultado.className = "resultado" + formato;

			// Si hubo un error en los resultados, interrumpe la función
			if (!mensaje) return;

			// Formato botón submit
			DOM.botonSubmit.classList.remove("inactivo");

			// Acciones si se debe avanzar más allá de Desambiguar
			if (prodsNuevos.length == 1 && !prodsYaEnBD.length)
				await accionesSiSoloSeEncuentraUnProdNuevo({DOM, producto: prodsNuevos[0]});

			// Contenido botón submit
			console.log(errores);
			const proxTarea =
				resultados.prodsYaEnBD.length || resultados.prodsNuevos.length > 1
					? tareas.desambiguar
					: !resultados.prodsNuevos.length
					? tareas.ingrMan
					: errores.hay
					? tareas.datosDuros
					: tareas.datosAdics;
			DOM.botonSubmit.innerHTML = proxTarea;
			DOM.inputMetodo.value = proxTarea;

			// Fin
			return;
		},
	};

	// Add Event listeners
	DOM.form.addEventListener("keypress", (e) => keyPressed(e));
	DOM.form.addEventListener("input", async (e) => {
		amplio.input(e, true); // Validaciones estándar
		FN.particsInput(); // Validaciones particulares
		await FN.muestraElErrorMasBotonSubmit(); // Valida errores

		// Fin
		return;
	});
	DOM.form.addEventListener("change", (e) => edicionesChange(e, true));

	// Add Event listeners - Submit
	DOM.form.addEventListener("submit", (e) => FN.submit(e));
	DOM.botonSubmit.addEventListener("click", (e) => FN.submit(e));
	DOM.form.addEventListener("keydown", (e) => e.key == "Enter" && FN.submit(e));

	// Start-up
	await FN.muestraElErrorMasBotonSubmit();
	FN.statusInicial();
});

// Funciones
const accionesSiSoloSeEncuentraUnProdNuevo = async ({DOM, producto}) => {
	// Obtiene los datos
	const {TMDB_entidad, TMDB_id, nombreOriginal, idiomaOriginal_id} = producto;
	const datos = {
		TMDB_entidad,
		TMDB_id,
		nombreOriginal: encodeURIComponent(nombreOriginal), // Es necesario porque sólo se consigue mediante 'search'
		idiomaOriginal_id, // Es necesario porque sólo se consigue mediante 'search'
	};

	// Actualiza Datos Originales y averigua si la info tiene errores
	const APIs = [
		{ruta: rutas.actualizaDatosOrigs + JSON.stringify(datos), duracion: 900},
		{ruta: rutas.validaDD, duracion: 200}, // se fija si hay errores DD, y guarda session/cookie de DD y DA
	];
	await fetch(rutas.pre + APIs[0].ruta);
	errores = await fetch(rutas.pre + APIs[1].ruta).then((n) => n.json());

	// Fin
	return;
};
