"use strict";
// Variables
const procesos = require("./PA-FN4-Procesos");

module.exports = {
	// ControllerAPI (validaPalabrasClave)
	palabrasClave: (dato, minimo) => {
		// Campo palabrasClave
		const palabrasClave =
			minimo == 1
				? (dato && comp.validacs.longitud(dato, minimo, 55)) || "" // desde API
				: comp.validacs.longitud(dato, minimo, 55); // desde POST

		const errores = {palabrasClave};
		errores.hay = Object.values(errores).some((n) => !!n);

		// Fin
		return errores;
	},
	// ControllerAPI (validaIngresIM, validaIngresoFA)
	IM: (datos) => {
		// Variables
		const errores = {};
		errores.hay = Object.values(datos).some((n) => !n);

		// Final
		return errores;
	},
	// ControllerAPI (validaIngresoFA)
	FA: (datos) => {
		// Variables
		const errores = {};

		// Dirección
		const url = datos.url;
		errores.url = !url
			? inputVacio
			: !url.includes("www.filmaffinity.com/") ||
			  url.indexOf("www.filmaffinity.com/") + 21 >= url.indexOf("/film") ||
			  url.indexOf("/film") + 5 >= url.indexOf(".html")
			? "No parece ser una dirección de Film Affinity"
			: "";

		// Avatar
		errores.avatarUrl = !datos.avatarUrl
			? "Necesitamos que agregues una imagen"
			: !datos.avatarUrl.includes("pics.filmaffinity.com/")
			? "No parece ser una imagen de FilmAffinity"
			: !datos.avatarUrl.includes("large.jpg")
			? "Necesitamos que consigas el link de la imagen grande"
			: "";

		// Contenido
		const contenido = datos.contenido ? procesos.FA.contenidoFA(datos.contenido) : {};
		errores.contenido = !datos.contenido ? inputVacio : !Object.keys(contenido).length ? "No se obtuvo ningún dato" : "";

		// Ajustes finales
		errores.hay = Object.values(errores).some((n) => !!n);
		errores.campos = Object.keys(contenido).length;

		// Final
		return errores;
	},
};
