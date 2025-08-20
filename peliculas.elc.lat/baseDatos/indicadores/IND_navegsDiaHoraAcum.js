module.exports = (sequelize, dt) => {
	const alias = "navegsDiaHoraAcum"; // cantidad de navegantes por hora de día de la semana
	const columns = {
		fecha: {type: dt.DATE},
		diaSem: {type: dt.STRING(3)},
		hora: {type: dt.INTEGER},
		cant: {type: dt.INTEGER},
	};
	const config = {
		tableName: "ind_navegs_dia_hora_acum",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
