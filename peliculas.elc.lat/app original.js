"use strict";

// Start-up - última carpeta git subida: 2.95
console.clear();
global.horarioStartUp = Date.now();

// Requires
global.path = require("path");
global.fs = require("fs");
global.express = require("express");
const app = express();

// Aplicaciones express
app.use(express.urlencoded({extended: false})); // Para usar el método post y req.body
app.use(express.json()); // ¿Para usar JSON con la lectura y guardado de archivos?

// Para usar cookies
const cookies = require("cookie-parser");
app.use(cookies());

// Variables que toman valores de 'path'
const entProducc = global.path.basename(__dirname) == "1-Actual";
global.entPrueba = global.path.basename(__dirname) == "2-Prueba";
global.entDesarr = !entProducc && !entPrueba;

// Variables que dependen del entorno
const subCarp = !entDesarr ? "1-Actual" : "";
const entornoBd = !entDesarr ? "produccion" : "desarrollo";
global.urlHost = entProducc
	? "https://peliculas.elc.lat"
	: entPrueba
	? "https://peliculas2.elc.lat"
	: "https://peliculas.elc:3001";

// Listener
const puerto = entProducc ? 4210 : entPrueba ? 4207 : 3001;
if (entDesarr) {
	const https = require("https");
	const opciones = {cert: fs.readFileSync("./variables/https-cert.pem"), key: fs.readFileSync("./variables/https-clave.pem")};
	https.createServer(opciones, app).listen(puerto, () => console.log("\nELC Películas - Servidor funcionando...")); // Para conectarse con el servidor
} else app.listen(puerto, () => console.log("\nELC Películas - Servidor funcionando...")); // Para conectarse con el servidor

// Carpetas a usar en toda la aplicación
const carpElc = path.join(__dirname, "../.."); // otros dominios
global.carpImgsProp = path.join(carpElc, "1-Peliculas", "Imagenes"); // este dominio
global.carpImgsComp = path.join(carpElc, "9-CompImgs"); // otros dominios
global.carpArchComp = path.join(carpElc, "9-CompArchs", subCarp); // otros dominios

// Crea carpetas públicas - propias
app.use("/publico", express.static(path.join(__dirname, "publico")));
app.use("/imgsPropio", express.static(carpImgsProp));
app.use("/formsPropio", express.static(path.join(__dirname, "publico/formatos")));
app.use("/jsPropio", express.static(path.join(__dirname, "publico/javascript")));

// Crea carpetas públicas - compartidas
app.use("/imgsComp", express.static(carpImgsComp));
app.use("/formsComp", express.static(path.join(carpArchComp, "publico/formatos")));
app.use("/jsComp", express.static(path.join(carpArchComp, "publico/javascript")));

// Variables globales
const constComps = require(path.join(carpArchComp, "variables/Constantes")); // primero van éstas, que son compartidas
for (let metodo in constComps) global[metodo] = constComps[metodo];
const constProps = require("./variables/Constantes"); // luego van estas, que son de uso particular en esta aplicación
for (let metodo in constProps) global[metodo] = constProps[metodo];
if (!entDesarr) global.dominio = {domain: "elc.lat"};

// Base de datos
global.Sequelize = require("sequelize");
global.credenciales = require(path.join(carpArchComp, "variables/Credenciales"));
const credencsBD = credenciales.bd[entornoBd];
const {database, username, password} = credencsBD;
global.bdNombre = credencsBD.database;
global.sequelize = new Sequelize(database, username, password, credencsBD);
global.bd = require("./baseDatos"); // tiene que ir después de 'fs', porque el archivo 'index' usa 'fs'
global.Op = bd.Sequelize.Op;

