"use strict";
window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		// Variables generales
		form: document.querySelector("#dataEntry"),
		submit: document.querySelector("#dataEntry #submit"),
		inputs: document.querySelectorAll(".inputError .input"),

		// 1a columna - religion_id y bhr
		religion_id: document.querySelector("select[name='religion_id']"),
		bhr: document.querySelectorAll("input[name='bhr']"),

		// Rclv
		checkRclv: document.querySelector("#segundaColumna #checkBox input"),
		selectsRclv: document.querySelector("#segundaColumna #selectsRclv"),
		errorRclv: document.querySelector(".inputError #errorRclv"),
		inputsRclv: document.querySelectorAll("#segundaColumna .inputError .input"),

		// Rclv - Sectores
		sectorRclv: document.querySelector("#segundaColumna"),
		sectorPers: document.querySelector("#segundaColumna #personaje_id"),
		sectorHecho: document.querySelector("#segundaColumna #hecho_id"),
		sectorValor: document.querySelector("#segundaColumna #tema_id"),

		// Rclv - Selects y Opciones
		selectPers: document.querySelector("select[name='personaje_id']"),
		selectHecho: document.querySelector("select[name='hecho_id']"),
		optgroupPers: document.querySelectorAll("select[name='personaje_id'] optgroup"),
		optgroupHecho: document.querySelectorAll("select[name='hecho_id'] optgroup"),

		// Rclv - Varios
		ayudaRclv: document.querySelectorAll("#segundaColumna .ayudaRclv"),
		iconosOK_Rclv: document.querySelectorAll("#segundaColumna .inputError .fa-circle-check"),
		iconosError_Rclv: document.querySelectorAll("#segundaColumna .inputError .fa-circle-xmark"),

		// Rclv - Links
		linksRclv_Alta: document.querySelectorAll("#segundaColumna .inputError .linkRclv.alta"),
		linksRclv_Edic: document.querySelectorAll("#segundaColumna .inputError .linkRclv.edicion"),

		// OK/Errores
		iconosError: document.querySelectorAll(".inputError .fa-circle-xmark"),
		iconosOK: document.querySelectorAll(".inputError .fa-circle-check"),
		mensajesError: document.querySelectorAll(".inputError .mensajeError"),
	};

	// Otras variables
	const camposError = ["religion_id", "bhr", "tipoActuacion_id", "rclv"];
	DOM.opcionesPers = [];
	for (let grupo of DOM.optgroupPers) DOM.opcionesPers.push([...grupo.children]);
	DOM.opcionesHechos = [];
	for (let grupo of DOM.optgroupHecho) DOM.opcionesHechos.push([...grupo.children]);
	let bhr = Array.from(DOM.bhr).find((n) => n.checked)?.value;

	// Comunes a todos los campos
	const funcionesGrales = {
		obtieneLosDatos: () => {
			// Variables
			let datosUrl = "bhr=" + bhr + "&";

			// Busca el checkbox de rclv
			if (DOM.checkRclv.checked) datosUrl += "sinRclv=on&";

			// Agrega el campo y el valor
			for (const input of DOM.inputs)
				if (camposRclv.includes(input.name) && DOM.checkRclv.checked) continue;// si es un rclv y el checkbox de rclv está activo, saltea
				else datosUrl += input.name + "=" + encodeURIComponent(input.value) + "&";

			// Fin
			return datosUrl;
		},
		muestraLosErrores: async (datos, mostrarIconoError) => {
			errores = await fetch(rutas.validar + datos).then((n) => n.json());
			// return;
			camposError.forEach((campo, indice) => {
				if (errores[campo] !== undefined) {
					DOM.mensajesError[indice].innerHTML = errores[campo];
					// Acciones en función de si hay o no mensajes de error
					errores[campo]
						? DOM.iconosError[indice].classList.add("error")
						: DOM.iconosError[indice].classList.remove("error");
					errores[campo] && mostrarIconoError
						? DOM.iconosError[indice].classList.remove("ocultar")
						: DOM.iconosError[indice].classList.add("ocultar");
					errores[campo]
						? DOM.iconosOK[indice].classList.add("ocultar")
						: DOM.iconosOK[indice].classList.remove("ocultar");
				}
			});
			// Fin
			return;
		},
		actualizaBotonSubmit: () => {
			// Detectar la cantidad de 'errores' ocultos
			let hayErrores = Array.from(DOM.iconosError)
				.map((n) => n.className)
				.some((n) => n.includes("error"));
			// Consecuencias
			hayErrores ? DOM.submit.classList.add("inactivo") : DOM.submit.classList.remove("inactivo");
		},
		statusInicial: async function (mostrarIconoError) {
			// Variables
			let datosUrl = this.obtieneLosDatos();
			// Consecuencias de la validación de errores
			await this.muestraLosErrores(datosUrl, mostrarIconoError);
			this.actualizaBotonSubmit();
			// Impactos en rclv
			for (let metodo in impactoVisualEnRclv) impactoVisualEnRclv[metodo]();
			// Fin
			return;
		},
		submitForm: async function (e) {
			e.preventDefault();
			if (DOM.submit.className.includes("inactivo")) this.statusInicial(true);
			else DOM.form.submit();
		},
		urlRclv: (campo) => {
			// Variables
			const checkRclv = DOM.checkRclv.checked;

			// Agrega el valor del campo 'sin' o de los demás campos
			let url = "";
			checkRclv
				? (url += campo + "=on" + "&")
				: camposRclv.forEach((n, i) => (url += n + "=" + DOM.inputsRclv[i].value + "&"));

			// Agrega 'ocurrió'
			if (bhr) url += "bhr=" + bhr;

			// Fin
			return url;
		},
		guardaLosValoresEnSessionCookies: function () {
			let params = this.obtieneLosDatos();
			// Guardar los valores en session y cookies
			if (params.length) fetch(rutas.guardaDatosAdics + params);
			// Fin
			return;
		},
	};
	// Rclv
	const impactoVisualEnRclv = {
		religion_id: () => {
			// Variables
			const religion_id = DOM.religion_id.value;

			// Función
			const actualizaOpcs = (select, grupoOpciones, opcsDeLosGrupos) => {
				// Variables
				const opcion_id = DOM[select].value;
				DOM[select].innerHTML = "";
				DOM[grupoOpciones].forEach((grupo, i) => {
					// Si el grupo no pertenece a la religión, no lo muestro
					if (!grupo.dataset.categ.includes(religion_id)) return;

					// Borra todas las opciones y agrega las que van
					grupo.innerHTML = "";
					const opciones = DOM[opcsDeLosGrupos][i].filter((opcion) => opcion.dataset.categ.includes(religion_id));
					for (let opcion of opciones) {
						if (opcion.value == opcion_id) opcion.selected = true;
						grupo.appendChild(opcion);
					}
					if (grupo.childElementCount) DOM[select].appendChild(grupo); // si tiene opciones, agrega el grupo
				});
			};

			// Borra todas las opciones y agrega las que van
			actualizaOpcs("selectPers", "optgroupPers", "opcionesPers"); // Personajes
			actualizaOpcs("selectHecho", "optgroupHecho", "opcionesHechos"); // Hechos

			// Fin
			return;
		},
		bhr: () => {
			// Oculta o muestra el sector de rclvs
			bhr ? DOM.sectorRclv.classList.remove("ocultar") : DOM.sectorRclv.classList.add("ocultar");

			// Acciones si ocurrió
			if (bhr == "1") {
				// Muestra 'personaje_id'
				DOM.sectorPers.classList.remove("ocultar");
				DOM.ayudaRclv[0].classList.remove("ocultar");

				// Muestra 'hecho_id'
				DOM.sectorHecho.classList.remove("ocultar");
				DOM.ayudaRclv[1].classList.remove("ocultar");
			}

			// Acciones si no ocurrió
			if (bhr == "0") {
				// Oculta 'personaje_id'
				DOM.sectorPers.classList.add("ocultar");
				DOM.ayudaRclv[0].classList.add("ocultar");

				// Oculta 'hecho_id'
				DOM.sectorHecho.classList.add("ocultar");
				DOM.ayudaRclv[1].classList.add("ocultar");
			}
		},
		sinRclv: () => {
			// Muestra u oculta el sector rclv
			DOM.checkRclv.checked ? DOM.selectsRclv.classList.add("ocultar") : DOM.selectsRclv.classList.remove("ocultar");
			// Fin
			return;
		},
		edicJesusNinguno: () => {
			// Acciones si el valor es 'Ninguno' o 'Jesús'
			DOM.inputsRclv.forEach((inputRclv, indice) => {
				inputRclv.value == "1" || (indice == 0 && inputRclv.value == "11")
					? DOM.linksRclv_Edic[indice].classList.add("ocultar")
					: DOM.linksRclv_Edic[indice].classList.remove("ocultar");
			});
			// Fin
			return;
		},
	};

	// Eventos - Averigua si hubieron cambios
	DOM.form.addEventListener("change", async (e) => {
		// Define los valores para 'campo' y 'valor'
		let campo = e.target.name;
		let valor = encodeURIComponent(e.target.value);
		let datosUrl = "";

		// Particularidades
		if (campo == "bhr") bhr = Array.from(DOM.bhr).find((n) => n.checked)?.value;

		// 1. Para campos 'religion_id', 'ocurrió', 'sinRclv'
		if (campo == "religion_id" || campo == "bhr" || campo == "sinRclv") impactoVisualEnRclv[campo]();

		// 2. Para campos 'rclv'
		if (camposRclv.includes(campo)) impactoVisualEnRclv.edicJesusNinguno();
		if (campo == "sinRclv" || camposRclv.includes(campo)) DOM.errorRclv.classList.remove("ocultar");

		// Prepara los datos a validar
		if ([...camposRclv, "sinRclv", "bhr"].includes(campo)) datosUrl += funcionesGrales.urlRclv(campo);
		else datosUrl += campo + "=" + valor;

		// Valida errores
		await funcionesGrales.muestraLosErrores(datosUrl, true);

		// Actualiza botón Submit
		funcionesGrales.actualizaBotonSubmit();
	});

	// Links a rclv - Alta
	DOM.linksRclv_Alta.forEach((link) => {
		link.addEventListener("click", () => {
			// Guardar los valores en Session y Cookies
			funcionesGrales.guardaLosValoresEnSessionCookies();

			// Obtiene la rclvEnt
			const rclvEnt = obtieneRclvEnt(link);

			// Para ir a la vista rclv
			location.href = "/" + rclvEnt + "/agregar/r/?prodEnt=" + entidad + "&origen=PDA";
		});
	});
	// Links a rclv - Edición
	DOM.linksRclv_Edic.forEach((link, i) => {
		link.addEventListener("click", () => {
			// Guardar los valores en Session y Cookies
			funcionesGrales.guardaLosValoresEnSessionCookies();

			// Redirige a la vista rclv
			const rclvEnt = obtieneRclvEnt(link);
			const id = DOM.inputsRclv[i].value;
			location.href = "/" + rclvEnt + "/edicion/r/?id=" + id + "&prodEnt=" + entidad + "&origen=PDA";
		});
	});

	// Previene el submit
	DOM.form.addEventListener("submit", async (e) => funcionesGrales.submitForm(e));
	DOM.submit.addEventListener("click", async (e) => funcionesGrales.submitForm(e));
	DOM.submit.addEventListener("keydown", async (e) => (e.key == "Enter" || e.key == "Space") && funcionesGrales.submitForm(e));

	// STATUS INICIAL
	funcionesGrales.statusInicial();
});

// Variables
const rutas = {
	validar: "/producto/api/pa-valida-da/?",
	guardaDatosAdics: "/producto/api/pa-guarda-datos-adicionales/?",
};
const camposRclv = ["personaje_id", "hecho_id", "tema_id"];

const obtieneRclvEnt = (link) =>
	link.className.includes("personaje") ? "personajes" : link.className.includes("hecho") ? "hechos" : "temas";
