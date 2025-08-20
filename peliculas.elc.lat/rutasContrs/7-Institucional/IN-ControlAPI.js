"use strict";
// Variables
const valida = require("./IN-FN-Validar");

// *********** Controlador ***********
module.exports = {
	contactanos: {
		valida: async (req, res) => {
			// Averigua los errores solamente para esos campos
			const errores = await valida.contactanos(req.query);

			// Devuelve el resultado
			return res.json(errores);
		},
		enviaMail: async (req, res) => {
			// Variables
			const datosForm = req.query;
			const nombre = "ELC Películas - Contactanos";

			// Si hubo errores, interrumpe la función
			const errores = await valida.contactanos(datosForm);
			req.session.contactanos = datosForm; // actualiza el contenido del formulario en 'session'
			if (errores.hay) return res.json(false);

			// Variables
			const {asunto, prodElegido, comentario} = datosForm;
			const {usuario} = req.session;
			const asuntoMail = asuntosContactanos.find((n) => n.codigo == asunto).descripcion;

			// Cuerpo del mail - producto
			let producto = "";
			if (asunto == "producto" && prodElegido.includes("-")) {
				const [entidad, id] = prodElegido.split("-");
				const siglaFam = comp.obtieneDesdeEntidad.siglaFam(entidad);
				const ent = entidad.slice(0, 3).toUpperCase();
				const prodNombre = await baseDatos
					.obtienePorId(entidad, id)
					.then((n) => n.nombreCastellano || n.nombreOriginal);
				producto +=
					"<a " +
					("href='" + urlHost + "/" + entidad + "/detalle/" + siglaFam + "/") +
					("?id=" + id) +
					// "' style='color: inherit; text-decoration: none'" +
					(">" + prodNombre + " - " + ent + "</a>: ");
			}

			// Cuerpo del mail - firma
			let firma = "<br><br><br>";
			if (usuario) {
				firma += usuario.nombre ? usuario.nombre + " " + usuario.apellido : usuario.apodo;
				firma += "<br>" + usuario.email;
			} else firma += "La persona no estaba logueada, cliente_id " + req.session.cliente.cliente_id;

			// Envía el mail a ELC
			const datosMail = {
				nombre,
				email: credenciales.mail.ateUsuario,
				asunto: asuntoMail,
				comentario: producto + comentario + firma,
			};
			const mailEnviado = await comp.enviaMail(datosMail);

			// Si el envío fue exitoso y la persona está logueada, le envía un email de confirmación
			if (mailEnviado && usuario) {
				const datosMail = {
					nombre,
					email: usuario.email,
					asunto: "Mail enviado a ELC - Películas",
					comentario:
						"Hemos enviado tu e-mail al equipo de ELC, con el asunto <em>" +
						asuntoMail +
						"</em>, y el siguiente comentario:<br><br><em>" +
						producto +
						comentario +
						"</em>",
				};
				comp.enviaMail(datosMail);
			}

			// Devuelve la info
			return res.json(mailEnviado);
		},
	},
};
