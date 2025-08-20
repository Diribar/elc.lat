"use strict";
// Variables
const router = express.Router();
const API = require("./PA-ControlAPI");
const vista = require("./PA-ControlVista");

// Middlewares
const m = {
	// Específicos de usuarios
	usAltaTerm: require(path.join(carpCompUs.mdw, "usAltaTerm")),
	usAptoInput: require(path.join(carpCompUs.mdw, "usAptoInput")),
	usPenalizaciones: require(path.join(carpCompUs.mdw, "usPenalizaciones")),
	usAutorizFA: require("../../middlewares/porUsuario/usAutorizFA"),

	// Específicos del registro
	prodAgregar: require("../../middlewares/porRegistro/prodAgregar"),
	prodYaEnBD: require("../../middlewares/porRegistro/prodYaEnBD"),

	// Otros
	agregarUrlEnBd: require("../../middlewares/porRegistro/urlAgregarProd"),
	multer: require(rutaNombreMulter),
};

// Middlewares - Consolidados
m.usuario = [m.usAltaTerm, m.usPenalizaciones, m.usAptoInput];
m.producto = [m.prodAgregar, m.agregarUrlEnBd];
const mdwsComb = [...m.usuario, ...m.producto];

// APIs - Validaciones
router.get("/api/pa-valida-pc", API.validacs.palabrasClave);
router.get("/api/pa-valida-ds", API.validacs.desambiguar);
router.get("/api/pa-valida-dd", API.validacs.datosDuros);
router.get("/api/pa-valida-da", API.validacs.datosAdics);
router.get("/api/pa-valida-fa", API.validacs.copiarFA);

// APIs - Palabras clave
router.get("/api/pa-busca-info-de-session-pc", API.buscaInfoDeSession_pc);

// APIs - Palabras clave y Desambiguar
router.get("/api/pa-busca-los-productos", API.pcHallazgos.buscaProds);
router.get("/api/pa-reemplaza-las-peliculas-por-su-coleccion", API.pcHallazgos.reemplPeliPorColec);
router.get("/api/pa-organiza-la-info", API.pcHallazgos.organizaLaInfo);
router.get("/api/pa-agrega-hallazgos-de-IM-y-FA", API.pcHallazgos.agregaHallazgosDeIMFA);
router.get("/api/pa-obtiene-el-mensaje", API.pcHallazgos.obtieneElMensaje);

// APIs - Desambiguar
router.get("/api/pa-busca-info-de-session-ds", API.desamb.buscaInfoDeSession);
router.get("/api/pa-actualiza-datos-originales-del-producto", API.desamb.actualizaDatosOrigs);
router.get("/api/pa-crea-session-im", API.desamb.creaSessionIm);

// APIs - IM
router.get("/api/pa-session-cookie-im", API.im.sessionCookie);
router.get("/api/pa-obtiene-colecciones", API.im.colecciones);
router.get("/api/pa-obtiene-caps-de-la-temp", API.im.capsTemp);
router.get("/api/pa-obtiene-cant-de-temps", API.im.cantTemps);

// APIs - Varias
router.get("/api/pa-obtiene-fa-id", API.obtieneFA_id); // fa
router.get("/api/pa-averigua-si-fa-ya-existe-en-bd", API.averiguaSiYaExisteEnBd); // fa
router.get("/api/pa-guarda-datos-adicionales/", API.guardaDatosAdics); // datos adicionales

// Vistas - Data entry
router.get("/agregar-pc", mdwsComb, vista.palabrasClave.form);
router.post("/agregar-pc", m.prodAgregar, vista.palabrasClave.guardar);
router.get("/agregar-ds", mdwsComb, vista.desambiguar);

// Vistas - Comienzo de "prodYaEnBD"
router.get("/agregar-dd", mdwsComb, m.prodYaEnBD, m.agregarUrlEnBd, vista.datosDuros.form);
router.post("/agregar-dd", m.prodAgregar, m.prodYaEnBD, m.multer.single("avatar"), vista.datosDuros.guardar);
router.get("/agregar-da", mdwsComb, m.prodYaEnBD, m.agregarUrlEnBd, vista.datosAdics.form);
router.post("/agregar-da", m.prodAgregar, m.prodYaEnBD, vista.datosAdics.guardar);
router.get("/agregar-cn", mdwsComb, m.prodYaEnBD, m.agregarUrlEnBd, vista.confirma.form);
router.post("/agregar-cn", m.prodAgregar, m.prodYaEnBD, vista.confirma.guardar);

// Vistas - Fin de "prodYaEnBD"
router.get("/agregar-tr", vista.terminaste);

// Vistas - Ingreso Manual
router.get("/agregar-im", mdwsComb, vista.IM.form);
router.post("/agregar-im", m.prodAgregar, vista.IM.guardar);

// Vistas - Ingreso FA
router.get("/agregar-fa", mdwsComb, m.usAutorizFA, m.agregarUrlEnBd, vista.FA.form);
router.post("/agregar-fa", m.prodAgregar, m.usAutorizFA, vista.FA.guardar);

// Fin
module.exports = router;
