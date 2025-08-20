"use strict";

// Variables
const nombreDeEsteArch = path.basename(__filename); // el nombre de este archivo
const nombreDeEstaCarp = path.basename(__dirname);
const tablas = {};
const rutaComps = path.join(carpArchComp, nombreDeEstaCarp);

// Obtiene las carpetas
const obtieneCarps = (carpeta) => {
	const carpetas = fs.readdirSync(carpeta);
	for (let i = carpetas.length - 1; i >= 0; i--) if (carpetas[i].includes(".")) carpetas.splice(i, 1); // elimina los archivos
	carpetas.push("/");
	return carpetas.map((n) => path.join(carpeta, n));
};
const carpetas = [...obtieneCarps(__dirname), ...obtieneCarps(rutaComps)];

// Agrega cada tabla a 'tablas'
for (const carpeta of carpetas) {
	fs.readdirSync(carpeta)
		.filter(
			(archivo) =>
				archivo !== nombreDeEsteArch && // archivo distinto a éste
				archivo.indexOf(".") > 0 && // tiene '.' en el nombre y no está en el primer caracter
				archivo.slice(-3) === ".js" // con terminación '.js'
		)
		.map((archivo) => {
			const tabla = require(path.join(carpeta, archivo))(sequelize, Sequelize.DataTypes);
			tablas[tabla.name] = tabla;
		});
}

// Agrega las asociaciones
for (let tabla in tablas) if (tablas[tabla].associate) tablas[tabla].associate(tablas);

// Agrega las funciones
tablas.Sequelize = Sequelize;
tablas.sequelize = sequelize;

// Fin
module.exports = tablas;
