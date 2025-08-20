module.exports = (sequelize, dt) => {
	const alias = "novsPeliculas";
	const columns = {
		comentario: {type: dt.STRING(100)},
		fecha: {type: dt.DATE},
		version: {type: dt.STRING(4)},

		permInputs: {type: dt.BOOLEAN},
		autTablEnts:{type: dt.BOOLEAN},
		revisorPERL: {type: dt.BOOLEAN},
		revisorLinks: {type: dt.BOOLEAN},
		revisorEnts: {type: dt.BOOLEAN},
		revisorUs: {type: dt.BOOLEAN},
	};
	const config = {
		tableName: "aux_novs_peliculas",
		timestamps: false,
	};

	const entidad = sequelize.define(alias, columns, config);

	return entidad;
};
