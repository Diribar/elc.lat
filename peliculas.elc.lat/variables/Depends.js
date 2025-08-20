"use strict";

// Variables
const camposDD = [
	{titulo: "Título en castellano", nombre: "nombreCastellano", productos: true, campoInput: 1},
	{titulo: "Título original", nombre: "nombreOriginal", productos: true, campoInput: 1},
	{titulo: "Año de estreno", nombre: "anoEstreno", numero: true, productos: true, campoInput: 1, angosto: true},
	{titulo: "Año de finalización", nombre: "anoFin", numero: true, colecciones: true, campoInput: 1, angosto: true}, // Colecciones
	{titulo: "Duración (min)", nombre: "duracion", numero: true, peliculas: true, capitulos: true, campoInput: 1, angosto: true}, // Películas y Capítulos
	{titulo: "País/es", nombre: "paises_id", productos: true},
	{titulo: "Idioma Original", nombre: "idiomaOriginal_id", productos: true, relacInclude: "idioma_original", tabla: "idiomas"},
	{titulo: "Dirección", nombre: "direccion", productos: true, campoInput: 2},
	{titulo: "Guión", nombre: "guion", productos: true, campoInput: 2},
	{titulo: "Música", nombre: "musica", productos: true, campoInput: 2},
	{titulo: "Actuación", nombre: "actores", productos: true, campoInput: 2},
	{titulo: "Producción", nombre: "produccion", productos: true, campoInput: 2},
	{titulo: "Sinopsis", nombre: "sinopsis", productos: true, campoInput: 3},
	{titulo: "Avatar", nombre: "avatar", productos: true},
];
const camposDA = [
	{titulo: "Religión", nombre: "religion_id", relacInclude: "religion", tabla: "religiones"},
	{titulo: "Basada en Hechos Reales", nombre: "bhr", radioBtn: true},
	{titulo: "Es a color", nombre: "color", chkBox: true},
	{titulo: "Es un musical", nombre: "musical", chkBox: true},
	{titulo: "Tiene deporte", nombre: "deporte", chkBox: true},
	{titulo: "Crueldad sensible", nombre: "crueldad", chkBox: true, exclusivo: ["peliculas", "colecciones"]},
	{titulo: "Mostrar capítulos en consultas", nombre: "capEnCons", chkBox: true, exclusivo: ["colecciones"]},
	{titulo: "Tipo de Actuación", nombre: "tipoActuacion_id", relacInclude: "tipoActuacion", tabla: "tiposActuacion"},
	{titulo: "Público sugerido", nombre: "publico_id", relacInclude: "publico", tabla: "publicos"},
	{titulo: "Personaje histórico", nombre: "personaje_id", relacInclude: "personaje", tabla: "personajes", rclv: true},
	{titulo: "Hecho histórico", nombre: "hecho_id", relacInclude: "hecho", tabla: "hechos", rclv: true},
	{titulo: "Tema principal", nombre: "tema_id", relacInclude: "tema", tabla: "temas", rclv: true},
	{titulo: "Evento del año", nombre: "evento_id", relacInclude: "evento", tabla: "eventos", rclv: true},
	{titulo: "Época del año", nombre: "epocaDelAno_id", relacInclude: "epocaDelAno", tabla: "epocasDelAno", rclv: true},
	{titulo: "Época respecto a Cristo", nombre: "epocaOcurrencia_id", relacInclude: "epocaOcurrencia", tabla: "epocasOcurrencia"},
];
const prods = ["peliculas", "colecciones", "capitulos"];
const prodsNombre = ["Película", "Colección", "Capítulo"];
const prodAsocs = ["pelicula", "coleccion", "capitulo"];
const prodCampos_id = ["pelicula_id", "coleccion_id", "capitulo_id"];
const rclvs = ["personajes", "hechos", "temas", "eventos", "epocasDelAno"];
const rclvsNombre = ["Personaje", "Hecho", "Tema", "Evento en el Año", "Época del Año"];
const rclvAsocs = ["personaje", "hecho", "tema", "evento", "epocaDelAno"];
const rclvCampos_id = ["personaje_id", "hecho_id", "tema_id", "evento_id", "epocaDelAno_id"];
const obtienePublicos = () => {
	// Variables
	let resultado = [];

	// Obtiene los públicos procesados
	for (let publico of publicos) {
		// Variables
		const {id, nombre} = publico;
		const condic = {publico_id: id};

		// Agrega el público
		resultado.push({id, nombre, condic, indiv: true});
	}

	// Fin
	return resultado;
};