// Para usar la propiedad "session"
const mysql = require("mysql2");
const connection = mysql.createConnection(credenciales.session[entornoBd]);
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const sessionStore = new MySQLStore(
	{
		expiration: unDia / 1000,
		clearExpired: true,
		checkExpirationInterval: unaHora / 1000,
		useUnixTimestamp: true, // importante para segundos
	},
	connection
); // la sesión se borra automáticamente un día después de la última novedad del usuario
app.use(
	session({
		key: "session_id", // nombre de cookie
		secret: "elc-peliculas", // ídem original
		resave: false, // ídem original - no reescribe la sesión en la base de datos si no hubo cambios en los datos de sesión
		saveUninitialized: false, // ídem original
		store: sessionStore, // nuevo
		rolling: true, // reinicia la vida útil con cada novedad en la session
		cookie: {maxAge: unDia}, // la sesión expira automáticamente un día después de la última novedad del usuario
	})
);
// Procesos que requieren de 'async' y 'await'
(async () => {
	// Variables que dependen de las lecturas de BD
	global.baseDatos = require(path.join(carpArchComp, "funciones/BaseDatos"));
	const varsBdComp = require(path.join(carpArchComp, "variables/BaseDatos"));
	const varsBdPartic = require("./variables/BaseDatos");
	const lecturasDeBd = {...(await varsBdComp.lecturasDeBd()), ...(await varsBdPartic.lecturasDeBd())};
	for (let campo in lecturasDeBd) global[campo] = lecturasDeBd[campo]; // asigna una variable a cada lectura
	const datosPartics = {...varsBdComp.datosPartics(), ...varsBdPartic.datosPartics()};
	for (let campo in datosPartics) global[campo] = datosPartics[campo]; // asigna una variable a valores específicos
	global.version = novsPeliculas.at(-1).version;
	global.campoVersion = "versPeliculas";

	// Variables que requieren 'require'
	global.variables = {...require(path.join(carpArchComp, "variables/Depends")), ...require("./variables/Depends")};
	global.familiaRutas = variables.familiaRutas();
	global.comp = {...require(path.join(carpArchComp, "./funciones/Compartidas")), ...require("./funciones/Compartidas")}; // tiene que ir antes que las BD
	global.carpRutsComp = path.join(carpArchComp, "rutinas");
	global.RT_comp = require(path.join(carpRutsComp, "RT-Comp"));
	global.RT_info = RT_comp.lectura(path.join(__dirname, "rutinas"));

	// Filtros con 'default'
	global.filtrosConsConDefault = {};
	for (let prop in variables.filtrosCons)
		if (variables.filtrosCons[prop].default) filtrosConsConDefault[prop] = variables.filtrosCons[prop].default;

	// Procesos que dependen de la variable 'global'
	const rutinas = require("./rutinas/RT-Control");
	await rutinas.startupMasConfiguracion();

	// Vistas - Antiguas
	app.use("/producto", require("./rutasContrs/Rutas-Anteriores/PR-RutasAnt"));
	app.use("/rclv", require("./rutasContrs/Rutas-Anteriores/RCLV-RutasAnt"));
	app.use("/links", require("./rutasContrs/Rutas-Anteriores/LK-RutasAnt"));

	// Todas las carpetas donde se almacenan vistas
	app.set("view engine", "ejs"); // Terminación de los archivos de vista
	const vistas = obtieneLasCarpsDeVista("./vistas");
	for (let vista of ["1-Usuarios", "1-Usuarios/Includes"])
		vistas.push("../../9-CompArchs/" + subCarp + (subCarp ? "/" : "") + "vistas/" + vista);
	app.set("views", vistas);

	// Middlewares transversales
	app.use(require("./middlewares/transversales/clientes-Bienvenido")); // para filtrar los 'bots'
	app.use(require("./middlewares/transversales/urlsUsadas-Session"));
	app.use(require(path.join(carpArchComp, "./middlewares/transversales/clientes-ClienteId"))); // para obtener el cliente y usuario
	app.use(require(path.join(carpArchComp, "./middlewares/transversales/clientes-ContVisitas"))); // para contar la cantidad de días de navegación
	app.use(require("./middlewares/transversales/clientes-NovsSitio")); // en función de las novedades, revisa si se debe mostrar algún cartel
	app.use(require(path.join(carpArchComp, "./middlewares/transversales/clientes-BenefsLogin")));
	app.use(require("./middlewares/transversales/urlsUsadas-BD")); // para guardar los url navegados

	// Vistas - Con base definida
	app.use("/revision", require("./rutasContrs/3-Rev-Entidades/RE-Rutas"));
	app.use("/graficos", require("./rutasContrs/6-Graficos/GR-Rutas"));
	app.use("/institucional", require("./rutasContrs/7-Institucional/IN-Rutas"));
	app.use("/", require("./rutasContrs/5-Consultas/CN-Rutas"));

	// Vistas - Por entidad
	app.use("/usuarios", require(path.join(carpArchComp, "rutasContrs/1.1-Usuarios/US-Rutas")));
	app.use("/:entidad", require("./rutasContrs/2.0-Familias/FM-Rutas")); // incluye algunas de 'revisión' y corrección
	app.use("/:entidad", require("./rutasContrs/2.1-Prods-Agregar/PA-Rutas")); // producto
	app.use("/:entidad", require("./rutasContrs/2.1-Prods-RUD/PR-Rutas")); // producto
	app.use("/:entidad", require("./rutasContrs/2.2-RCLVs/RCLV-Rutas")); // rclv
	app.use("/:entidad", require("./rutasContrs/2.3-Links/LK-Rutas")); // producto y link
	app.use("/", require("./rutasContrs/9-Miscelaneas/MS-Rutas"));

	// Middlewares transversales
	app.use(require(path.join(carpArchComp, "middlewares/transversales/urlDesconocida"))); // Si no se reconoce el url - se debe informar después de los urls anteriores

	// Fin
	return;
})();

// Funciones
const obtieneLasCarpsDeVista = (carpetaVistas) => {
	const subCarpetas = fs.readdirSync(carpetaVistas, {withFileTypes: true});
	const todasLasCarps = [carpetaVistas];

	// Recorre las carpetas
	for (const subCarpeta of subCarpetas)
		if (subCarpeta.isDirectory()) todasLasCarps.push(...obtieneLasCarpsDeVista(carpetaVistas + "/" + subCarpeta.name));

	// Fin
	return todasLasCarps;
};
sessionStore.clearExpiredSessions(); // Elimina sesiones antiguas
