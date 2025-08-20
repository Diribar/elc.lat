module.exports = (sequelize, dt) => {
	const alias = "cnLayouts";
	const columns = {
		orden: {type: dt.INTEGER},
		nombre: {type: dt.STRING(40)},
		codigo: {type: dt.STRING(20)},
		grupoSelect: {type: dt.STRING(20)},
		loginNeces: {type: dt.BOOLEAN},
		entDefault_id: {type: dt.INTEGER},
		cantidad: {type: dt.INTEGER},
		ascDes: {type: dt.STRING(6)},
		activo: {type: dt.BOOLEAN},
		ayuda: {type: dt.STRING(90)},
	};
	const config = {
		tableName: "cn_layouts",
		timestamps: false,
	};
	const entidad = sequelize.define(alias, columns, config);
	return entidad;
};
