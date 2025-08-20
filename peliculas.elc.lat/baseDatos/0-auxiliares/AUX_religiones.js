module.exports = (sequelize, dt) => {
	const alias = "religiones";
	const columns = {
		orden: {type: dt.INTEGER},
		nombre: {type: dt.STRING(50)},
		breve: {type: dt.STRING(15)},
	};
	const config = {
		tableName: "aux_religiones",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
