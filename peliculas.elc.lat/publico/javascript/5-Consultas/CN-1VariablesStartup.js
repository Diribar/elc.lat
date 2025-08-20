"use strict";

window.addEventListener("load", async () => {
	// Variables - DOM
	DOM = {
		// Formulario General
		cuerpoFooterImgDer: document.querySelector("#cuerpoFooterImgDer"),
		cuerpo: document.querySelector("#cuerpo"),
		configCons: document.querySelector("#cuerpo #configCons"),
		encabMasPelis: document.querySelector("#cuerpo #encabMasPelis"),
		prefsSimples: document.querySelectorAll("#cuerpo :is(#encabezado, #configFiltros) .prefSimple"),

		// Zona de Preferencias
		cabecera: document.querySelector("#cuerpo #configCons #cabecera"),
		configFiltros: document.querySelector("#cuerpo #configCons #configFiltros"),

		// Encabezado
		tituloPrincipal: document.querySelector("#encabMasPelis #encabezado #tituloPrincipal"),
		contadorDeProds: document.querySelector("#encabMasPelis #encabezado #contadorDeProds"),

		// Zona de Productos
		zonaDisponible: document.querySelector("#encabMasPelis #zonaDisponible"),

		// Imagen derecha
		imgDerecha: document.querySelector("#imgDerecha img"),
	};
	DOM = {
		...DOM,

		// Encabezado - Título principal
		layout_id: DOM.tituloPrincipal.querySelector("#layoutCheckbox select[name='layout_id']"),
		excluyeInput: DOM.tituloPrincipal.querySelector("#layoutCheckbox #bajaCalif input"),
		excluyeLeyenda: DOM.tituloPrincipal.querySelector("#layoutCheckbox #bajaCalif .mostrarLeyenda"),
		religsInput: DOM.tituloPrincipal.querySelectorAll("#layoutCheckbox #religiones input"),
		religsLeyenda: DOM.tituloPrincipal.querySelector("#layoutCheckbox #religiones .mostrarLeyenda"),

		// Encabezado - Íconos del título
		compartirLeyenda: DOM.tituloPrincipal.querySelector("#iconosDelTitulo .mostrarLeyenda"),
		mostrarPrefs: DOM.tituloPrincipal.querySelector("#iconosDelTitulo #toggleFiltrosGlobal"),
		iconoParaMostrarPrefs: DOM.tituloPrincipal.querySelector("#iconosDelTitulo #toggleFiltrosGlobal .fa-chevron-right"),

		// Configuración de Cabecera - Botonera
		configNuevaNombre: DOM.cabecera.querySelector("#configNueva input[name='nombreNuevo']"),
		cabecera_id: DOM.cabecera.querySelector("select[name='cabecera_id']"),
		cabsPropias: DOM.cabecera.querySelector("select[name='cabecera_id'] optgroup#propios"),
		iconosBotonera: DOM.cabecera.querySelectorAll("#iconosBotonera i"),

		// Configuración de Campos - Preferencias
		nav: DOM.configFiltros.querySelector("nav"),
		presenciaEstable: DOM.configFiltros.querySelectorAll(".presenciaEstable"),
		selects: DOM.configFiltros.querySelectorAll("select"),
		palClaveInput: DOM.configFiltros.querySelector("#palabrasClave input"),
		palClaveIcono: DOM.configFiltros.querySelector("#palabrasClave i#palClaveIcono"),

		// Muestra / Oculta filtros
		toggleFiltros: DOM.configCons.querySelector("#toggleFiltros"),
		muestraFiltros: DOM.configCons.querySelector("#toggleFiltros #muestraFiltros"),
		ocultaFiltros: DOM.configCons.querySelector("#toggleFiltros #ocultaFiltros"),

		// Zona Disponible - Resultados
		vistaDeResults: DOM.zonaDisponible.querySelector("#vistaDeResults"),
		resultados: DOM.zonaDisponible.querySelectorAll("#vistaDeResults .resultados"),
		botones: DOM.zonaDisponible.querySelector("#vistaDeResults #botones"),

		// Zona Disponible - Carteles e Imagen de fondo
		telonFondo: DOM.zonaDisponible.querySelector("#vistaDeResults img#telonFondo"),
		carteles: DOM.zonaDisponible.querySelectorAll("#carteles .cartel"),
		noTenemos: DOM.zonaDisponible.querySelector("#carteles button#noTenemos"),
		loginNecesario: DOM.zonaDisponible.querySelector("#carteles button#loginNecesario"),
		cartelOrdenPPP: DOM.zonaDisponible.querySelector("#carteles #cartelOrdenPPP"),
		cartelUsSinPPP: DOM.zonaDisponible.querySelector("#carteles #cartelUsSinPPP"),
		cartelLoginPend: DOM.zonaDisponible.querySelector("#carteles #loginPend"),
		cartelVerVideo: DOM.zonaDisponible.querySelector("#carteles #verVideo"),
		cartelRclv: document.querySelector("#imgDerecha a:has(#cartelRclv)"),

		// Otros
		anchorVerVideo: DOM.zonaDisponible.querySelector("#carteles #verVideo span#consultas"),
	};

	// Variables de botonera
	for (let icono of DOM.iconosBotonera) {
		DOM[icono.id] = icono;
		v.titulo[icono.id] = icono.title;
	}
	for (let campo of DOM.selects) DOM[campo.name] = campo;

	// Variables - General
	v.camposFiltros = Array.from(DOM.selects).map((n) => n.name);
	v.cabeceras = await obtiene.cabecerasPosibles();
	v = {...v, ...(await obtiene.variablesDelBE())};
	v.camposConDefault = Object.keys(v.filtrosConsConDefault); // 'filtrosConsConDefault' viene del BE
	v.camposSinDefault = v.camposFiltros.filter((n) => !v.camposConDefault.includes(n));

	// Funciones de start-up
	await cambioDeConfig_id("start-up"); // establece el layout_id
	await accionesPorCambioDePrefs();
	v.mostrarResultados = true;
	FN_resultados.muestra();

	// Guarda el movimiento 'layout' en la base de datos
	await sessionCookie.guardaLayoutEnMovimsBD();
});

// Variables
const ruta = "/api/cn-";
let v = {
	pppRutaGuardar: "/producto/api/pr-guarda-la-preferencia-del-usuario/?entidad=",
	conLinksHD: "conLinksHD",
	enCast: "enCast",
	muestraFiltros: false,
	contadorDeMostrarResults: 0,
	titulo: {},
};
let DOM, cabecera, prefs, muestraConsCats;
