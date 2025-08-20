"use strict";
// Variables
const linksSems = 8;

module.exports = {
	// Institucional
	vistasInstitucs: {
		bienvenida: {titulo: "Bienvenida", codigo: "bienvenida", icono: iconos.hogar}, // 'hr' significa que pone una línea divisoria en el menú del header
		// "quienes-somos": {titulo: "Quiénes somos", codigo: "quienesSomos", icono: "fa-people-group"},
		// "mision-y-vision": {titulo: "Nuestra Misión y Visión", codigo: "misionVision", icono: "fa-heart"},
		"en-que-consiste-este-sitio": {
			titulo: "En qué consiste este sitio",
			codigo: "enQueConsiste",
			icono: "fa-question",
			hr: true,
		},
		"nuestro-perfil-de-peliculas": {titulo: "Nuestro Perfil de Películas", codigo: "perfilPelis", icono: "fa-cross"},
		// "peliculas-no-catolicas": {titulo: "Películas no Católicas", codigo: "pelisNoCatolicas", icono: "fa-person-praying"},
		"derechos-de-autor": {titulo: "Derechos de Autor", codigo: "derechosAutor", icono: "fa-copyright"},
	},
	menuUsuario: [
		{titulo: "Mi interés por películas", icono: "fa-heart", href: "/?layout_id=7"},
		{titulo: "Logout", icono: "fa-right-from-bracket", href: "/usuarios/logout"},
	],

	// Gráficos
	graficos: {
		// Clientes
		clientesBD: {
			rubro: "clientes",
			titulo: "Cant. de Clientes en BD",
			url: "cantidad-de-clientes",
			icono: iconos.area,
			resaltar: true,
		},

		// Navegaciones
		navegsDia: {
			rubro: "navegantes",
			titulo: "Navegantes por día",
			url: "navegantes-por-dia",
			icono: iconos.columnas,
			resaltar: true,
		},
		// navegsPorHora: {
		// 	rubro: "navegantes",
		// 	titulo: "Navegantes por hora",
		// 	url: "navegantes-por-hora",
		// 	icono: iconos.columnas,
		// 	select: true,
		// },
		// navegsPorProd: {
		// 	rubro: "navegantes",
		// 	titulo: "Navegantes por producto",
		// 	url: "navegantes-por-producto",
		// 	icono: iconos.columnas,
		// 	select: true,
		// },
		// navegsPorRuta: {
		// 	rubro: "navegantes",
		// 	titulo: "Navegantes por ruta",
		// 	url: "navegantes-por-ruta",
		// 	icono: iconos.columnas,
		// 	select: true,
		// },

		// Productos
		prodsCfcVpc: {
			rubro: "prods",
			titulo: "Películas - CFC / VPC",
			url: "peliculas-cfc-vpc",
			icono: iconos.chart,
		},
		prodsPorPublico: {
			rubro: "prods",
			titulo: "Películas - Público recomendado",
			url: "peliculas-por-publico",
			icono: iconos.chart,
		},
		prodsPorEpocaEstr: {
			rubro: "prods",
			titulo: "Películas - Época de estreno",
			url: "peliculas-por-epoca-de-estreno",
			icono: iconos.columnas,
		},

		// Rclvs
		rclvsRangosSinEfems: {
			rubro: "rclvs",
			titulo: "Rclvs - Rangos sin Efemérides",
			url: "rclvs-rangos-sin-efemerides",
			icono: iconos.columnas,
		},

		// Links
		linksVencim: {
			rubro: "links",
			titulo: "Links - Vencimiento Semanal",
			url: "vencimiento-de-links",
			icono: iconos.columnas,
			resaltar: true,
		},
		linksPorProv: {
			rubro: "links",
			titulo: "Links - Proveedores",
			url: "links-por-proveedor",
			icono: iconos.chart,
		},
	},

	// Productos
	dibujosAnimados: "Dibujos Animados",
	documental: "Documental",

	// Links
	linkSemInicial: 1,
	linksSems,
	linksVU_estandar: unaSemana * linksSems,
	...{sinLinks: 0, linksTalVez: 1, conLinks: 2},
	cantLinksVencPorSem: null,
	provsListaNegra: ["gloria.tv"],
	provsQueNoRespetanCopyright: [
		{nombre: "Cuevana", url: "cuevana"},
		{nombre: "Google Drive", url: "drive.google.com/"},
	],
	calidadesDeLink: [240, 360, 480, 720, 1080],

	// Mensajes
	rclvSinElegir: "Necesitamos que respondas alguna de las opciones",
	ayudaLinks: {
		parrafo: "<em>Color de los bordes (simil semáforo):</em>",
		mensajes: [
			"<i class='" + iconos.faSolid + " fa-circle enCast'></i> hablada en <b>castellano</b>",
			"<i class='" + iconos.faSolid + " fa-circle subtCast'></i> <b>subtitulos</b> en castellano",
			"<i class='" + iconos.faSolid + " fa-circle otroIdioma'></i> hablada en <b>otro</b> idioma",
			"<i class='" + iconos.faSolid + " fa-circle elegi'></i> <b>elegí</b> el idioma",
		],
	},
	beneficiosLogin: [
		"Poder influir en el contenido de nuestro sitio.",
		"Marcar tus preferencias por película y verlas en distintos dispositivos.",
		"Ver el listado de tus últimas películas consultadas.",
	],
	mensajesProds: {
		publico: [
			"Mayores solamente: escenas que pueden dañar la sensibilidad de un menor.",
			"Mayores (apto familia): de poco interés para un menor de 12-14 años.",
			"Familia: ideal para compartir en familia y que todos la disfruten.",
			"Menores (apto familia): de poco interés para un adulto.",
			"Menores solamente: apuntado a un público infantil.",
		],
		epocaOcurrencia: ["Varias: si el nudo de la trama ocurre en más de una época."],
		personaje: ["Si son varias las personas, podés poner la más representativa, o un nombre que las englobe a todas."],
		hecho: ["Si son varios los hechos, podés poner el más representativo, o uno genérico que los englobe a todos."],
		tema: ["Poné el más representativo."],
		evento: ["Poné el más representativo."],
		epocaDelAno: ["Poné la fecha en la que comienza."],
	},

	// Otras
	eliminarCuandoSinEntidadId: ["statusHistorial", "edicsHistorial", "misConsultas", "pppRegistros", "calRegistros", "capturas"],
	setTimeOutStd: 2000,
	imgInstitucional: "/imgsPropio/Varios/Institucional.jpg",
	statusErrores: [],
	asuntosContactanos: [
		{descripcion: "Comentario sobre nuestro sitio", codigo: "sitio"},
		{descripcion: "Comentario sobre una película", codigo: "producto"},
		{descripcion: "Otro motivo", codigo: "varios"},
	],

	// Carpetas
	carpProds: {
		final: path.join(carpImgsProp, "1-Productos", "Final"),
		revisar: path.join(carpImgsProp, "1-Productos", "Revisar"),
	},
	carpRclvs: {
		final: path.join(carpImgsComp, "2-Rclvs", "Final"),
		revisar: path.join(carpImgsComp, "2-Rclvs", "Revisar"),
	},
	rutaNombreMulter: path.join(carpArchComp, "middlewares/varios/multer.js"),
};
