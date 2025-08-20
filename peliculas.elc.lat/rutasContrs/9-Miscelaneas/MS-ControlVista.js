"use strict";
// Variables
const procsRE = require("../3-Rev-Entidades/RE-Procesos");
const procesos = require("./MS-Procesos");

module.exports = {
	// Vistas
	mantenim: async (req, res) => {
		// Variables
		const tema = "mantenimiento";
		const codigo = "tableroControl";
		const usuario_id = req.session.usuario.id;
		const omnipotente = req.session.usuario.rolUsuario_id == rolOmnipotente_id;

		// Productos
		let prods = procesos.mantenim.obtieneProds(usuario_id).then((n) => procsRE.tablRev.procesaProds(n));
		let rclvs = procesos.mantenim.obtieneRclvs(usuario_id).then((n) => procsRE.tablRev.procesaRclvs(n));
		let prodsConLinksInactivos = procesos.mantenim
			.obtieneLinksInactivos(usuario_id)
			.then((n) => procsRE.tablRev.procesaProds(n));

		// Rclvs
		[prods, rclvs, prodsConLinksInactivos] = await Promise.all([prods, rclvs, prodsConLinksInactivos]);

		// Une Productos y Links
		prods = {...prods, ...prodsConLinksInactivos};

		// Obtiene información para la vista
		const dataEntry = req.session.tableros && req.session.tableros.mantenimiento || {};

		// Va a la vista
		return res.render("CMP-0Estructura", {
			...{tema, codigo, titulo: "Tablero de Mantenimiento", origen: "MT"},
			...{prods, rclvs, omnipotente},
			dataEntry,
		});
	},
	navegsDia: async (req, res) => {
		// Variables
		const tema = "infoDeGestion";
		const codigo = "navegsDia";
		const titulo = "Movimientos del día";
		let {fecha} = req.query;
		let fechas = [];
		let fechaMostrar, cantClientes;

		// Obtiene las navegsDia y las procesa
		let navegsDia = await baseDatos.obtieneTodosConOrden("navegsDia", "id", true);
		if (navegsDia.length) {
			// Tareas varias
			fechas = procesos.navegsDia.obtieneRangoFechas(navegsDia);
			[navegsDia, fecha] = procesos.navegsDia.filtraPorFecha(navegsDia, fecha, fechas);
			navegsDia = procesos.navegsDia.ordenaPorCliente(navegsDia);
			navegsDia = procesos.navegsDia.eliminaDuplicados(navegsDia);
			navegsDia = procesos.navegsDia.modificaDatos(navegsDia);

			// Descarta los registros que no tengan distintivo o iconoArray
			navegsDia = navegsDia.filter((n) => n.distintivo || n.iconosArray);

			// Agrega un registro resumen por usuario
			navegsDia = procesos.navegsDia.resumen(navegsDia);

			// fechaMostrar
			fechaMostrar = comp.fechaHora.anoMesDia(fecha);

			// Cantidad de clienes
			cantClientes = navegsDia.filter((n) => n.cantMovs).length;
		}

		// Fin
		return res.render("CMP-0Estructura", {tema, codigo, titulo, navegsDia, fechaMostrar, fechas, cantClientes});
	},

	// Listados
	listados: {
		session: (req, res) => res.send(req.session), // session
		cookies: (req, res) => res.send(req.cookies), // cookies
		links: async (req, res) => {
			// Variables
			const entidades = variables.entidades.prods;
			let productos = [];
			let Trailer, Gratis, ConCosto, cantLinks;

			// Busca las películas y filtra por las que tienen más de un link
			for (let entidad of entidades)
				productos.push(
					...(await baseDatos.obtieneTodos(entidad, "links").then((n) => n.filter((m) => m.links.length > 1)))
				);

			// Separa entre links Trailer, Gratis y ConCosto
			for (let producto of productos) {
				// Trailer
				cantLinks = producto.links.filter((n) => n.tipo_id == linkTrailer_id).length;
				if (!Trailer || Trailer.cantLinks < cantLinks) Trailer = {nombre: producto.nombreCastellano, cantLinks};

				// Gratis
				cantLinks = producto.links.filter((n) => n.tipo_id == linkPelicula_id && n.gratuito).length;
				if (!Gratis || Gratis.cantLinks < cantLinks) Gratis = {nombre: producto.nombreCastellano, cantLinks};

				// Gratis
				cantLinks = producto.links.filter((n) => n.tipo_id == linkPelicula_id && !n.gratuito).length;
				if (!ConCosto || ConCosto.cantLinks < cantLinks) ConCosto = {nombre: producto.nombreCastellano, cantLinks};
			}

			// Devuelve la info
			return res.send({Trailer, Gratis, ConCosto});
		},
	},

	// Redirecciona después de inactivar una captura
	redirecciona: {
		urlDeDestino: async (req, res) => {
			// Variables
			const entidad = comp.obtieneEntidadDesdeUrl(req);
			const {origen: codOrigen, urlOrigen, prodEnt, prodId, id} = req.query;
			let {urlDestino} = req.query;
			let destino;

			// Casos particulares
			if (urlDestino) return res.redirect(urlDestino);
			if (!codOrigen && !urlOrigen) return res.redirect("/");

			// Rutina para encontrar el destino en base al 'codOrigen'
			if (codOrigen) {
				const urls = procesos.redirecciona.urlsOrigenDestino(prodEnt || entidad);
				const url = urls.find((n) => codOrigen == n.codOrigen);
				if (url) {
					destino = url.destino;
					if (url.cola) destino += "/?id=" + (prodId || id);
				}
			}
			// Rutina para encontrar el destino en base al 'urlOrigen'
			else {
				urlDestino = entidad != prodEnt ? urlOrigen.replace(entidad, prodEnt) : urlOrigen;
				destino = urlDestino + "/?id=" + prodId;
			}

			// Redirecciona a la vista que corresponda
			if (!destino) destino = "/";
			return res.redirect(destino);
		},
		rutasAntiguas: function (req, res) {
			// Variables
			let {entidad} = req.query; // debe ser 'req.query', porque así son las antiguas
			if (!entidad) entidad = comp.obtieneEntidadDesdeUrl(req);
			const {originalUrl} = req;
			const ruta = procesos.redirecciona.obtieneRuta(entidad, originalUrl);

			// Si no se obtiene la nueva ruta => vista de dirección desconocida
			if (!ruta) {
				const informacion = {
					mensajes: ["No tenemos esa dirección en nuestro sistema (familia desconocida)"],
					iconos: [variables.vistaAnterior(req.session.urlAnterior), variables.vistaConsultas],
				};
				return res.render("CMP-0Estructura", {informacion});
			}

			// Obtiene datos a partir de la ruta
			const nuevoUrl = ruta.act;
			const colaAnt = originalUrl.replace(ruta.ant, "");

			// Obtiene la nueva 'cola'
			let nuevaCola = colaAnt.replace("?entidad=" + entidad, "");
			nuevaCola = nuevaCola.replace("/&", "/?");
			if (nuevaCola.includes("link_id=")) nuevaCola = nuevaCola.replace("link_id=", "id=");
			if (nuevaCola.endsWith("?")) nuevaCola = nuevaCola.slice(0, -1);
			if (nuevaCola.endsWith("/")) nuevaCola = nuevaCola.slice(0, -1);

			// Fin
			return res.redirect(nuevoUrl + nuevaCola);
		},
	},
};
