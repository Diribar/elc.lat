"use strict";
// Variables
const procesos = require("./CN-Procesos");

module.exports = {
	consultas: async (req, res) => {
		// Variables
		const tema = "consultas";
		const codigo = null;
		const titulo = "Inicio";
		const {usuario} = req.session;
		const usuario_id = usuario && usuario.id;

		// Configuraciones de consulta
		let configsConsCabs = procesos.varios.cabeceras(usuario_id); // Se necesita esa función también para la API
		let filtros = procesos.varios.filtros();
		[configsConsCabs, filtros] = await Promise.all([configsConsCabs, filtros]);
		const configsCons = {
			cabeceras: {
				propios: configsConsCabs.filter((n) => usuario_id && n.usuario_id == usuario_id),
				predeterms: configsConsCabs.filter((n) => n.usuario_id == 1), // el usuario con 'id' uno
			},
			filtros,
		};

		// Variables para la vista
		const cuadroCss = (id) => "<span id='" + id + "'></span> ➝ ";
		const msjsFondo = {
			parrafo: "Significado del color de fondo de los resultados",
			dots: religiones.map((religion) => cuadroCss(religion.id) + religion.nombre),
		};
		const msjsLayout = procesos.varios.msjsLayout(usuario_id);
		const msjsPublRecom = procesos.varios.msjsPublRecom();
		const ayudas = [msjsFondo, msjsLayout];

		// Va a la vista
		return res.render("CMP-0Estructura", {
			...{tema, codigo, titulo, usuario_id},
			...{configsCons, ayudas, msjsPublRecom, religiones},
			omitirFooter: true,
		});
	},
	redirecciona: (req, res) => res.redirect("/"),
};
