"use strict";
// Variables
const procsFM = require("../2.0-Familias/FM-FN-Procesos");
const procsProd = require("../2.1-Prods-RUD/PR-FN-Procesos");
const procesos = require("./LK-FN-Procesos");

module.exports = {
	abm: async (req, res) => {
		// Variables
		const tema = "linksCrud";
		const codigo = "abmLinks";
		const entidad = comp.obtieneEntidadDesdeUrl(req);
		const {id, grupo} = req.query;
		const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);
		const usuario_id = req.session.usuario.id; // necesariamente está logueado
		const origen = req.query.origen || "DT"; // puede venir de revisión de links

		// Obtiene la versión más completa posible del producto
		let [original, edicion] = await procsFM.obtieneOriginalEdicion({entidad, entId: id, usuario_id});
		original = await procsProd.obtieneColCaps.consolidado(original, entidad, usuario_id);
		const prodComb = {...original, ...edicion, id: original.id};

		// Obtiene información de BD
		const links = await procesos.obtieneLinksConEdicion(entidad, id, usuario_id);
		links.sort((a, b) => a.tipo_id - b.tipo_id); // primero los links de trailer, luego la película
		for (let link of links) {
			if (!link.prov.embededAgregar || !link.gratuito) link.href = "//" + link.url; // prepara el url para usarse en la web
			link.cond = procesos.condicion(link, usuario_id, tema);
			link.idioma = link.castellano ? "enCast" : link.subtitulos ? "subtCast" : "otroIdioma";
		}

		// Actualiza linksEnProd
		comp.linksEnProd({entidad, id});

		// Configura el título de la vista
		const nombre = prodComb.nombreCastellano || prodComb.nombreOriginal;
		const titulo = "Links - " + nombre;
		const delLa = comp.obtieneDesdeEntidad.delLa(entidad);
		const tituloVista = "ABM Links" + delLa + entidadNombre;

		// Obtiene datos para la vista
		const motivos = statusMotivos.filter((n) => n.links).map((n) => ({id: n.id, descripcion: n.descripcion}));
		const status_id = original.statusRegistro_id;
		const imgDerPers = procsFM.obtieneAvatar(original, edicion).edic; // Obtiene el avatar
		const sigProd = grupo == "inactivo" ? await procesos.sigProdInactivo({producto: prodComb, entidad, usuario_id}) : null;
		const ayudasTitulo = [
			"Sé muy cuidadoso de incluir links que respeten los derechos de autor",
			"Al terminar, conviene que vayas a la de 'Detalle' para liberar el producto",
			"Si hay datos en rojo, es porque están editados por otro usuario",
		];
		const interesDelUsuario = await procsProd.obtieneInteresDelUsuario({usuario_id, entidad, entidad_id: id});

		// Va a la vista
		// return res.send(prodComb);
		return res.render("CMP-0Estructura", {
			...{tema, codigo, titulo, tituloVista, ayudasTitulo},
			...{entidad, familia: "producto", id, origen},
			...{registro: prodComb, links, status_id, interesDelUsuario},
			...{linksProvs, linksTipos, calidadesDeLink, motivos},
			...{usuario_id, imgDerPers, cartelGenerico: true, sigProd, grupo},
			...{vista: req.baseUrl + req.path, redirige: true},
		});
	},
	mirarLink: async (req, res) => {
		// Variables
		const tema = "linksCrud";
		const codigo = "mirarLink";
		const {id} = req.query;
		const {usuario} = req.session;
		const usuario_id = usuario ? usuario.id : "";
		const origen = "DT";

		// Obtiene el link y su proveedor
		const link = await baseDatos.obtienePorId("links", id, "prov");
		const provEmbeded = provsEmbeded.find((n) => n.id == link.prov_id);
		link.url = "//" + link.url.replace(provEmbeded.embededQuitar, provEmbeded.embededAgregar);

		// Obtiene el producto 'Original' y 'Editado'
		const entidad = comp.obtieneDesdeCampo_id.prodEnt(link);
		const prodId = link[comp.obtieneDesdeCampo_id.prodCampo_id(link)];
		const params = {entidad, entId: prodId, usuario_id, excluirInclude: true};
		const [original, edicion] = await procsFM.obtieneOriginalEdicion(params);
		const prodComb = {...original, ...edicion, id: prodId}; // obtiene la versión más completa posible del producto
		const imgDerPers = procsFM.obtieneAvatar(original, edicion).edic;

		// Configura el título de la vista
		const nombre = prodComb.nombreCastellano ? prodComb.nombreCastellano : prodComb.nombreOriginal;
		const tituloVista = nombre;
		const titulo = nombre;

		// Va a la vista
		return res.render("CMP-0Estructura", {
			...{tema, codigo, tituloVista, titulo, origen},
			...{entidad, id: prodId, familia: "producto", registro: prodComb, link},
			...{imgDerPers, tituloImgDerPers: prodComb.nombreCastellano},
			iconosMobile: true,
		});
	},
};
