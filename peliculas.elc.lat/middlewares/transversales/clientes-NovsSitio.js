// Muestra carteles que se activan con el acceso al sitio (no se usa con apis)
"use strict";

module.exports = async (req, res, next) => {
	// Si corresponde, interrumpe la función
	if (req.method != "GET") return next();
	if (req.originalUrl.includes("/inactivar-captura/")) return next();
	if (comp.omitirMiddlewsTransv(req)) return next();

	// Variables
	const {cliente} = req.session;
	const {cliente_id} = cliente;
	const esUsuario = cliente_id.startsWith("U");
	const tabla = esUsuario ? "usuarios" : "visitas";
	let informacion;

	// Si el cliente ingresa por primera vez al sitio de películas, actualiza la versión en la tabla usuario y en la variable usuario
	if (!cliente.versPeliculas) {
		baseDatos.actualizaPorCondicion(tabla, {cliente_id}, {versPeliculas: version});
		cliente.versPeliculas = version;
	}

	// Cartel de novedades
	if (cliente.versPeliculas != version) {
		// Variables
		const permisos = ["permInputs", "autTablEnts", "revisorPERL", "revisorLinks", "revisorEnts", "revisorUs"];
		const novs = novsPeliculas.filter((n) => n.version > cliente.versPeliculas); // obtiene las novedades

		// Si la novedad especifica un permiso que el cliente no tiene, se la descarta
		for (let i = novs.length - 1; i >= 0; i--)
			for (let permiso of permisos)
				if (novs[i][permiso] && !cliente.rol[permiso]) {
					novs.splice(i, 1);
					break;
				}

		// Si hubieron novedades, genera la información
		if (novs.length)
			informacion = {
				mensajes: novs.map((n) => n.comentario + "."),
				iconos: [variables.vistaEntendido(req.originalUrl)],
				titulo: "Novedad" + (novs.length > 1 ? "es" : "") + " del sitio",
				check: true,
			};

		// Actualiza la versión en la tabla usuario y en la variable usuario
		baseDatos.actualizaPorCondicion(tabla, {cliente_id}, {versPeliculas: version});
		cliente.versPeliculas = version;
	}

	// Fin
	if (informacion) return res.render("CMP-0Estructura", {informacion});
	return next();
};
