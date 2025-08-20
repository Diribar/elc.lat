"use strict";

module.exports = async (req, res, next) => {
	// Variables
	const {baseUrl, entidad} = comp.partesDelUrl(req);
	const {id} = req.query;
	const usuario_id = req.session.usuario.id;
	const registro = await baseDatos.obtienePorId(entidad, id);
	const haceUnaHora = comp.fechaHora.nuevoHorario(-1);

	// Si está recién creado y se lo quiere usar en una vista distinta a 'revisión', no se captura
	if (registro.statusRegistro_id == creado_id && registro.creadoEn >= haceUnaHora && baseUrl != "/revision") return next(); // en status "creado" está reservado para el creador durante 1 hora, sin captura

	// Averigua si el usuario ya lo tiene capturado
	const condicion = {entidad, entidad_id: id, capturadoPor_id: usuario_id}; // está capturado por el usuario desde hace menos de 2 horas
	const captura = await baseDatos.obtienePorCondicion("capturas", condicion).then((n) => FN(n));

	// Acciones si existe una captura
	const activa = true;
	if (captura) baseDatos.actualizaPorId("capturas", captura.id, {activa});
	// Acciones si no existe
	else {
		const familia = comp.obtieneDesdeEntidad.familia(entidad);
		baseDatos.agregaRegistro("capturas", {...condicion, familia});
	}

	// Fin
	return next();
};

const FN = (registro) => {
	// Si el registro está vacío, interrumpe la función
	if (!registro) return;

	// Acciones si el registro es anterior a 'haceDosHoras'
	const haceDosHoras = comp.fechaHora.nuevoHorario(-2);
	if (registro.capturadoEn < haceDosHoras) {
		baseDatos.eliminaPorId("capturas", registro.id);
		return;
	}

	// Fin
	return registro;
};
