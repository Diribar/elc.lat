"use strict";

module.exports = {
	lecturasDeBd: async () => {
		// Obtiene las lecturas de BD
		const lecturas = {
			// Variables de productos
			idiomas: baseDatos.obtieneTodosConOrden("idiomas", "nombre"),
			paises: baseDatos
				.obtieneTodos("paises", "cantProds") // 'cantProds' es un 'include'
				.then((n) => n.sort((a, b) => (a.nombre < b.nombre ? -1 : 1))),
			publicos: baseDatos.obtieneTodosConOrden("publicos", "orden"),
			religiones: baseDatos.obtieneTodosConOrden("religiones", "orden"),
			tiposActuacion: baseDatos.obtieneTodosConOrden("tiposActuacion", "orden"),
			epocasEstreno: baseDatos.obtieneTodosConOrden("epocasEstreno", "hasta", "DESC"),

			// Calificación de productos
			calCriterios: baseDatos.obtieneTodos("calCriterios"),
			feValores: baseDatos.obtieneTodosConOrden("feValores", "orden"),
			entretiene: baseDatos.obtieneTodosConOrden("entretiene", "orden"),
			calidadTecnica: baseDatos.obtieneTodosConOrden("calidadTecnica", "orden"),

			// Variables de rclvs
			epocasOcurrencia: baseDatos.obtieneTodosConOrden("epocasOcurrencia", "orden"),
			rolesIglesia: baseDatos.obtieneTodosConOrden("rolesIglesia", "orden"),
			canons: baseDatos.obtieneTodosConOrden("canons", "orden"),

			// Variables de links
			linksProvs: baseDatos
				.obtieneTodos("linksProvs", "cantLinks")
				.then((n) => n.sort((a, b) => b.cantLinks.cantidad - a.cantLinks.cantidad)),
			linksTipos: baseDatos.obtieneTodos("linksTipos"),

			// Consultas
			cnEntidades: baseDatos.obtieneTodos("cnEntidades"),
			cnLayouts: baseDatos
				.obtieneTodos("cnLayouts")
				.then((n) => n.filter((m) => m.activo))
				.then((n) => n.sort((a, b) => a.orden - b.orden)),
			cnRegsCabecera: baseDatos.obtieneTodos("consRegsCabecera"),
			pppOpcsArray: baseDatos.obtieneTodos("pppOpciones"),

			// Menús
			menuCapacitac: baseDatos.obtieneTodosConOrden("menuCapacitac", "orden").then((n) => n.filter((m) => m.actualizado)),

			// Otros
			novsPeliculas: baseDatos.obtieneTodosConOrden("novsPeliculas", "fecha"),
		};

		// Await
		const valores = await Promise.all(Object.values(lecturas));
		Object.keys(lecturas).forEach((campo, i) => (lecturas[campo] = valores[i]));

		// Fin
		return lecturas;
	},
	datosPartics: () => {
		// Variables
		const respuesta = {
			// 2. Tipos de actuación
			anime_id: tiposActuacion.find((n) => n.codigo == "anime").id,
			documental_id: tiposActuacion.find((n) => n.codigo == "documental").id,
			actuada_id: tiposActuacion.find((n) => n.codigo == "actuada").id,

			// 4. Públicos
			mayores_ids: publicos.filter((n) => n.mayores).map((n) => n.id),
			familia_ids: publicos.filter((n) => n.familia).map((n) => n.id),
			menores_ids: publicos.filter((n) => n.menores).map((n) => n.id),

			// Otros - Productos
			atributosCalific: {feValores, entretiene, calidadTecnica},
			pppOpcsSimples: pppOpcsArray.filter((n) => !n.combo),
			hablaHispana: paises.filter((n) => n.idioma_id == "ES"),
			hablaNoHispana: paises.filter((n) => n.idioma_id != "ES"),
			cnLayouts_ids: cnLayouts.map((n) => n.id),

			// Links
			linkPelicula_id: linksTipos.find((n) => n.pelicula).id,
			linkTrailer_id: linksTipos.find((n) => n.trailer).id,
			provsEmbeded: linksProvs.filter((n) => n.embededAgregar),
			provsValidacAutom_ids: linksProvs.filter((n) => n.validacAutom).map((n) => n.id),

			// Otros
			cnCabeceraDefault: cnRegsCabecera.find((n) => n.id == 3), // Santos a Siervos de Dios
			epocaVarias: epocasOcurrencia.find((n) => n.id == "var"),
			epocasSinVarias: epocasOcurrencia.filter((n) => n.id != "var"),
			motivoInfoErronea: edicsMotivos.find((n) => n.codigo == "infoErronea"),
			motivoVersionActual: edicsMotivos.find((n) => n.codigo == "versionActual"),
			motivoDupl_id: statusMotivos.find((n) => n.codigo == "duplicado").id,
		};

		// Preferencias por producto
		respuesta.pppOpcsObj = {};
		for (let pppOcion of pppOpcsArray)
			respuesta.pppOpcsObj[pppOcion.codigo] = pppOpcsArray.find((n) => n.codigo == pppOcion.codigo);

		// Fin
		return respuesta;
	},
};
