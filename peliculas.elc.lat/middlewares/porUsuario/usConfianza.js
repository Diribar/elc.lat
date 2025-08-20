"use strict";

module.exports = async (req, res, next) => {
	// Variables
	const usuario = await comp.obtieneUsuarioPorMail(req.session.usuario.email);
	const vistaAnterior = variables.vistaAnterior(req.session.urlSinLogin);
	let informacion;

	// Revisa si está dentro de su Nivel de Confianza
	if (!informacion && !usuario.rol.autTablEnts) {
		// Funciones
		const FN = {
			entidades: () => {
				// Variables
				const entidad = comp.obtieneEntidadDesdeUrl(req);
				const familia = comp.obtieneDesdeEntidad.familia(entidad);

				// Resultados
				const links = originalUrl.includes("/abm-links/");
				const producto = !links && familia == "producto";
				const rclv = familia == "rclv";
				const entidades = producto
					? variables.entidades.prods
					: rclv
					? variables.entidades.rclvs
					: links
					? ["links"]
					: "";

				// Fin
				return {entidades, producto, rclv, links};
			},
			// Cuenta los registros pendientes de revisar
			registrosPends: async function () {
				// Variables
				const {entidades} = this.entidades();

				// Fin
				return edicion
					? // Cuenta registros de edición
					  await regsConEdicion(usuario.id)
					: // Cuenta registros originales con status 'a revisar'
					  await regsConStatusARevisar(usuario.id, entidades);
			},
			// Obtiene el nivel de confianza
			nivelDeConfianza: function () {
				// Variables
				const {producto, rclv, links} = this.entidades();

				// Obtiene la cantidad de aprobaciones
				const aprob = producto
					? usuario.prodsAprob
					: rclv
					? usuario.rclvsAprob
					: links
					? usuario.linksAprob
					: edicion
					? usuario.edicsAprob
					: 0;

				// Obtiene la cantidad de rechazos
				const rech = producto
					? usuario.prodsRech
					: rclv
					? usuario.rclvsRech
					: links
					? usuario.linksRech
					: edicion
					? usuario.edicsRech
					: 0;

				// Prepara los parámetros
				const cantMinima = 1;
				const acelerador = 50;
				const cantDesempeno = aprob - rech + acelerador;

				// Fin
				return Math.max(cantMinima, cantDesempeno);
			},
		};

		// Variables
		const originalUrl = req.originalUrl;
		const edicion = originalUrl.includes("/edicion/");
		const registrosPends = await FN.registrosPends();
		const nivelDeConfianza = FN.nivelDeConfianza();

		// Si la cantidad de registros es mayor o igual que el nivel de confianza --> Error
		if (registrosPends >= nivelDeConfianza)
			informacion = {
				mensajes: edicion
					? [
							"Gracias por los ediciones sugeridas anteriormente.",
							"Queremos analizarlas, antes de que sigas editando otros registros.",
							"En cuanto las hayamos analizado, te habilitaremos para que edites más.",
							"La cantidad autorizada irá aumentando a medida que tus propuestas sean aprobadas.",
					  ]
					: [
							"Gracias por los registros agregados anteriormente.",
							"Queremos analizarlos, antes de que sigas agregando otros.",
							"Cuando los hayamos analizado, te habilitaremos para que ingreses más.",
							"La cantidad autorizada irá aumentando a medida que tus propuestas sean aprobadas.",
					  ],
				iconos: [vistaAnterior],
				trabajando: true,
			};
	}

	// Si corresponde, muestra el mensaje
	if (informacion) return res.render("CMP-0Estructura", {informacion});

	// Fin
	return next();
};

let regsConStatusARevisar = async (usuario_id, entidades) => {
	// Variables
	let condicion = {
		[Op.or]: [
			{[Op.and]: [{statusRegistro_id: creado_id}, {creadoPor_id: usuario_id}]},
			{[Op.and]: [{statusRegistro_id: inactivar_id}, {statusSugeridoPor_id: usuario_id}]},
			{[Op.and]: [{statusRegistro_id: recuperar_id}, {statusSugeridoPor_id: usuario_id}]},
		],
	};

	let contarRegistros = 0;
	for (let entidad of entidades) contarRegistros += await baseDatos.contarCasos(entidad, condicion);

	// Fin
	return contarRegistros;
};
let regsConEdicion = async (usuario_id) => {
	// Variables
	const entidades = ["prodEdics", "rclvEdics", "linkEdics"];
	let contarRegistros = 0;

	// Rutina para contar
	let condicion = {editadoPor_id: usuario_id};
	for (let entidad of entidades) contarRegistros += await baseDatos.contarCasos(entidad, condicion);

	// Fin
	return contarRegistros;
};
