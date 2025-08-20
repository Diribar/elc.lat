"use strict";

window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		// Selects
		entidad: document.querySelector("select[name='entidad']"),
		coleccion_id: document.querySelector("select[name='coleccion_id']"),
		numTemp: document.querySelector("select[name='numTemp']"),
		numCap: document.querySelector("select[name='numCap']"),

		// Otros
		inputs: document.querySelectorAll(".input"),
		invisible: document.querySelector(".invisible"),
		submits: document.querySelectorAll(".submit"),
	};
	const datos = await fetch(rutas.sessionCookie).then((n) => n.json());
	const {coleccion_id, numTemp, numCap} = datos;
	const v = {coleccion_id, numTemp, numCap};

	// Funciones
	const FN = {
		// Inputs
		entConValor: async function () {
			// Autofocus
			DOM.entidad.focus();

			// Es una película o colección
			if (DOM.entidad.value != "capitulos") {
				// Deja visible y accesible solamente el campo "entidad"
				DOM.invisible.classList.add("invisible");
				this.muestraOcultaCampos(DOM.entidad);

				// Limpia las opciones de lo relacionado con colecciones
				this.limpiaLasOpciones(DOM.coleccion_id);

				// Habilita los botones 'submit'
				for (let submit of DOM.submits) submit.classList.remove("inactivo");
			}

			// Es un capítulo
			else {
				// Deja accesibles los campos que correspondan
				this.muestraOcultaCampos(DOM.coleccion_id);
				DOM.invisible.classList.remove("invisible");

				// Inhabilita los botones 'submit'
				for (let submit of DOM.submits) submit.classList.add("inactivo");

				// Obtiene el listado de las colecciones
				const colecciones = await fetch(rutas.colecciones).then((n) => n.json());

				// Agrega el id y nombre de las colecciones a las opciones
				for (let coleccion of colecciones) {
					const opcion = document.createElement("option");
					opcion.value = coleccion.id;
					opcion.innerHTML = coleccion.nombreCastellano;
					if (opcion.value == v.coleccion_id) opcion.selected = true;
					DOM.coleccion_id.appendChild(opcion);
				}
			}

			// Fin

			this.colConValor();
			return;
		},
		colConValor: async function () {
			// Autofocus
			DOM.coleccion_id.focus();

			// Si no existe un valor, interrumpe la función
			if (!DOM.coleccion_id.value) return;

			// Limpia las opciones de lo relacionado con temporadas
			this.limpiaLasOpciones(DOM.numTemp);

			// Obtiene la cantidad de temporadas de la colección
			const cantTemps = await fetch(rutas.cantTemps + DOM.coleccion_id.value).then((n) => n.json());

			// Agrega las temporadas vigentes más una
			for (let numTemp = 1; numTemp <= cantTemps + 1; numTemp++) {
				const opcion = document.createElement("option");
				opcion.value = numTemp;
				opcion.innerHTML = cantTemps == 1 && numTemp == 1 ? "Temporada única" : "Temporada " + numTemp;
				opcion.selected = opcion.value == v.numTemp;
				DOM.numTemp.appendChild(opcion);
			}

			// Habilita el campo siguiente
			this.muestraOcultaCampos(DOM.numTemp);

			// Fin
			this.tempConValor();
			return;
		},
		tempConValor: async function () {
			// Autofocus
			DOM.numTemp.focus();

			// Si no existe un valor, interrumpe la función
			if (!DOM.numTemp.value) return;

			// Limpia las opciones de lo relacionado con capitulos
			this.limpiaLasOpciones(DOM.numCap);

			// Obtiene los numCap de la temporada
			const capitulos = await fetch(rutas.capitulos + DOM.coleccion_id.value + "&numTemp=" + DOM.numTemp.value)
				.then((n) => n.json())
				.then((n) => n.map((m) => m.numCap));

			// Agrega los capítulos vigentes más uno
			const maxCapitulos = capitulos.length ? Math.max(...capitulos) : 0;
			for (let numCap = 1; numCap <= maxCapitulos + 1; numCap++) {
				// Si el capítulo ya está creado, saltea la rutina
				if (capitulos.includes(numCap)) continue;

				// Crea la opción
				const opcion = document.createElement("option");
				opcion.value = numCap;
				opcion.innerHTML = "Capítulo " + numCap;
				opcion.selected = opcion.value == v.numCap;
				DOM.numCap.appendChild(opcion);
			}

			// Si capítulo no tiene un valor, le asigna uno
			if (!DOM.numCap.value) DOM.numCap.value = DOM.numCap.lastChild.value;

			// Habilita el campo siguiente
			this.muestraOcultaCampos(DOM.numCap);

			// Fin
			this.capConValor();
			return;
		},
		capConValor: () => {
			// Autofocus
			DOM.numCap.focus();

			// Si no existe un valor, interrumpe la función
			if (!DOM.numCap.value) return;

			// Activa los submits
			for (let submit of DOM.submits)
				if (DOM.numCap.value) submit.classList.remove("inactivo");
				else submit.classList.add("inactivo");

			// Fin
			return;
		},

		// Auxiliares
		muestraOcultaCampos: (campo) => {
			// Variables
			let habilitar = true;

			// Rutina
			for (let input of DOM.inputs) {
				if (habilitar) input.removeAttribute("disabled");
				else {
					input.setAttribute("disabled", "disabled");
					input.value = "";
				}
				if (input == campo) habilitar = false;
			}

			// Fin
			return;
		},

		limpiaLasOpciones: (campo) => {
			// Variables
			let habilitar = false;

			// Rutina
			for (let input of DOM.inputs) {
				if (input == campo) habilitar = true;

				// Borra los valores de opciones y deja sólo el estándar
				if (habilitar) input.innerHTML = "<option value=''>Elejí una opción</option>";
			}
			return;
		},
	};

	// Interacción con los DataEntry
	DOM.entidad.addEventListener("change", async () => await FN.entConValor());

	DOM.coleccion_id.addEventListener("change", async () => await FN.colConValor());

	DOM.numTemp.addEventListener("change", async () => await FN.tempConValor());

	DOM.numCap.addEventListener("change", () => FN.capConValor());

	// Status inicial
	if (DOM.entidad.value) await FN.entConValor();
});

// Variables
const prefRuta = "/producto/api/";
const rutas = {
	sessionCookie: prefRuta + "pa-session-cookie-im",
	colecciones: prefRuta + "pa-obtiene-colecciones",
	cantTemps: prefRuta + "pa-obtiene-cant-de-temps/?id=",
	capitulos: prefRuta + "pa-obtiene-caps-de-la-temp/?coleccion_id=",
};
