"use strict";

module.exports = async (req, res, next) => {
	// Verifica y avanza
	if (
		comp.omitirMiddlewsTransv(req) ||
		req.session.cliente || // Si ya hay una visita previa
		(req.cookies && req.cookies.cliente_id) || // Si ya hay una visita previa
		req.session.bienvenido // Si ya se aceptó el cartel de 'Bienvenido'
	)
		return next();

	// Prepara los mensajes y el ícono
	const mensajes = [
		"Bienvenido/a a nuestro sitio de <em>Recomendación de Películas</em> con valores afines a la Fe Católica Apostólica Romana",
		"Acá te ayudamos a elegir una película, y te orientamos dónde verla.",
		"Intentamos tener en catálogo todas las películas que existan con ese perfil. Si nos falta alguna, nos la podés agregar creándote un usuario.",
		"Usamos cookies para que tengas una mejor experiencia de navegación.",
		"Para avanzar, apretá el ícono <em><i class='fa-solid fa-thumbs-up'></i></em> que está a continuación.",
	];
	const icono = {...variables.vistaEntendido(req.originalUrl), autofocus: true};

	// Prepara la información
	const informacion = {mensajes, iconos: [icono], titulo: "Te damos la Bienvenida", check: true, bienvenido: true};

	// Fin
	return res.render("CMP-0Estructura", {informacion});
};
