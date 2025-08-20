"use strict";

const exportar = {
	// Clientes
	clientesBD: async (req, res) => {
		const datos = await baseDatos.obtieneTodos("persBdDiaAcum");
		const datosMeses = datos.filter((n) => !n.fecha);
		const datosDia = datos.slice(-1)[0];
		return res.json([...datosMeses, datosDia]);
	},

	// Navegantes
	navegsDia: async (req, res) => {
		const registros = await baseDatos.obtieneTodosConOrden("persWebDiaAcum", "fecha");
		return res.json(registros);
	},

	// Productos
	prodsPorPublico: async (req, res) => {
		// Variables
		const publicos = ["mayores", "familia", "menores"];
		let cfc = {};
		let vpc = {};
		let productos = [];

		// Obtiene los productos
		for (const entidad of ["peliculas", "colecciones"])
			productos.push(baseDatos.obtieneTodosPorCondicion(entidad, {statusRegistro_id: aprobados_ids}, "publico"));
		productos = await Promise.all(productos).then((n) => n.flat());

		// Cuenta las cantidades
		let prods = {cfc: productos.filter((n) => n.cfc), vpc: productos.filter((n) => !n.cfc)};
		for (const publico of publicos) {
			cfc[publico] = prods.cfc.filter((n) => n.publico && n.publico.grupo == publico).length;
			vpc[publico] = prods.vpc.filter((n) => n.publico && n.publico.grupo == publico).length;
		}

		// Fin
		return res.json([{cfc, vpc}, publicos]);
	},
	prodsCfcVpc: async (req, res) => {
		// Variables
		let productos = [];

		// Obtiene los productos
		for (const entidad of ["peliculas", "colecciones"])
			productos.push(baseDatos.obtieneTodosPorCondicion(entidad, {statusRegistro_id: activos_ids}));
		productos = await Promise.all(productos).then((n) => n.flat());

		// Cuenta las cantidades
		let prods = {cfc: productos.filter((n) => n.cfc), vpc: productos.filter((n) => !n.cfc)};
		const aprob = {
			cfc: prods.cfc.length,
			vpc: prods.vpc.filter((n) => aprobados_ids.includes(n.statusRegistro_id)).length,
		};
		const pend = prods.vpc.length - aprob.vpc;

		// Fin
		return res.json({aprob, pend});
	},
	prodsPorEpocaEstr: async (req, res) => {
		// Variables
		const epocasInverso = [...epocasEstreno].reverse();
		const condicion = {statusRegistro_id: aprobados_ids, anoEstreno: {[Op.ne]: null}, linksGral: {[Op.gt]: 0}};
		let cfc = {};
		let vpc = {};
		let productos = [];

		for (let entidad of ["peliculas", "colecciones"]) productos.push(baseDatos.obtieneTodosPorCondicion(entidad, condicion));
		productos = await Promise.all(productos).then((n) => n.flat());

		for (let epoca of epocasInverso) {
			const cantPelis = productos.filter((n) => n.anoEstreno >= epoca.desde && n.anoEstreno <= epoca.hasta);
			cfc[epoca.nombre] = cantPelis.filter((n) => n.cfc).length;
			vpc[epoca.nombre] = cantPelis.filter((n) => !n.cfc).length;
		}

		// Fin
		return res.json({cfc, vpc});
	},

	// Rclvs
	rclvsRangosSinEfems: async (req, res) => {
		// Variables
		let fechas = await obtieneFechasConEfems();

		// Obtiene rangos entre efemérides
		fechas.forEach((fecha, i) => {
			const sig = i + 1 < fechas.length ? i + 1 : 0; // si se llegó al final, empieza desde el comienzo
			fecha.rango = fechas[sig].id - fecha.id;
			if (fecha.rango < 0) fecha.rango += 366; // excepción para el último registro
		});

		// Filtra los registros
		fechas = fechas.filter((n) => n.rango > 4);

		// Fin
		return res.json(fechas);
	},

	// Links
	linksVencim: async (req, res) => res.json({cantLinksVencPorSem, primerLunesDelAno, lunesDeEstaSemana, unaSemana, linksSems}),
	linksPorProv: async (req, res) => {
		// Obtiene los provs
		let provs = await baseDatos.obtieneTodos("linksProvs", "links");

		// Cuenta la cantidad de links
		provs = provs.map((m) => {
			m.links = m.links.filter((p) => aprobados_ids.includes(p.statusRegistro_id)).length;
			return m;
		});

		// Ordena de mayor a menor, por cantidad de links
		provs.sort((a, b) => (a.links > b.links ? -1 : 1));

		// Fin
		return res.json(provs);
	},
};

// Agrega métodos
for (let tema of ["Hora", "Prod", "Ruta"])
	exportar["navegsPor" + tema] = async (req, res) => {
		const registros = await baseDatos.obtieneTodosConOrden("navegsDia" + tema + "Acum", "fecha");
		return res.json(registros);
	};

// Exporta
module.exports = exportar;

// Funciones
const obtieneFechasConEfems = async () => {
	// Variables
	const rclvEnts = variables.entidades.rclvs.slice(0, -1); // quita la entidad 'epocaDelAno'

	// Obtiene las fechas con su rclv
	let fechas = await baseDatos.obtieneTodos("fechasDelAno", rclvEnts).then((n) => n.filter((n) => n.id < 400));

	// Concentra los distintos rclvs en el campo rclv
	for (let fecha of fechas)
		for (let rclvEnt of rclvEnts)
			if (!fecha.rclvs && fecha[rclvEnt].filter((n) => n.religion_id != "VPC").length) fecha.rclvs = true; // Se fija que tenga un rclv que pueda figurar como imagen derecha (se excluyen los personajes 'VPC')

	// Conserva solo las fechas con efemérides
	fechas = fechas.filter((n) => n.rclvs);

	// Elimina info innecesaria
	fechas = fechas.map((n) => ({id: n.id, nombre: n.nombre, rclvs: n.rclvs}));

	// Fin
	return fechas;
};
