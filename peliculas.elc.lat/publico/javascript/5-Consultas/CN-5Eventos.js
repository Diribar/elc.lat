"use strict";
window.addEventListener("load", async () => {
	DOM.cuerpo.addEventListener("input", async (e) => {
		// Variables
		const nombre = e.target.name;
		const valor = e.target.value;

		// Acciones si se cambia la configuración
		if (nombre == "cabecera_id") {
			// Averigua si hay un error y en caso afirmativo, interrumpe la función
			const existe = await verificaConfigCons_id();
			if (!existe) return;

			// Novedades
			await cambioDeConfig_id();
			await accionesPorCambioDePrefs();
		}
		// Nombre de configuración
		else if (nombre == "nombreNuevo") {
			// Restringe el uso de caracteres a los aceptados
			basico.restringeCaracteres(e);

			// Restringe el largo del nombre
			const nombre = DOM.configNuevaNombre.value.slice(0, 30);
			DOM.configNuevaNombre.value = nombre;

			// Averigua si el nombre está OK
			const nombres = v.cabeceras.filter((n) => n.usuario_id == v.usuario_id).map((n) => n.nombre);
			v.nombreOK =
				nombre.length && // que tenga algún caracter
				!basico.validaCaracteres(nombre) && // que sean caracteres aceptables
				!nombres.includes(nombre); // que no se repita con un nombre anterior

			// Muestra/Oculta el ícono de confirmación
			actualiza.botoneraActivaInactiva();

			// Fin
			return;
		}
		// Palabras clave
		else if (nombre == "palabrasClave") {
			// Valida los caracteres ingresados
			const palabrasClave = DOM.palClaveInput.value;
			errores = palabrasClave.length ? basico.validaCaracteres(palabrasClave) : false;

			// Acciones
			DOM.palClaveIcono.classList.remove("fa-circle-xmark");
			palabrasClave.length && !errores
				? DOM.palClaveIcono.classList.add("fa-circle-right") // si se puede confirmar
				: DOM.palClaveIcono.classList.remove("fa-circle-right"); // si no se puede confirmar

			// Fin
			return;
		}
		// Acciones estándar por inputs
		else {
			if (e.target.tagName == "SELECT" && !valor)
				e.target.value = ""; // reemplaza 'Quitar la opción elegida' por el placeholder
			else if (nombre == "excluyeBC") {
				DOM.excluyeInput.title = excluyeBC();
				DOM.excluyeLeyenda.innerHTML = excluyeBC();
				setTimeout(() => (DOM.excluyeLeyenda.innerHTML = ""), v.setTimeOutStd);
			} else if (nombre == "religion") {
				DOM.religsLeyenda.innerHTML = v.religiones.find((n) => n.id == valor)?.breve;
				setTimeout(() => (DOM.religsLeyenda.innerHTML = ""), v.setTimeOutStd);
			}
			await accionesEstandarPorInputs();

			// Si se cambió el layout, guarda el movimiento en la base de datos
			if (nombre == "layout_id") await sessionCookie.guardaLayoutEnMovimsBD();
		}

		// Fin
		return;
	});
	DOM.cuerpo.addEventListener("change", async (e) => edicionesChange(e, true));
	DOM.cuerpo.addEventListener("keydown", async (e) => {
		// Variables
		const elemento = e.target;
		const padre = elemento.parentNode;
		const nombre = elemento.id ? elemento.id : padre.id;

		// Particularidades para 'palabrasClave'
		if (nombre == "palabrasClave") {
			// Tecla 'Enter'
			if (e.key == "Enter") {
				// Si está habilitado para confirmar
				if (DOM.palClaveIcono.className.includes("fa-circle-right")) {
					DOM.palClaveIcono.classList.replace("fa-circle-right", "fa-circle-xmark");
					await accionesEstandarPorInputs();
				}
				// Si se cancelan las 'palabrasClave'
				else if (DOM.palClaveIcono.className.includes("fa-circle-xmark")) {
					DOM.palClaveIcono.classList.remove("fa-circle-xmark");
					DOM.palClaveInput.value = "";
					await accionesEstandarPorInputs();
				}
			}

			// Restringe el uso de caracteres a los aceptados
			else if (basico.validaCaracteres(e.key)) e.preventDefault();
		}

		// Teclas - Enter
		if (e.key == "Enter" && nombre == "configNueva") await guardarBotonera();
		// Teclas - Escape
		else if (e.key == "Escape" && DOM.configNuevaNombre.className.split(" ").some((n) => ["nuevo", "edicion"].includes(n))) {
			DOM.configNuevaNombre.classList.remove("nuevo", "edicion"); // Oculta el input
			v.nombreOK = false; // Variables
			actualiza.botoneraActivaInactiva(); // Actualiza la botonera
		}

		// Fin
		return;
	});
	DOM.cuerpoFooterImgDer.addEventListener("click", async (e) => {
		// Variables
		const elemento = e.target;
		const padre = elemento.parentNode;
		const nombre = elemento.id ? elemento.id : padre.id;

		// Si el ícono está inactivo, interrumpe la función
		if (elemento.tagName == "I" && elemento.className.includes("inactivo")) return;
		// Encabezado - Compartir las preferencias
		else if (nombre == "iconoCompartir") {
			// Variables
			let configCons = {id: cabecera.id, ...prefs};

			// Si el 'ppp' es un combo, lo convierte a su 'id'
			if (configCons.pppOpciones && Array.isArray(configCons.pppOpciones)) {
				const combo = configCons.pppOpciones.toString();
				const pppOpcion = v.pppOpcsArray.find((n) => n.combo == combo);
				if (pppOpcion) configCons.pppOpciones = pppOpcion.id;
				else delete configCons.pppOpciones;
			}
			if (v.entidadBD.id == v.layoutBD.entDefault_id) delete configCons.entidad; // si la entidad es la estándar, elimina el campo

			// Obtiene los 'camposUrl'
			let camposUrl = "?";
			for (let prop in configCons) if (configCons[prop]) camposUrl += prop + "=" + configCons[prop] + "&";
			if (!camposUrl.length) return;
			else camposUrl = camposUrl.slice(0, -1);

			// Obtiene el 'url' y lo lleva al clipboard
			const url = location.href + camposUrl;
			navigator.clipboard.writeText(url);

			// Muestra la leyenda 'Consulta copiada'
			DOM.compartirLeyenda.classList.remove("ocultar");
			setTimeout(() => DOM.compartirLeyenda.classList.add("ocultar"), v.setTimeOutStd);
		}

		// Encabezado - Muestra prefs para celular parado
		else if (nombre == "toggleFiltrosGlobal" && !DOM.iconoParaMostrarPrefs.className.includes("flechaIzq")) {
			// Cambia la flecha
			DOM.iconoParaMostrarPrefs.classList.remove("flechaDer");
			DOM.iconoParaMostrarPrefs.classList.add("flechaIzq");

			// Desplaza la flecha
			DOM.mostrarPrefs.classList.remove("izquierdaX");
			DOM.mostrarPrefs.classList.add("derechaX");

			// Muestra los filtros
			DOM.configCons.classList.remove("disminuyeX");
			DOM.configCons.classList.add("aumentaX");

			// Se asegura de que los resultados estén a la vista
			if (v.layout_id && v.mostrarResultados) DOM.zonaDisponible.classList.remove("toggle");

			// Fin
			return;
		}

		// Configuración - Botonera
		else if (padre.id == "iconosBotonera") {
			if (false) {
			} else if (nombre == "sinFiltros") {
				// Quita los filtros de los campos
				for (let campo of v.camposConDefault) DOM[campo].value = "todos";
				for (let campo of v.camposSinDefault) DOM[campo].value = "";

				// Checkbox
				DOM.excluyeInput.checked = false;

				// Actualiza las palabras clave
				DOM.palClaveInput.value = "";
				DOM.palClaveIcono.classList.remove("fa-circle-xmark");
				DOM.palClaveIcono.classList.remove("fa-circle-right");

				// Acciones por inputs
				await accionesEstandarPorInputs();
			} else if (["nuevo", "edicion"].includes(nombre)) {
				// Variables
				v.nombreOK = false; // cuando se elige el ícono, se debe empezar a escribir el nombre

				// Valor inicial en el input, para la edición
				DOM.configNuevaNombre.value =
					nombre == "edicion" ? DOM.cabecera_id.options[DOM.cabecera_id.selectedIndex].text : "";

				// Alterna la clase 'nuevo' o 'edicion' en el input
				DOM.configNuevaNombre.classList.toggle(nombre);

				// Actualiza la botonera
				actualiza.botoneraActivaInactiva();

				// Pone el cursor en el input
				DOM.configNuevaNombre.focus();
			} else if (nombre == "deshacer") {
				await actualiza.valoresInicialesDeVariables();
				await actualiza.statusInicialPrefs("deshacer");
				await accionesPorCambioDePrefs();
			} else if (nombre == "eliminar") {
				// Si hay un error, interrumpe la función
				const existe = await verificaConfigCons_id();
				if (!existe || !v.filtroPropio) return;

				// Acciones si existe
				await cambiosEnBD.eliminaConfig();
				await cambioDeConfig_id();
				await accionesPorCambioDePrefs();
			} else if (nombre == "guardar") guardarBotonera();

			// Fin
			return;
		}

		// Filtros - 'palabrasClave'
		else if (nombre == "palClaveIcono") {
			if (DOM.palClaveIcono.className.includes("fa-circle-xmark")) {
				DOM.palClaveIcono.classList.remove("fa-circle-xmark");
				DOM.palClaveInput.value = "";
			} else if (DOM.palClaveIcono.className.includes("fa-circle-right"))
				DOM.palClaveIcono.classList.replace("fa-circle-right", "fa-circle-xmark");

			// Actualiza el input
			await accionesEstandarPorInputs();

			// Fin
			return;
		}

		// Filtros - Cartel 'muestraFiltros'
		else if ([padre.id, padre.parentNode.id].includes("toggleFiltros")) {
			// Cambia el status de los botones
			DOM.muestraFiltros.classList.toggle("ocultaFiltros");
			DOM.ocultaFiltros.classList.toggle("ocultaFiltros");

			// Muestra u oculta los filtros vacíos
			v.muestraFiltros = DOM.muestraFiltros.className.includes("ocultaFiltros");
			if (v.muestraFiltros) DOM.nav.classList.remove("startUp");
			actualiza.toggleBotonFiltros();

			// Fin
			return;
		}

		// Mostrar resultados - Actualizar resultados
		else if (nombre == "iconoActualizar") {
			if (v.layout_id) {
				await FN_resultados.obtiene();
				if (v.mostrarResultados) FN_resultados.muestra();
			}
			return;
		}

		// Mostrar resultados - Cierra el cartel "pppOpciones"
		else if (nombre == "cierra") {
			padre.classList.add("ocultar");
			return;
		}

		// Mostrar resultados - Expande/contrae la tabla
		else if ([elemento.tagName, padre.tagName].includes("CAPTION")) {
			// Obtiene el índice
			let indice = v.captions.findIndex((n) => n == elemento);
			if (indice < 0) indice = v.captions.findIndex((n) => n == padre);
			if (indice < 0) return;

			// Muestra / Oculta el 'tbody'
			v.mostrarTBody = DOM.expandeContraes[indice].className.includes("fa-square-plus");
			v.mostrarTBody
				? DOM.tbodies[indice].classList.replace("ocultar", "aparece")
				: DOM.tbodies[indice].classList.replace("aparece", "ocultar");

			// Alterna el signo 'plus' o 'minus'
			["plus", "minus"].map((n) => DOM.expandeContraes[indice].classList.toggle("fa-square-" + n));

			// Fin
			return;
		}

		// Mostrar resultados - Anchor 'verVideo'
		else if (elemento == DOM.anchorVerVideo) {
			v.videoConsVisto = true;
			DOM.cartelVerVideo.classList.add("ocultar");
			return;
		}

		// Mostrar resultados - Preferencia por producto
		else if (nombre == "ppp" && (padre.id == "iconos" || padre.tagName == "TD")) {
			e.preventDefault(); // Previene el efecto del anchor
			await cambiosEnBD.ppp(elemento); // Actualiza la 'ppp'
			return;
		}

		// Oculta las prefs
		else if (DOM.iconoParaMostrarPrefs.className.includes("flechaIzq") && !elemento.closest("#configCons")) {
			// Cambia la flecha
			DOM.iconoParaMostrarPrefs.classList.remove("flechaIzq");
			DOM.iconoParaMostrarPrefs.classList.add("flechaDer");

			// Devuelve la flecha a su lugar
			DOM.mostrarPrefs.classList.remove("derechaX");
			DOM.mostrarPrefs.classList.add("izquierdaX");

			// Oculta los filtros
			DOM.configCons.classList.remove("aumentaX");
			DOM.configCons.classList.add("disminuyeX");

			// Fin
			return;
		}

		// De lo contrario, alterna entre lo que se muestra sobre la 'imagen derecha'
		else if (["encabezado", "contadorDeProds", "imgDerecha"].includes(nombre)) {
			// 1. Si se ve 'zonaDisponible', lo oculta y muestra 'cartelRclv'
			if (!DOM.zonaDisponible.className.includes("toggle")) {
				DOM.zonaDisponible.classList.add("toggle");
				if (DOM.cartelRclv) DOM.cartelRclv.classList.remove("toggle");
			}

			// 2. Si se ve 'cartelRclv', lo oculta
			else if (DOM.cartelRclv && !DOM.cartelRclv.className.includes("toggle")) {
				DOM.zonaDisponible.classList.add("toggle");
				if (DOM.cartelRclv) DOM.cartelRclv.classList.add("toggle");
			}

			// 3. Muestra 'zonaDisponible'
			else {
				DOM.zonaDisponible.classList.remove("toggle");
				if (DOM.cartelRclv) DOM.cartelRclv.classList.add("toggle");
			}
		}
	});
});
