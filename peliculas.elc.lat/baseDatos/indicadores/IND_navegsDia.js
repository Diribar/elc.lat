module.exports = (sequelize, dt) => {
	const alias = "navegsDia"; // navegaciones por rutas durante el día
	const columns = {
		fecha: {type: dt.DATE},
		cliente_id: {type: dt.STRING(11)},
		ruta: {type: dt.STRING(100)},
		comentario: {type: dt.STRING(20)},
		dispCliente: {type: dt.STRING(200)},
	};
	const config = {
		tableName: "ind_navegs_dia",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
