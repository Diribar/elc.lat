"use strict";

module.exports = (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (req.method != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Variables
	const ruta = req.originalUrl.split("?")[0];

	// Si desconoce el url, muestra el cartel de error
	const rutaConHistorial = comp.rutasConHistorial(ruta);
	const rutaSinHistorial = comp.rutasSinHistorial(ruta);
	if (!rutaConHistorial && !rutaSinHistorial) {
		console.log("\n¡Atención! - Ruta desconocida:", ruta, req.session.cliente && req.session.cliente.cliente_id);
		const vistaAnterior = variables.vistaAnterior(req.session.urlActual); // tiene que ser la actual, porque aún no se actualizó
		const informacion = {
			mensajes: ["No tenemos esa dirección en nuestro sistema (url-historial)"],
			iconos: [vistaAnterior, variables.vistaConsultas],
		};
		return res.render("CMP-0Estructura", {informacion});
	}

	// 'urlActual' y 'urlAnterior'
	const urlActual = req.originalUrl;
	const urlAnterior = req.session.urlActual || (req.cookies && req.cookies.urlActual) || "/";

	// Condiciones - urlFueraDeUsuarios
	const urlFueraDeUsuarios = !urlAnterior.startsWith("/usuarios/");

	// Condiciones - urlSinParametros y urlSinCaptura
	const urlSinParametros = !urlAnterior.includes("/?") && urlFueraDeUsuarios;
	const urlSinCaptura =
		urlSinParametros || // las rutas sin parámetros
		["/detalle/", "/historial/"].some((n) => urlAnterior.includes(n)); // detalle e historial tienen parámetros pero son sin captura

	// Condiciones - urlSinLogin
	const noRutasConLogin = FN.noRutasConLogin(urlAnterior);
	const urlSinLogin = urlFueraDeUsuarios && urlSinCaptura && noRutasConLogin;
	const urlFueraDeContactanos = !urlAnterior.includes("/contactanos");

	// urlsGuardadas
	const urlsGuardadas = {
		// Temas de usuario
		urlFueraDeUsuarios,
		urlSinLogin,
		urlFueraDeContactanos,

		// Temas de captura
		urlSinParametros,
		urlSinCaptura,
	};

	// Averigua si es una ruta aceptada
	const rutaAceptada = FN.rutaAceptada(urlActual, urlAnterior);

	// Asigna las sessions
	const urlsBasicas = {urlActual, urlAnterior};
	for (let url in urlsBasicas) {
		req.session[url] = rutaAceptada
			? urlsBasicas[url] // actualiza
			: req.session[url] // si no es una ruta aceptada, conserva la anterior
			? req.session[url]
			: req.cookies && req.cookies[url]
			? req.cookies[url]
			: "/";
		res.cookie(url, req.session[url], {maxAge: unDia});
	}
	for (let url in urlsGuardadas) {
		req.session[url] =
			rutaAceptada && urlsGuardadas[url]
				? urlAnterior
				: req.session[url]
				? req.session[url]
				: req.cookies && req.cookies[url]
				? req.cookies[url]
				: "/";
		res.cookie(url, req.session[url], {maxAge: unDia});
	}

	// Lleva info a locals
	res.locals.urlActual = req.session.urlActual;

	// Fin
	return next();
};

// Funciones
const FN = {
	rutaAceptada: (urlActual, urlAnterior) => {
		// Variables
		let urlAnteriorSinQuery = urlAnterior.split("?")[0];
		const rutasIncludes = [
			...["/historial", "/inactivar", "/recuperar", "/eliminado", "/correccion"], // Familia
			...["/agregar", "/detalle/", "/edicion"],
			...["/ordena-capitulos", "/califica", "/productos-por-registro/r"],
			...["/abm-links/p", "/mirar/l"],
		];
		const rutasStartsWith = [
			...["/usuarios", "/revision", "/graficos", "/institucional"],
			...["/mantenimiento", "/movimientos-del-dia", "/cookies", "/session", "/listados/links"], // Miscelaneas
		];
		const ciertasRutas = ["/usuarios/garantiza-login-y-completo", "/usuarios/logout", "/api/", "/eliminado/"];

		// Limpia las variables
		if (urlActual != "/" && urlActual.endsWith("/")) urlActual = urlActual.slice(0, -1);
		if (urlAnterior != "/" && urlAnterior.endsWith("/")) urlAnterior = urlAnterior.slice(0, -1);
		if (urlAnteriorSinQuery != "/" && urlAnteriorSinQuery.endsWith("/"))
			urlAnteriorSinQuery = urlAnteriorSinQuery.slice(0, -1);

		// Validaciones
		const diferenteRutaAnterior = urlActual != urlAnterior && urlActual != urlAnteriorSinQuery; // Es diferente a la ruta urlAnterior
		const perteneceRutasIN = rutasIncludes.some((n) => urlActual.includes(n)); // Pertenece a las rutas aceptadas
		const perteneceRutasSW = rutasStartsWith.some((n) => urlActual.startsWith(n)); // Pertenece a las rutas aceptadas
		const noContieneCiertasRutas = !ciertasRutas.some((n) => urlActual.includes(n));

		// Fin
		return diferenteRutaAnterior && (perteneceRutasIN || perteneceRutasSW || urlActual == "/") && noContieneCiertasRutas;
	},
	noRutasConLogin: (urlAnterior) => {
		// Condiciones - urlSinLogin
		const noAgregar = !urlAnterior.includes("/agregar");
		const noGrafico = !urlAnterior.startsWith("/graficos/");
		const noMovims = urlAnterior != "/movimientos-del-dia";

		// Fin
		return noAgregar && noGrafico && noMovims;
	},
};
