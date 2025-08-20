"use strict";

const obtienePrefsDelFe = {
	// General
	consolidado: function () {
		// Borra la información anterior
		prefs = {};

		// Obtiene el layout y muestra/oculta campos
		this.layout();

		// Muestra filtros dependiendo de si tienen un valor o si está oculto el botón "mostrar filtros"
		actualiza.toggleBotonFiltros();

		// Pule la variable 'prefs'
		for (let prop in prefs) if (prefs[prop] == "sinFiltro") delete prefs[prop];

		// Fin
		return;
	},

	// Presencia estable
	layout: function () {
		// Variables
		v.layout_id = DOM.layout_id.value;

		// Obtiene los valores completos de la opción elegida
		if (v.layout_id) {
			v.layoutBD = v.layoutsBD.find((n) => n.id == v.layout_id);
			if (!v.layoutBD) v.layout_id = null;
			else prefs.layout_id = v.layout_id;
		}

		// Muestra/Oculta los bloques de filtros
		this.muestraOcultaBloques();

		// Obtiene los demás valores
		if (v.layout_id) {
			// Obtiene los métodos a considerar - saltea 'consolidado', 'layout', 'muestraOcultaBloques'
			const metodos = Object.keys(this).slice(3);

			// Redirige a las siguientes instancias
			for (let metodo of metodos) this[metodo]();
		}

		// Fin
		return;
	},
	muestraOcultaBloques: () => {
		// Acciones si existe un 'layout_id'
		if (v.layout_id) {
			// Muestra sectores
			DOM.nav.classList.remove("ocultar");
			DOM.toggleFiltros.classList.remove("ocultar"); // muestra el botón "mostrar/ocultar filtros"
		}
		// Acciones si no existe
		else {
			// Variables
			v.mostrarResultados = false;
			DOM.botones.innerHTML = "";

			// Oculta sectores
			DOM.nav.classList.add("ocultar");
			DOM.toggleFiltros.classList.add("ocultar"); // oculta el botón "mostrar/ocultar filtros"
		}

		// Fin
		return;
	},
	entidad: () => {
		// Obtiene la entidad
		v.entidadBD = v.entidadesBD.find((n) => n.id == v.layoutBD.entDefault_id);
		v.entidad = v.entidadBD.codigo;
		prefs.entidad = v.entidad;

		// Fin
		return;
	},
	presenciaEstable: () => {
		// Impacto en prefs: todos los campos con presencia estable y que tengan un valor, impactan en el resultado
		for (let filtro of DOM.presenciaEstable) if (filtro.value) prefs[filtro.name] = filtro.value;

		// Actualiza el valor de 'palabrasClave'
		if (
			DOM.palClaveIcono.className.includes("fa-circle-xmark") && // se confirmaron las palabras clave
			DOM.palClaveInput.value // tienen algún valor
		)
			prefs.palabrasClave = DOM.palClaveInput.value;

		// Fin
		return;
	},
	excluyeBC: () => DOM.excluyeInput.checked && (prefs.excluyeBC = true),
	religion: () => {
		// Obtiene las religiones elegidas
		prefs.religiones = Array.from(DOM.religsInput)
			.filter((n) => n.checked)
			.map((n) => n.value); // obtiene las opciones elegidas
		if (!prefs.religiones.length) {
			for (const opcion of DOM.religsInput) opcion.checked = true;
			prefs.religiones = Array.from(DOM.religsInput)
				.filter((n) => n.checked)
				.map((n) => n.value); // obtiene las opciones elegidas
		}

		// Actualiza si se muestran las consultas referidas a la Iglesia Católica
		muestraConsCats =
			prefs.religiones.includes("CFC") && // se eligió 'con relación con la Iglesia Católica'
			// ["productos", "rclvs", "personajes"].includes(v.entidad) && // la entidad es alguna de esas
			DOM.bhr.value !== "0"; // no hay certeza de que sea ficticio

		// Fin
		return;
	},

	// Presencia eventual
	pppOpciones: () => {
		// Si el usuario no está logueado, interrumpe la función
		if (!v.usuario_id) return;

		// Si la opción elegida es "Mis preferencias" o "Mis calificaciones", oculta el sector
		if (["misPrefs", "misCalificadas"].includes(v.layoutBD.codigo)) {
			muestraOcultaActualizaPref(false, "pppOpciones");
			if (v.layoutBD.codigo == "misCalificadas") return; // interrumpe la función
			else prefs.pppOpciones = v.pppOpcsObj.misPreferencias.combo.split(","); // procesa la preferencia
		}

		// Acciones si la opción elegida es otra
		else {
			// Muestra/Oculta el sector y actualiza el valor del filtro
			muestraOcultaActualizaPref(true, "pppOpciones");

			// Si 'pppOpciones' tiene el valor de un combo, lo convierte en array
			if (prefs.pppOpciones && prefs.pppOpciones != "todos") {
				const id = prefs.pppOpciones;
				const pppOpcion = v.pppOpcsArray.find((n) => n.id == id);
				if (pppOpcion.combo) prefs.pppOpciones = pppOpcion.combo.split(",");
			}
		}

		// Fin
		return;
	},
	idiomas: () => {
		// Averigua si el campo se debe mostrar
		const muestraIdiomas = DOM.tiposLink.value != "todos"; // 'tiposLink' está contestado

		// Muestra/Oculta el sector y actualiza el valor del filtro
		muestraOcultaActualizaPref(muestraIdiomas, "idiomas");

		// Fin
		return;
	},
	canons: () => muestraOcultaActualizaPref(muestraConsCats, "canons"),
	rolesIgl: () => muestraOcultaActualizaPref(muestraConsCats, "rolesIgl"),
	apMar: () => {
		// Sólo se muestra el sector si se cumplen ciertas condiciones
		const muestraApMar = muestraConsCats && (!DOM.epocasOcurrencia.value || DOM.epocasOcurrencia.value == "pst"); //&& // la época no es 'bíblica'
		//v.entidad != "temas"; // La entidad es distinta de 'temas'

		// Muestra/Oculta el sector y actualiza el valor del filtro
		muestraOcultaActualizaPref(muestraApMar, "apMar");

		// Si se elige una 'Aparición Mariana', oculta el sector de 'Época de Ocurrencia'
		if (prefs.apMar == "SI") {
			delete prefs.epocasOcurrencia;
			DOM.epocasOcurrencia.parentNode.classList.add("ocultar");
		} else DOM.epocasOcurrencia.parentNode.classList.remove("ocultar");

		// Fin
		return;
	},
	bhr: () => {
		// Sólo se muestra si se cumplen ciertas condiciones
		const muestraBhr =
			!DOM.canons.value && // el 'procCanon' no está contestado
			!DOM.rolesIgl.value && // el 'rolIglesia' no está contestado
			!DOM.apMar.value; // la 'apMar' no está contestado

		// Muestra/Oculta el sector y actualiza el valor del filtro
		muestraOcultaActualizaPref(muestraBhr, "bhr");

		// Fin
		return;
	},
};

const muestraOcultaActualizaPref = (muestra, elemento) => {
	// Muestra
	muestra
		? v.muestraFiltros
			? DOM[elemento].parentNode.classList.remove("ocultar")
			: DOM[elemento].parentNode.classList.replace("ocultar", "ocultaFiltro")
		: DOM[elemento].parentNode.classList.add("ocultar");

	// Actualiza el valor de 'prefs'
	if (muestra && DOM[elemento].value) prefs[elemento] = DOM[elemento].value;

	// Fin
	return;
};
