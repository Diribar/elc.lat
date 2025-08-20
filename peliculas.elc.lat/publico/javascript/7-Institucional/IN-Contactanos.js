"use strict";
window.addEventListener("load", async () => {
	// Variables
	const producto = document.querySelector("form #producto");
	const DOM = {
		// Variables generales
		form: document.querySelector("form"),
		submit: document.querySelector("form #submit"),

		// Datos
		inputs: document.querySelectorAll(".inputError .input"),
		inputsMasBuscProds: document.querySelectorAll(".inputError .input, .inputError input"),
		textArea: document.querySelector(".inputError textarea.input"),
		pendiente: document.querySelector("#contador"),

		// Producto
		inputBR: producto.querySelector("input"),
		escribiMas: producto.querySelector("#escribiMas"),
		select: producto.querySelector("select"),

		// OK/Errores
		iconosError: document.querySelectorAll(".inputError .fa-circle-xmark"),
		iconosOK: document.querySelectorAll(".inputError .fa-circle-check"),
		mensajesError: document.querySelectorAll(".inputError .mensajeError"),

		// Cartel genérico
		todoElMain: document.querySelector("#todoElMain"),
		continuar: document.querySelector("#todoElMain #iconosCartel #continuar"),
	};
	const v = {
		inputBR: DOM.inputBR.value,
		campos: Array.from(DOM.inputs).map((n) => n.name),
	};
	let resultados;

	// Funciones
	const FN = {
		actualizaVarios: async function () {
			this.contador();
			this.obtieneLosValores();
			await this.actualizaLosErrores();
			this.actualizaBotonSubmit();

			// Fin
			return;
		},
		contador: () => {
			DOM.pendiente.innerHTML = Math.max(500 - DOM.textArea.value.length, 0);

			// Fin
			return;
		},
		obtieneLosValores: () => {
			v.datosUrl = "/?";
			DOM.inputs.forEach((input, i) => (v.datosUrl += input.name + "=" + encodeURIComponent(input.value) + "&"));
			v.datosUrl.slice(0, -1);
			return;
		},
		actualizaLosErrores: async () => {
			// Obtiene los errores
			errores = await fetch(rutas.inicioAPI + rutas.validaDatos + v.datosUrl).then((n) => n.json());

			// Acciones en función de si hay errores o no
			v.campos.forEach((campo, indice) => {
				// Actualiza los mensajes de error
				DOM.mensajesError[indice].innerHTML = errores[campo];

				// Acciones si hay mensaje de error
				if (errores[campo]) {
					DOM.iconosOK[indice].classList.add("ocultar");
					DOM.iconosError[indice].classList.remove("ocultar");
				}
				// Acciones si no hay mensaje de error
				else {
					DOM.iconosOK[indice].classList.remove("ocultar");
					DOM.iconosError[indice].classList.add("ocultar");
				}
			});

			// Fin
			return;
		},
		actualizaBotonSubmit: () => {
			// Detecta la cantidad de 'errores' ocultos
			let hayErrores = Array.from(DOM.iconosOK)
				.map((n) => n.className)
				.some((n) => n.includes("ocultar"));
			// Consecuencias
			hayErrores ? DOM.submit.classList.add("inactivo") : DOM.submit.classList.remove("inactivo");
		},
		submit: async function (e) {
			e.preventDefault();

			// Si el botón submit está inactivo, interrumpe la función
			if (DOM.submit.className.includes("inactivo")) return this.actualizaVarios();

			// Genera los datos para el envío del mail
			const ruta = rutas.inicioAPI + rutas.enviaMail;
			const APIs = [{ruta: v.datosUrl, duracion: 9000}];

			// Envío de mail más cartel de progreso
			DOM.submit.classList.add("inactivo");
			const mailEnviado = await barraProgreso(ruta, APIs);

			// Redirige
			location.href = rutas.inicioVista + (mailEnviado ? rutas.envioExitoso : rutas.envioFallido);
			return;
		},
		buscaResultados: async function () {
			// Variables
			v.inputBR = DOM.inputBR.value;

			if (!v.inputBR) {
				DOM.select.innerHTML = "";
				return;
			}

			// Impide los caracteres que no son válidos
			DOM.inputBR.value = DOM.inputBR.value.replace(/[^a-záéíóúüñ'¡¿-\d\s]/gi, "").replace(/ +/g, " ");
			const dataEntry = DOM.inputBR.value;

			// Elimina palabras repetidas
			let palabras = dataEntry.split(" ");
			for (let i = palabras.length - 1; i > 0; i--)
				if (palabras.filter((n) => n == palabras[i]).length > 1) palabras.splice(i, 1);
			let pasaNoPasa = palabras.join("");

			// Si la palabra tiene menos de 3 caracteres significativos, interrumpe la función
			pasaNoPasa.length < 3 ? DOM.escribiMas.classList.remove("ocultar") : DOM.escribiMas.classList.add("ocultar");
			if (pasaNoPasa.length < 3) {
				DOM.select.innerHTML = "";
				return;
			}

			// Busca los resultados
			palabras = palabras.join(" ");
			resultados = await fetch("/api/cmp-busqueda-rapida/?palabras=" + palabras + "&omitirStatus=true")
				.then((n) => n.json())
				.then((n) => n.filter((m) => m.familia == "producto"));

			// Fin
			this.muestraResultados();
			return;
		},
		muestraResultados: () => {
			// Si no se encontraron resultados, interrumpe la función
			DOM.select.innerHTML = "";
			if (!resultados.length) return;

			// Rutina de creación de filas
			for (let resultado of resultados) {
				// Variables
				const {entidad, id, anoEstreno} = resultado;
				let {nombre} = resultado;
				let anchoMax = 40;

				// Nombre y entidad
				if (nombre.length > anchoMax) nombre = nombre.slice(0, anchoMax - 1) + "…";
				if (anoEstreno) nombre += " (" + anoEstreno + ")";
				const entCorta = entidad.slice(0, 3).toUpperCase();

				// Crea y agrega la opción
				const opcion = document.createElement("option");
				opcion.innerText = nombre + " - " + entCorta;
				opcion.value = entidad + "-" + id;
				DOM.select.appendChild(opcion);
			}

			// Elije el primer resultado
			DOM.select.value = DOM.select.children[0].value;

			// Fin
			return;
		},
	};

	// Eventos - inputs en el form
	if (DOM.continuar) DOM.continuar.addEventListener("click", () => DOM.todoElMain.classList.add("ocultar"));
	for (const input of DOM.inputsMasBuscProds) {
		input.addEventListener("input", async (e) => {
			// Acciones
			if (e.target.name == "inputBR") await FN.buscaResultados();
			amplio.input(e); // restringe caracteres indeseados

			// Busca el mensaje de error
			FN.actualizaVarios();

			// Fin
			return;
		});
		input.addEventListener("change", (e) => edicionesChange(e));
	}

	// Eventos - submit
	DOM.form.addEventListener("submit", async (e) => FN.submit(e));
	DOM.submit.addEventListener("click", async (e) => FN.submit(e));

	// Status inicial
	await FN.buscaResultados();
	if (Array.from(DOM.inputs).some((n) => n.value)) await FN.actualizaVarios();
});

// Variables
const rutas = {
	inicioAPI: "/institucional/api/in-contactanos-",
	validaDatos: "valida",
	enviaMail: "envia-mail",
	inicioVista: "/institucional/contactanos/",
	envioExitoso: "envio-exitoso",
	envioFallido: "envio-fallido",
};
