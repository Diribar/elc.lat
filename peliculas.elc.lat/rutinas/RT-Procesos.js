"use strict";

module.exports = {
	stoppersFeedbackParaUsers: (usuario) => {
		if (!usuario.pais || !usuario.email) return true;

		// Acciones para saltear la rutina, dependiendo de la hora
		const ahora = new Date();
		const zonaHoraria = usuario.pais.zonaHoraria;
		const ahoraUsuario = ahora.getTime() + zonaHoraria * unaHora;
		if (
			(!entDesarr && new Date(ahoraUsuario).getUTCHours()) || // Producción: saltea si para el usuario no son las 0hs
			(entDesarr && !new Date(ahoraUsuario).getUTCHours()) // Desarrollo: saltea si para el usuario son las 0hs
		)
			return true;

		// Si ya se envió un comunicado en el día y en la misma franja horaria, saltea el usuario
		const hoyUsuario = comp.fechaHora.diaMesAnoUTC(ahora);
		const fechaRevisores = usuario.fechaRevisores ? comp.fechaHora.diaMesAnoUTC(usuario.fechaRevisores) : null;
		const horaUsuario = ahora.getUTCHours();
		const horaRevisores = usuario.fechaRevisores ? usuario.fechaRevisores.getUTCHours() : null;
		if (hoyUsuario === fechaRevisores && horaUsuario === horaRevisores) return true;

		// Fin
		return false;
	},
	ABM_noRevs: async () => {
		// Variables
		const statusProvisorios = [creado_id, inactivar_id, recuperar_id];
		let entsProdsRclvs, include, condicion;

		// regsPERL
		condicion = {statusRegistro_id: statusProvisorios, statusSugeridoPor_id: {[Op.ne]: usAutom_id}};
		entsProdsRclvs = [...variables.entidades.prodsRclvs];
		include = "statusSugeridoPor";
		let regsPERL = [];
		for (let entidad of entsProdsRclvs) {
			const familia = comp.obtieneDesdeEntidad.familia(entidad);
			const registros = baseDatos
				.obtieneTodosPorCondicion(entidad, condicion, include)
				.then((regs) => regs.filter((reg) => !rolesRevPERL_ids.includes(reg.statusSugeridoPor.rolUsuario_id)))
				.then((regs) => regs.map((reg) => ({...reg, entidad, familia})));
			regsPERL.push(registros);
		}
		regsPERL = await Promise.all(regsPERL).then((n) => n.flat());

		// edicsPERL
		entsProdsRclvs = ["prodEdics", "rclvEdics"];
		include = {prodEdics: variables.entidades.prodAsocs, rclvEdics: variables.entidades.rclvAsocs};
		let edicsPERL = [];
		for (let entPERL of entsProdsRclvs) {
			const registros = baseDatos
				.obtieneTodos(entPERL, ["editadoPor", ...include[entPERL]])
				.then((edics) => edics.filter((edic) => !rolesRevPERL_ids.includes(edic.editadoPor.rolUsuario_id)))
				.then((edics) =>
					edics.map((edic) => {
						const asociacion = comp.obtieneDesdeCampo_id.asociacion(edic);
						const entidad = comp.obtieneDesdeCampo_id.entidad(edic, entPERL);
						const familia = comp.obtieneDesdeEntidad.familia(entidad);
						return {...edic[asociacion], entidad, familia};
					})
				)
				.then((prods) => prods.filter((prod) => !statusProvisorios.includes(prod.statusRegistro_id)));
			edicsPERL.push(registros);
		}
		edicsPERL = await Promise.all(edicsPERL).then((n) => n.flat());

		// regsLinks
		condicion = {...condicion, prodAprob: true};
		include = ["statusSugeridoPor", ...variables.entidades.prodAsocs];
		const regsLinks = await baseDatos
			.obtieneTodosPorCondicion("links", condicion, include)
			.then((links) => links.filter((link) => !rolesRevLinks_ids.includes(link.statusSugeridoPor.rolUsuario_id)))
			.then((links) =>
				links.map((link) => {
					const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(link);
					const entidad = comp.obtieneDesdeCampo_id.prodEnt(link);
					return {...link[prodAsoc], entidad, familia: "links"};
				})
			)
			.then((prods) => comp.eliminaRepetidos(prods));

		// edicsLinks
		include = ["editadoPor", ...variables.entidades.prodAsocs];
		const edicsLinks = await baseDatos
			.obtieneTodos("linkEdics", include)
			.then((edics) => edics.filter((edic) => !rolesRevPERL_ids.includes(edic.editadoPor.rolUsuario_id)))
			.then((edics) =>
				edics.map((edic) => {
					const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(edic);
					const entidad = comp.obtieneDesdeCampo_id.prodEnt(edic);
					return {...edic[prodAsoc], entidad, familia: "links"};
				})
			)
			.then((prods) => comp.eliminaRepetidos(prods));

		// Fin
		return {regs: {perl: regsPERL, links: regsLinks}, edics: {perl: edicsPERL, links: edicsLinks}};
	},
	finRutinasHorarias: (campo, duracion) => {
		// Variables
		duracion = duracion.toLocaleString("pt"); // 'es' no coloca el separador de miles
		const {FechaUTC, HoraUTC} = RT_comp.fechaHoraUTC();

		// Feedback del proceso
		console.log(FechaUTC, HoraUTC + "hs. -", (duracion + "ms").padStart(7, " "), "-", campo);

		// Fin
		return;
	},
};