module.exports = {
	// Todos
	entidades: {
		// Productos y Rclvs
		...{prods, prodsNombre, prodAsocs, prodCampos_id},
		...{rclvs, rclvsNombre, rclvAsocs, rclvCampos_id},
		prodsRclvs: [...prods, ...rclvs],
		prodsRclvs_id: [...prodCampos_id, ...rclvCampos_id],
		prodsRclvsAsoc: [...prodAsocs, ...rclvAsocs],
		femenino: ["peliculas", "colecciones", "epocasDelAno"],

		// Todos
		todos: [...prods, ...rclvs, "links"],
		todosNombre: [...prodsNombre, ...rclvsNombre, "Link"],
		todosAsocs: [...prodAsocs, ...rclvAsocs, "link"],
		todos_id: [...prodCampos_id, ...rclvCampos_id, "link_id"],

		// Otros
		usuarios: ["usuarios"], // Hace falta para la eliminación de avatars
	},

	// Consulta de Productos
	filtrosCons: {
		// Con una opción elegida siempre
		idiomas: {
			default: "enCast",
			opciones: [
				{
					id: "hablCast",
					nombre: "Hablada en castellano",
					condic: {
						conLinks: {linksCast: conLinks},
						conLinksHD: {HD_Cast: conLinks},
					},
				},
				{
					id: "subtitulos",
					nombre: "Subtitulos en castellano",
					condic: {
						conLinks: {linksSubt: conLinks},
						conLinksHD: {HD_Subt: conLinks},
					},
				},
				{
					id: "enCast",
					nombre: "En castellano (habl./subt.)",
					condic: {
						conLinks: {[Op.or]: [{linksCast: conLinks}, {linksSubt: conLinks}]},
						conLinksHD: {[Op.or]: [{HD_Cast: conLinks}, {HD_Subt: conLinks}]}, //
					},
				},
				{
					id: "sinCast",
					nombre: "Sin castellano",
					condic: {
						conLinks: {linksSinCast: conLinks},
						conLinksHD: {[Op.and]: [{linksSinCast: conLinks}, {HD_Gral: conLinks}]},
					},
				},
				{id: "todos", nombre: "En cualquier idioma"},
			],
		},
		tiposLink: {
			default: "conLinks",
			opciones: [
				{id: "conLinks", nombre: "Con links", condic: {linksGral: conLinks}},
				{id: "conLinksHD", nombre: "Con links HD", condic: {HD_Gral: conLinks}},
				{id: "todos", nombre: "Con y sin links"},
			],
		},
		pppOpciones: {
			default: "6",
			opciones: [
				{id: "2", nombre: "Películas marcadas para ver"},
				{id: "3", nombre: "Películas sin marcar"},
				{id: "6", nombre: "Peliculas que me interesan"},
				{id: "todos", nombre: "Todas las preferencias"},
			],
		},
		publicos: {
			default: "MC",
			opciones: [
				// Agrupados
				{id: "todos", nombre: "Todos los públicos"},
				{
					id: "MC",
					nombre: "Mayores, Familia y Sin clasif.",
					condic: {publico_id: {[Op.or]: [null, ...mayores_ids]}}, // se debe escribir así: {[Op.or]: [null, ...mayores_ids]}
				},
				{id: "FM", nombre: "Familia y Menores (apto fam.)", condic: {publico_id: familia_ids}},
				{id: "MN", nombre: "Menores (ambas)", condic: {publico_id: menores_ids}},

				// Individuales
				...obtienePublicos(),
				{id: "SC", nombre: "Sin clasificar aún", condic: {publico_id: {[Op.is]: null}}, indiv: true},
			],
		},
		epocasEstreno: {titulo: "Época de Estreno", campoFiltro: "epocaEstreno_id"},
		epocasOcurrencia: {titulo: "Época de Ocurrencia", campoFiltro: "epocaOcurrencia_id"},
		tiposActuacion: {titulo: "Tipo de Actuación", campoFiltro: "tipoActuacion_id"},
		// Se muestran ocasionalmente
		bhr: {
			titulo: "Basado en Hechos Reales",
			campoFiltro: "bhr",
			opciones: [
				{id: "1", nombre: "Hechos Reales"},
				{id: "0", nombre: "Ficción"},
			],
		},
		apMar: {
			titulo: "Aparición Mariana",
			opciones: [
				{id: "SI", nombre: "Con Aparición Mariana", condic: {pers: {[Op.ne]: sinApMar_id}, hec: true}},
				{id: "NO", nombre: "Sin Aparición Mariana", condic: {pers: sinApMar_id, hec: false}}, // revisado
			], // se usa cuando la entidad es 'rclvs'
		},
		rolesIgl: {
			titulo: "Rol en la Iglesia",
			opciones: [
				{id: "L", nombre: "Laicos/as", condic: {[Op.startsWith]: "L"}},
				{id: "LC", nombre: "Laicos/as casados/as", condic: {[Op.startsWith]: "LC"}},
				{
					id: "RS",
					nombre: "Religiosos/as y Sacerdotes",
					condic: {[Op.or]: [{[Op.startsWith]: "RE"}, {[Op.startsWith]: "SC"}]},
				},
				{id: "PP", nombre: "Papas", condic: {[Op.startsWith]: "PP"}},
				{id: "AP", nombre: "Apóstoles", condic: {[Op.startsWith]: "AP"}},
				{id: "SF", nombre: "Sagrada Familia", condic: {[Op.startsWith]: "SF"}},
			],
		},
		canons: {
			titulo: "Proceso de Canonización",
			opciones: [
				{id: "SB", nombre: "Santos y Beatos", condic: {[Op.or]: [{[Op.startsWith]: "ST"}, {[Op.startsWith]: "BT"}]}},
				{
					id: "VS",
					nombre: "Vener. y Siervos de Dios",
					condic: {[Op.or]: [{[Op.startsWith]: "VN"}, {[Op.startsWith]: "SD"}]},
				},
				{id: "TD", nombre: "Santos a Siervos de Dios", condic: {[Op.notLike]: "NN%"}},
				{id: "NN", nombre: "Sin proceso de canonizac.", condic: {[Op.startsWith]: "NN"}},
			],
		},
		temas: {titulo: "Tema", campoFiltro: "tema_id"},
		miscelaneas: {
			titulo: "Miscelaneas",
			opciones: [
				{id: "CL", nombre: "Es a color", condic: {color: 1}},
				{id: "BN", nombre: "Es en blanco y negro", condic: {color: 0}},
				{id: "MS", nombre: "Es un musical", condic: {musical: 1}},
				{id: "DP", nombre: "Tiene deporte", condic: {deporte: 1}},
				{id: "VS", nombre: "Sin crueldad sensible", condic: {crueldad: 0}},
			],
		},
	},

	// Productos
	camposDD: [...camposDD],
	camposDA: [...camposDA],
	camposDaConVals: async (usuario_id) => {
		// Variables
		const regsRclv = await obtieneRegsRclv(usuario_id);
		const mensajes = mensajesProds;
		const resultado = [...camposDA];

		// Agregado de valores
		const campos = [
			{nombre: "religion_id", valores: religiones},
			{nombre: "tipoActuacion_id", valores: tiposActuacion},
			{nombre: "publico_id", valores: publicos, mensajes: mensajes.publico},
			{nombre: "epocaOcurrencia_id", valores: epocasOcurrencia, mensajes: mensajes.epocaOcurrencia},
			{nombre: "personaje_id", valores: regsRclv.personajes, mensajes: mensajes.personaje, link: "personajes"},
			{nombre: "hecho_id", valores: regsRclv.hechos, mensajes: mensajes.hecho, link: "hechos"},
			{nombre: "tema_id", valores: regsRclv.temas, mensajes: mensajes.tema, link: "temas"},
			{nombre: "evento_id", valores: regsRclv.eventos, mensajes: mensajes.evento, link: "eventos"},
			{nombre: "epocaDelAno_id", valores: regsRclv.epocasDelAno, mensajes: mensajes.epocaDelAno, link: "epocasDelAno"},
		];
		for (let campo of campos) {
			const indice = resultado.findIndex((n) => n.nombre == campo.nombre);
			resultado[indice] = {...resultado[indice], ...campo};
		}

		// Fin
		return resultado;
	},
	camposTransfCaps: {
		// se transfieren siempre
		siempre: [
			...["tipoActuacion_id", "religion_id", "bhr", "publico_id"],
			...["color", "musical", "deporte", "crueldad", "capEnCons"],
		],
		// se transfieren según el caso
		depende: [
			...["paises_id", "idiomaOriginal_id", "direccion", "guion", "musica", "produccion", "epocaOcurrencia_id"],
			...rclvCampos_id,
		],
		actores: "actores",
	},

	// Entorno Revisiones
	camposRevisar: {
		productos: [
			...camposDD,
			{titulo: "Avatar_url", nombre: "avatarUrl"}, // es necesario para 'agregar-prod'
			...camposDA.map((n) => ({...n, productos: true})),
		],
		rclvs: [
			// Todos
			{titulo: "Nombre", nombre: "nombre", rclvs: true},
			{titulo: "Día del Año", nombre: "fechaDelAno_id", rclvs: true, relacInclude: "fechaDelAno", tabla: "fechasDelAno"},
			{titulo: "Fecha Móvil", nombre: "fechaMovil", rclvs: true, siNo: true},
			{titulo: "Año Fecha Móvil", nombre: "anoFM", rclvs: true},
			{titulo: "Comentario Móvil", nombre: "comentarioMovil", rclvs: true},
			{titulo: "Prioridad", nombre: "prioridad_id", rclvs: true},
			{titulo: "Avatar", nombre: "avatar", rclvs: true},

			// Personajes y Hechos
			{
				titulo: "Época",
				nombre: "epocaOcurrencia_id",
				personajes: true,
				hechos: true,
				relacInclude: "epocaOcurrencia",
				tabla: "epocasOcurrencia",
			},
			{titulo: "Alternativo", nombre: "nombreAltern", personajes: true, hechos: true},
			{titulo: "Nombre en la frase", nombre: "leyNombre", personajes: true, hechos: true},

			// Personajes
			{titulo: "Sexo", nombre: "genero_id", personajes: true, relacInclude: "genero", tabla: "generos"},
			{titulo: "Año de Nacim.", nombre: "anoNacim", personajes: true},
			{titulo: "Categoría", nombre: "religion_id", personajes: true, relacInclude: "religion", tabla: "religiones"},
			{
				titulo: "Rol en la Iglesia",
				nombre: "rolIglesia_id",
				personajes: true,
				relacInclude: "rolIglesia",
				tabla: "rolesIglesia",
			},
			{titulo: "Proceso de Canonizac.", nombre: "canon_id", personajes: true, relacInclude: "canon", tabla: "canons"},
			{titulo: "Aparición Mariana", nombre: "apMar_id", personajes: true, relacInclude: "apMar", tabla: "hechos"},

			// Hechos y Eventos
			{
				titulo: "Hoy estamos",
				nombre: "hoyEstamos_id",
				hechos: true,
				eventos: true,
				relacInclude: "hoyEstamos",
				tabla: "hoyEstamos",
			},

			// Hechos
			{titulo: "Año de Comienzo", nombre: "anoComienzo", hechos: true},
			{titulo: "Hecho de la Iglesia", nombre: "soloCfc", hechos: true, siNo: true},
			{titulo: "Es una aparición mariana", nombre: "ama", hechos: true, siNo: true},

			// Epocas del año
			{titulo: "Días de Duración", nombre: "diasDeDuracion", epocasDelAno: true},
			{titulo: "Comentario Duración", nombre: "comentarioDuracion", epocasDelAno: true},
			{titulo: "Carpeta de Imágenes", nombre: "carpetaAvatars", epocasDelAno: true},

			// Todas salvo personajes
			{
				titulo: "Genero",
				nombre: "genero_id",
				hechos: true,
				temas: true,
				eventos: true,
				epocasDelAno: true,
				relacInclude: "genero",
				tabla: "generos",
			},
		],
		links: [
			{titulo: "Calidad", nombre: "calidad"},
			{titulo: "En castellano", nombre: "castellano", siNo: true},
			{titulo: "Subtítulos", nombre: "subtitulos", siNo: true},
			{titulo: "Gratuito", nombre: "gratuito", siNo: true},
			{titulo: "Tipo", nombre: "tipo_id", relacInclude: "tipo"},
			{titulo: "Completo", nombre: "completo"},
			{titulo: "Parte", nombre: "parte"},
		],
	},
	avatarsExternosPelis: (nombre) => [
		{codigo: "IMDB", href: "//imdb.com/find?q=" + nombre},
		{codigo: "FA", href: "//filmaffinity.com/es/search.php?stext=" + nombre},
		{codigo: "Wiki", href: "//es.wikipedia.org/wiki/" + nombre},
		{codigo: "Google", href: "//google.com/search?q=" + nombre + "&tbm=isch&tbs=isz:l&hl=es-419"},
		{codigo: "TMDB", href: "//themoviedb.org/search?query=" + nombre},
	],

	// Links a vistas
	vistaTablero: {
		clase: "fa-spell-check",
		link: "/revision/tablero",
		titulo: "Ir al 'Tablero de Control' de Entidades",
		autofocus: true,
	},
	vistaInactivar: {
		revision: (entidad, id) => ({
			clase: "fa-spell-check",
			link: "/" + entidad + "/inactivar-captura/?id=" + id + "&origen=TE",
			titulo: "Ir al 'Tablero de Control' de Entidades",
			autofocus: true,
		}),
		prodRclv: (entidad, id, siglaFam) => ({
			clase: iconos.detalle,
			link: "/" + entidad + "/detalle/" + siglaFam + "/?id=" + id,
			titulo: "Ir a la vista Detalle",
			autofocus: true,
		}),
	},
};

// Funciones
const obtieneRegsRclv = async (usuario_id) => {
	const condicion = {
		[Op.or]: {
			statusRegistro_id: aprobado_id,
			[Op.and]: {statusRegistro_id: creado_id, creadoPor_id: usuario_id},
		},
	};
	let valores = [];
	let regsRclv = {};

	// Obtiene los regsRclv
	for (let rclvEnt of rclvs) valores.push(baseDatos.obtieneTodosPorCondicion(rclvEnt, condicion, "statusRegistro"));
	valores = await Promise.all(valores);

	// Pule la información
	rclvs.forEach((rclvEnt, i) => {
		// Ordena los registros por nombre
		valores[i].sort((a, b) => (a.nombre.toLowerCase() < b.nombre.toLowerCase() ? -1 : 1));
		// Fin
		regsRclv[rclvEnt] = valores[i];
	});

	// Fin
	return regsRclv;
};
