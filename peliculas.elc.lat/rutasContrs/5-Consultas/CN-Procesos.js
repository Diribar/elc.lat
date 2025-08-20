"use strict";
// Variables
const {prods: prodEnts, rclvs: rclvEnts, rclvAsocs} = variables.entidades;

module.exports = {
	varios: {
		cabeceras: async (usuario_id) => {
			// Obtiene la cabecera de las configuraciones propias y las provistas por el sistema
			usuario_id = usuario_id ? [1, usuario_id] : 1;
			const regsCabecera = await baseDatos.obtieneTodosPorCondicion("consRegsCabecera", {usuario_id});
			regsCabecera.sort((a, b) => (a.nombre < b.nombre ? -1 : 1)); // los ordena alfabéticamente

			// Fin
			return regsCabecera;
		},
		filtros: async function () {
			// Variable 'filtros'
			const filtros = {...variables.filtrosCons};

			// Agrega los filtros de código y opciones
			for (let prop in filtros) {
				// Le agrega el nombre del campo a cada método
				filtros[prop].codigo = prop;

				// Agrega las opciones que correspondan
				if (!filtros[prop].opciones) {
					// Si es el prop 'epocasOcurrencia', quita la opción 'varias'
					if (prop == "epocasOcurrencia")
						filtros.epocasOcurrencia.opciones = epocasOcurrencia
							.filter((n) => n.id != "var")
							.map((n) => ({id: n.id, nombre: n.consulta}));
					else if (prop == "temas") filtros.temas.opciones = await this.filtrosConsTemas();
					else filtros[prop].opciones = global[prop];
				}
			}

			// Fin
			return filtros;
		},
		filtrosConsTemas: async () => {
			// Variables
			const condicion = {statusRegistro_id: aprobados_ids, id: {[Op.gt]: idsReserv}};

			// Obtiene los registros asociados con productos
			const temas = await baseDatos
				.obtieneTodosPorCondicion("temas", condicion)
				.then((n) => n.map((m) => ({id: m.id, nombre: m.nombre})))
				.then((n) => n.sort((a, b) => (a.nombre < b.nombre ? -1 : 1)));

			// Fin
			return temas;
		},
		prefs_BD: async ({usuario, cabecera_id}) => {
			// Obtiene el configCons_id del usuario
			if (!cabecera_id) cabecera_id = usuario && usuario.configCons_id ? usuario.configCons_id : "";

			// Obtiene las preferencias
			let prefs = {};
			const registros = await baseDatos.obtieneTodosPorCondicion("consRegsPrefs", {cabecera_id});

			// Convierte el array en objeto literal
			for (let registro of registros)
				prefs[registro.campo] = registro.valor.includes(",") ? registro.valor.split(",") : registro.valor;

			// Fin
			return {cabecera_id, ...prefs};
		},
		msjsLayout: (usuario_id) => {
			// Variables
			const parrafo = "Opciones:";

			// Obtiene las ayudas
			const dots = cnLayouts
				.map((n) => ({nombre: n.nombre, comentario: n.ayuda}))
				.filter((n) => n.comentario) // deja solamente las que tienen comentarioy
				.filter((n) => (!usuario_id ? !n.nombre.startsWith("Mis") : true)) // si el usuario no está logueado, quita las ayudas "Mis"
				.map((n) => "<span>" + n.nombre + "</span>: " + n.comentario + ".");

			// Fin
			return {parrafo, dots};
		},
		msjsPublRecom: () => {
			// Obtiene las ayudas individuales
			const dots = mensajesProds.publico
				.filter((n) => n.includes("apto")) // deja solamente las que necesitan aclaración
				.map((n) => n.split(":")) // separa el título del comentario
				.map((n) => "<span>" + n[0] + "</span>:" + n[1]); // agrega el span al título

			// Fin
			return dots;
		},
		configCons_url: async function (req, res) {
			// Variables
			const configCons = req.query;
			const usuario_id = req.session.usuario ? req.session.usuario.id : null;
			const configCons_id = configCons.id;
			const {layout_id} = configCons;

			// Acciones si existe el configCons_id
			if (configCons_id) {
				// Si no es un configCons_id válido, lo elimina
				const cabeceras = await this.cabeceras(usuario_id);
				if (!cabeceras.find((n) => n.id == configCons_id)) delete configCons.id;

				// Si no se eliminó el 'id' lo guarda en el usuario
				if (usuario_id)
					if (configCons.id) {
						baseDatos.actualizaPorId("usuarios", usuario_id, {configCons_id});
						req.session.usuario = {...req.session.usuario, configCons_id};
					} else delete req.session.usuario.configCons_id;
			}

			// Si se debe loguear, redirecciona
			if (!usuario_id && layout_id) {
				const layout = cnLayouts.find((n) => n.id == layout_id);
				if (layout && layout.grupoSelect == "loginNeces") return "loginNeces";
			}

			// Guarda la configuracion en cookies y session
			req.session.configCons = configCons;
			res.cookie("configCons", configCons, {maxAge: unDia});

			// Fin
			return;
		},
		eliminaSessionCookie: (req, res) => {
			delete req.session.configCons;
			res.clearCookie("configCons");
			return;
		},
	},
	resultados: {
		obtieneProds: {
			consolidado: async function (prefs) {
				// Variables
				const {entidad, layout} = prefs;
				const include = [];
				let productos = [];

				// Include - simple
				if (layout.codigo == "anoEstreno") include.push("epocaEstreno");
				if (layout.codigo == "anoOcurrencia") include.push("epocaOcurrencia");
				if (["santoralAzar", "azar"].includes(layout.codigo)) include.push("prodAzar");

				// Include - complejo
				if (entidad == "productos") include.push(...rclvAsocs);
				else if (prefs.apMar) include.push("personaje", "hecho");
				else if (["rolesIgl", "canons"].some((n) => Object.keys(prefs).includes(n))) include.push("personaje");

				// Condición
				const filtrosAplicadosEnBD = this.filtrosAplicadosEnBD(prefs);
				const condicion = {statusRegistro_id: aprobados_ids, ...filtrosAplicadosEnBD};

				// Calificación
				if (prefs.excluyeBC) {
					condicion.calificacion =
						layout.codigo == "calificacion"
							? {[Op.and]: [{[Op.ne]: null}, {[Op.gte]: 70}]}
							: {[Op.or]: [{[Op.is]: null}, {[Op.gte]: 70}]};
				} else if (layout.codigo == "calificacion") condicion.calificacion = {[Op.ne]: null}; // Para la opción 'calificación', agrega pautas en las condiciones

				// Rclv
				const campo_id = !["productos", "rclvs"].includes(entidad) ? comp.obtieneDesdeEntidad.campo_id(entidad) : null; // si es una entidad particular, obtiene el nombre del 'campo_id'
				if (campo_id) condicion[campo_id] = {[Op.ne]: ninguno_id};

				// Si el código es 'santoralAzar', obtiene la fecha del día para luego poder ordenar desde el rclv del día
				const fechaDelAno =
					layout.codigo == "santoralAzar" && fechasDelAno.find((n) => n.dia == prefs.dia && n.mes_id == prefs.mes);

				// Obtiene los productos
				for (let prodEnt of prodEnts) {
					// Agrega una condición si son capítulos
					if (prodEnt == "capitulos") condicion.capEnCons = true;

					// Obtiene los productos y le agrega algunos campos
					productos.push(
						baseDatos.obtieneTodosPorCondicion(prodEnt, condicion, include).then((prods) =>
							prods.map((prod) => {
								// Arma la respuesta
								const respuesta = {...prod, entidad: prodEnt};

								// Variable 'hoy' - exclusivo para cuando importa el día de hoy
								if (fechaDelAno)
									respuesta.hoy = rclvAsocs.some(
										(rclvAsoc) => prod[rclvAsoc] && prod[rclvAsoc].fechaDelAno_id == fechaDelAno.id
									);

								// Fin
								return respuesta;
							})
						)
					);
				}
				productos = await Promise.all(productos).then((n) => n.flat());

				// Aplica filtros no aplicables en BD
				if (productos.length) productos = this.filtrosNoAplicablesEnBD({productos, prefs, campo_id});

				// Fin
				return productos;
			},
			filtrosAplicadosEnBD: (prefs) => {
				// Variables
				const {filtrosCons} = variables;
				const {idiomas} = filtrosCons;
				let filtros = {};

				// Transfiere las preferencias simples a las condiciones
				for (let prop in prefs) {
					const campoFiltro = filtrosCons[prop] && filtrosCons[prop].campoFiltro;
					if (campoFiltro) filtros[campoFiltro] = prefs[prop]; // sólo los filtros que tienen un 'campoFiltro'
				}

				// Religión
				filtros.religion_id = prefs.religiones;

				// Conversión de 'idiomas'
				if (prefs.idiomas) {
					const condic = idiomas.opciones.find((n) => n.id == prefs.idiomas).condic; // obtiene las condiciones de idioma
					if (condic) {
						const tiposLink = prefs.tiposLink == "conLinksHD" ? "conLinksHD" : "conLinks"; // obtiene la condición dentro de las condiciones
						filtros = {...filtros, ...condic[tiposLink]};
					}
				}

				// Conversión de campos con condición
				for (let campo of ["tiposLink", "publicos", "miscelaneas"])
					if (prefs[campo]) {
						const condic = filtrosCons[campo].opciones.find((n) => n.id == prefs[campo]).condic;
						if (condic) filtros = {...filtros, ...condic};
					}

				// Fin
				return filtros;
			},
			filtrosNoAplicablesEnBD: ({productos, prefs, campo_id}) => {
				// Variables
				const {apMar, rolesIgl, canons, entidad} = prefs;

				// Filtros generales
				if (rolesIgl || canons) {
					// Quita los personajes menores que 11
					productos = productos.filter((n) => n.personaje_id > varios_id);

					// Filtra por rolesIgl
					if (rolesIgl)
						productos =
							rolesIgl == "RS"
								? productos.filter((n) => ["RE", "SC"].some((m) => n.personaje.rolIglesia_id.startsWith(m)))
								: productos.filter((n) => n.personaje.rolIglesia_id.startsWith(rolesIgl));

					// Filtra por canons
					if (canons)
						productos =
							canons == "SB"
								? productos.filter((n) => ["ST", "BT"].some((m) => n.personaje.canon_id.startsWith(m))) // Santos y Beatos
								: canons == "VS"
								? productos.filter((n) => ["VN", "SD"].some((m) => n.personaje.canon_id.startsWith(m))) // Venerables y Siervos de Dios
								: canons == "TD"
								? productos.filter((n) => n.personaje.canon_id != "NN") // Todos (Santos a Siervos)
								: productos.filter((n) => n.personaje.canon_id == "NN"); // Sin proceso de canonización
				}

				// Filtra por apMar
				if (apMar) {
					// Deja solamente los productos con personajes y hechos relevantes
					productos = productos.filter((n) => n.personaje_id != ninguno_id || n.hecho_id != ninguno_id);

					// Ajustes más finos
					productos =
						apMar == "SI"
							? productos.filter(
									(n) => (n.personaje && n.personaje.apMar_id != sinApMar_id) || (n.hecho && n.hecho.ama)
							  )
							: productos.filter(
									(n) =>
										(!n.personaje || n.personaje.apMar_id == sinApMar_id) && // el personaje no vio una apMar
										(!n.hecho || !n.hecho.ama) // el hecho nunca puede ser 'sinApMar'
							  );
				}

				// Filtra por entidad
				if (campo_id) productos = productos.filter((n) => n.entidad == entidad);

				// Fin
				return productos;
			},
		},
		obtieneRclvs: {
			consolidado: async function (prefs) {
				// Si la entidad no es rclvs, interrumpe la función
				if (prefs.entidad != "rclvs") return null;

				let rclvs = prefs.layout.codigo.startsWith("santoral")
					? await this.porFechaDelAno(prefs) // para santoral
					: await this.comun(prefs); // para las demás

				rclvs = rclvs.map((n) => ({
					...n,
					anoOcurrencia: n.anoNacim ? n.anoNacim : n.anoComienzo ? n.anoComienzo : null,
				}));

				// Fin
				return rclvs;
			},
			comun: async function (prefs) {
				// Variables
				const {rolesIgl, canons, layout} = prefs;
				let {entidad} = prefs;
				let rclvs = [];

				// Interrumpe la función o cambia la entidad
				if (rolesIgl || canons) {
					if (entidad == "rclvs") entidad = "personajes";
					if (entidad != "personajes") return [];
				}

				// Obtiene los rclvs
				if (entidad == "rclvs") {
					// Variables para todos los 'rclvs'
					const rclvEnts =
						layout.codigo == "anoOcurrencia"
							? ["personajes", "hechos"] // son las únicas entidades que tienen el año histórico en que ocurrió
							: [...rclvEnts];

					// Rutina por rclv
					for (let rclvEnt of rclvEnts) {
						// Obtiene los registros
						const {condicion, include} = this.obtieneIncludeCondics(rclvEnt, prefs);
						rclvs.push(
							baseDatos
								.obtieneTodosPorCondicion(rclvEnt, condicion, include)
								.then((n) => n.map((m) => ({...m, entidad: rclvEnt})))
						);
					}
					rclvs = await Promise.all(rclvs).then((n) => n.flat());
				}

				// Rutina para un sólo rclv
				else {
					const {condicion, include} = this.obtieneIncludeCondics(entidad, prefs);
					rclvs = await baseDatos
						.obtieneTodosPorCondicion(entidad, condicion, include)
						.then((n) => n.map((m) => ({...m, entidad})));
				}

				// Fin
				return rclvs;
			},
			obtieneIncludeCondics: function (entidad, prefs) {
				// Include
				const include = ["fechaDelAno"];
				if (["personajes", "hechos"].includes(entidad)) include.push("epocaOcurrencia");
				if (entidad == "personajes") include.push("rolIglesia", "canon");

				// Obtiene las condiciones
				const filtros = ["personajes", "hechos"].includes(entidad) ? this.filtros(entidad, prefs) : null;
				const condicion = {statusRegistro_id: aprobado_id, id: {[Op.gt]: varios_id}, ...filtros};

				// Fin
				return {include, condicion};
			},
			filtros: (entidad, prefs) => {
				// Variables - la entidad tiene que ser aparte para diferenciarla de 'rclvs'
				const {apMar, rolesIgl, canons} = variables.filtrosCons;
				let filtros = {};

				// Época de ocurrencia
				if (prefs.epocasOcurrencia) filtros.epocaOcurrencia_id = prefs.epocasOcurrencia;

				// Aparición mariana
				if (prefs.apMar) {
					const condicion = apMar.opciones.find((n) => n.id == prefs.apMar).condic;
					entidad == "personajes" ? (filtros.apMar_id = condicion.pers) : (filtros.ama = condicion.hec);
				}

				// Roles en la Iglesia
				if (entidad == "personajes" && prefs.rolesIgl)
					filtros.rolIglesia_id = rolesIgl.opciones.find((n) => n.id == prefs.rolesIgl).condic;

				// Canonización
				if (entidad == "personajes" && prefs.canons)
					filtros.canon_id = canons.opciones.find((n) => n.id == prefs.canons).condic;

				// Fin
				return filtros;
			},
			porFechaDelAno: async (prefs) => {
				// Variables
				const {dia, mes} = prefs;
				const diaHoy = fechasDelAno.find((n) => n.dia == dia && n.mes_id == mes);
				const inclStd = ["fechaDelAno"];
				const inclHec = [...inclStd, "epocaOcurrencia"];
				const inclPers = [...inclHec, "rolIglesia", "canon"];
				let rclvs = [];

				// Rutina por entidad para obtener los rclvs
				for (let rclvEnt of rclvEnts) {
					// Variables
					const condicion = {statusRegistro_id: aprobado_id, fechaDelAno_id: {[Op.ne]: 400}};
					const includes = rclvEnt == "personajes" ? inclPers : rclvEnt == "hechos" ? inclHec : inclStd;

					// Obtiene los rclvs y les agrega la rclvEnt
					rclvs.push(
						baseDatos
							.obtieneTodosPorCondicion(rclvEnt, condicion, includes)
							.then((n) => n.map((m) => ({...m, entidad: rclvEnt})))
					);
				}
				rclvs = await Promise.all(rclvs).then((n) => n.flat());

				// Acciones si hay resultados
				if (rclvs.length) {
					// Ordena los registros
					rclvs
						.sort((a, b) => b.prioridad - a.prioridad) // Prioridad menor: prioridad
						.sort((a, b) => a.fechaDelAno_id - b.fechaDelAno_id); // Prioridad mayor: día ascendente

					// Para los botones, mueve los pasados al futuro
					if (diaHoy) {
						const indice = rclvs.findIndex((n) => n.fechaDelAno_id >= diaHoy.id);
						if (indice > 0) {
							const pasados = rclvs.slice(0, indice);
							rclvs.splice(0, indice);
							rclvs.push(...pasados);
						}
					}

					// Elimina los registros con el nombre repetido
					if (rclvs.length > 1)
						for (let i = rclvs.length - 2; i >= 0; i--)
							if (rclvs[i].nombre == rclvs[i + 1].nombre) rclvs.splice(i + 1, 1);
				}

				// Fin
				return rclvs;
			},
		},
		cruce: {
			// Productos
			prodsConPPP: ({prods, pppRegistros, prefs, usuario_id, layout}) => {
				// Interrumpe la función
				if (!prods.length) return [];
				if (!usuario_id) return layout.codigo != "misPrefs" ? prods : [];

				// Variables
				const {pppOpciones: pppOpcion} = prefs;

				// Si se cumple un conjunto de condiciones, se borran todos los productos y termina la función
				if (
					pppOpcion && // se eligió una opción
					pppOpcion != "todos" && // no se eligió la opción "Todas las preferencias"
					!pppOpcion.includes(String(pppOpcsObj.sinPref.id)) && // la opción elegida no incluye a 'sinPref'
					!pppRegistros.length // no hay registros 'ppp'
				)
					return [];

				// Rutina por producto
				for (let i = prods.length - 1; i >= 0; i--) {
					// Averigua si el producto tiene un registro de preferencia del usuario
					let pppRegistro = pppRegistros.find((n) => n.entidad == prods[i].entidad && n.entidad_id == prods[i].id);

					// Si no tiene pppRegistro y es un capítulo, asume el de la colección
					if (!pppRegistro && prods[i].entidad == "capitulos")
						pppRegistro = pppRegistros.find(
							(n) => n.entidad == "colecciones" && n.entidad_id == prods[i].coleccion_id
						);

					// Acciones si se eligió un tipo de preferencia
					if (pppOpcion && pppOpcion != "todos") {
						// Elimina los registros que correspondan
						if (
							(pppRegistro && !pppOpcion.includes(String(pppRegistro.ppp_id))) || // tiene alguna preferencia que no es la que se había elegido
							(!pppRegistro && !pppOpcion.includes(String(pppOpcsObj.sinPref.id))) // no tiene una preferencia y no se eligió 'sinPref'
						)
							prods.splice(i, 1);
						// Si no se eliminó, le agrega a los productos la 'ppp' del usuario
						else {
							// Variable
							const pppOpcionElegida =
								pppOpcion == pppOpcsObj.sinPref.id || !pppRegistro
									? pppOpcsObj.sinPref // si se eligió 'sin preferencia' o no hay un registro
									: pppOpcsArray.find((n) => n.id == pppRegistro.ppp_id); // elige la opción del producto que coincide con la elegida

							// Le agrega a los productos la 'ppp' del usuario
							prods[i].ppp = pppOpcionElegida;

							// Le agrega datos adicionales si se eligió la opción 'misPrefs'
							if (layout.codigo == "misPrefs") {
								prods[i].ppp_id = pppOpcionElegida.id;
								//prods[i].misPrefs = pppRegistro.creadoEn;
								prods[i].yaLaVi = pppOpcionElegida.codigo == pppOpcsObj.yaLaVi.codigo;
								prods[i].laQuieroVer = pppOpcionElegida.codigo == pppOpcsObj.laQuieroVer.codigo;
							}
						}
					}
					// Si no se eligió un tipo de preferencia, le agrega a los productos la ppp del usuario
					else prods[i].ppp = pppRegistro ? pppRegistro.detalle : pppOpcsObj.sinPref;
				}

				// Fin
				return prods;
			},
			prodsConRclvs: ({prods, rclvs}) => {
				// Interrumpe la función
				if (!rclvs) return prods; // Si no se pidió cruzar contra rclvs, devuelve la variable intacta
				if (!prods.length || !rclvs.length) return []; // Si no hay rclvs, reduce a cero los productos

				// Para cada rclv, busca los productos
				const prodsCruzadosConRclvs = [];
				for (const rclv of rclvs) {
					// Variables
					const campo_id = comp.obtieneDesdeEntidad.campo_id(rclv.entidad);
					const hallazgos = prods.filter((n) => n[campo_id] == rclv.id);
					const asoc = comp.obtieneDesdeEntidad.asociacion(rclv.entidad);
					const fechaDelAno = rclv.fechaDelAno.nombre;

					// Acciones si se encontraron hallazgos
					if (hallazgos.length) {
						prodsCruzadosConRclvs.push(...hallazgos.map((n) => ({...n, [asoc]: {...n[asoc], fechaDelAno}}))); // los agrega
						prods = prods.filter((n) => n[campo_id] != rclv.id); // los elimina de prods para que no se dupliquen
					}
				}

				// Fin
				return prodsCruzadosConRclvs;
			},
			prodsConPalsClave: ({prods, palabrasClave}) => {
				if (!prods.length) return [];
				if (!palabrasClave) return prods;

				// Variables
				palabrasClave = palabrasClave.toLowerCase();

				// Rutina por producto
				for (let i = prods.length - 1; i >= 0; i--) {
					// Variables
					const prod = prods[i];

					// Busca las 'palsClave' dentro de sus campos simples
					for (let campo in prod)
						if (
							prod[campo] && // que tenga un valor
							typeof prod[campo] == "string" &&
							prod[campo].toLowerCase().includes(palabrasClave)
						) {
							prods[i].palsClave = true;
							break;
						}

					// Busca las 'palsClave' dentro de sus campos include
					if (!prods[i].palsClave)
						for (let rclvAsoc of rclvAsocs) {
							const rclv = prod[rclvAsoc];
							for (let campo in rclv)
								if (
									rclv[campo] && // que tenga un valor
									typeof rclv[campo] == "string" &&
									rclv[campo].toLowerCase().includes(palabrasClave)
								)
									prods[i].palsClave = true;
						}

					// Si el producto no tiene las palsClave, lo elimina
					if (!prods[i].palsClave) prods.splice(i, 1);
				}

				// Fin
				return prods;
			},
			prodsConMisCalifs: async ({prods, usuario_id, layout}) => {
				// Interrupciones de la función
				if (layout.codigo != "misCalificadas") return prods;
				if (!prods.length || !usuario_id) return [];

				// Obtiene los registros del usuario
				const misCalificadas = await baseDatos.obtieneTodosPorCondicion("calRegistros", {usuario_id});

				// Elimina los productos no calificados
				for (let i = prods.length - 1; i >= 0; i--) {
					// Averigua si fue calificada
					const calificada = misCalificadas.find((n) => n.entidad == prods[i].entidad && n.entidad_id == prods[i].id);

					// Según corresponda, agrega la calificación o elimina el producto
					if (calificada) prods[i].calificacion = calificada.resultado;
					else prods.splice(i, 1);
				}

				// Fin
				return prods;
			},
			prodsConMisConsultas: async ({prods, usuario_id, layout}) => {
				// Interrupciones de la función
				if (layout.codigo != "misConsultas") return prods;
				if (!prods.length || !usuario_id) return [];

				// Obtiene los registros del usuario
				let misConsultas = await baseDatos.obtieneTodosPorCondicion("misConsultas", {usuario_id});
				if (!misConsultas.length) return [];
				misConsultas.reverse();

				// Elimina los productos no consultados
				for (let i = prods.length - 1; i >= 0; i--) {
					const consulta = misConsultas.find((n) => n.entidad == prods[i].entidad && n.entidad_id == prods[i].id);
					if (!consulta) prods.splice(i, 1);
					else prods[i].fechaConsulta = consulta.visitadaEn;
				}

				// Fin
				return prods;
			},

			// Rclvs
			rclvsConProds: ({rclvs, prods, prefs}) => {
				// Cruza 'rclvs' con 'prods'
				if (!prods.length || !rclvs.length) return [];

				// Tareas por rclv
				let i = 0;
				while (i < rclvs.length) {
					// Variables
					const rclv = rclvs[i];

					// Agrupa los productos en el método 'productos'
					const campo_id = comp.obtieneDesdeEntidad.campo_id(rclv.entidad);
					rclvs[i].productos = prods.filter((n) => n[campo_id] == rclv.id);

					// Si el rclv no tiene productos, lo elimina
					if (!rclvs[i].productos.length) rclvs.splice(i, 1);
					// Acciones en caso contrario
					else {
						// Ordena los productos por su año de estreno
						rclvs[i].productos.sort((a, b) => b.anoEstreno - a.anoEstreno);

						// Deja solamente los campos necesarios
						rclvs[i].productos = rclvs[i].productos.map((n) => {
							// Obtiene campos simples
							const {entidad, id, nombreCastellano, ppp, direccion, anoEstreno, coleccion_id} = n;
							const datosProd = {entidad, id, nombreCastellano, ppp, direccion, anoEstreno, coleccion_id};

							// Achica el campo dirección
							if (direccion && direccion.indexOf(",") > 0)
								datosProd.direccion = direccion.slice(0, direccion.indexOf(","));

							// Obtiene el nombre de la entidad
							datosProd.entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);

							// Si es una colección, agrega el campo 'anoFin'
							if (n.entidad == "colecciones") datosProd.anoFin = n.anoFin;

							// Fin
							return datosProd;
						});

						// Quita los productos usados, para no duplicarlos en los resultados
						if (prefs.codigo == "anoOcurrencia") prods = prods.filter((n) => n[campo_id] != rclv.id);

						// Actualiza el índice para analizar el siguiente registro
						i++;
					}
				}

				// Fin
				return rclvs;
			},
			rclvsConPalsClave: ({rclvs, palabrasClave}) => {
				if (!rclvs.length) return [];
				if (!palabrasClave) return rclvs;

				// Variables
				palabrasClave = palabrasClave.toLowerCase();

				// Rutina por rclv
				for (let i = rclvs.length - 1; i >= 0; i--) {
					// Variables
					const rclv = rclvs[i];

					// Busca las 'palsClave' dentro de sus campos simples
					for (let campo in rclv)
						if (
							rclv[campo] && // tiene un valor
							typeof rclv[campo] == "string" &&
							rclv[campo].toLowerCase().includes(palabrasClave)
						) {
							rclvs[i].palsClave = true;
							break;
						}

					// Busca las 'palsClave' dentro de sus productos
					if (!rclvs[i].palsClave)
						for (let j = rclv.productos.length - 1; j >= 0; j--) {
							// Variables
							const producto = rclv.productos[j];

							// Acciones si el producto tiene las 'palabrasClave'
							for (let campo in producto) {
								if (
									producto[campo] && // tiene un valor
									typeof producto[campo] == "string" &&
									producto[campo].toLowerCase().includes(palabrasClave)
								) {
									rclvs[i].palsClave = true;
									producto.palsClave = true;
									break;
								}
							}

							// Si el producto no tiene las 'palabrasClave', lo elimina del rclv
							if (!producto.palsClave) rclvs[i].productos.splice(j, 1);
						}

					// Si el rclv no tiene las palsClave, lo elimina
					if (!rclvs[i].palsClave) rclvs.splice(i, 1);
				}

				// Fin
				return rclvs;
			},
		},
		orden: {
			prods: ({prods, layout}) => {
				// Si corresponde, ordena por el azar decreciente
				if (["santoralAzar", "azar"].includes(layout.codigo))
					prods.sort((a, b) =>
						a.prodAzar && b.prodAzar
							? b.prodAzar.azar - a.prodAzar.azar // si ambos tienen azar, los ordena por el azar decreciente
							: a.prodAzar.azar // si solo uno tiene azar, lo ordena por el azar decreciente
							? -1
							: b.prodAzar.azar
							? 1
							: 0
					);
				// Resto
				else ordenStd({prods, layout});

				// Fin
				return prods;
			},
			rclvs: ({rclvs, layout}) => {
				// Si no corresponde ordenar, interrumpe la función
				if (rclvs.length < 2 || layout.codigo.startsWith("santoral")) return rclvs;

				// Particularidad para el Año de Ocurrencia
				if (layout.codigo == "anoOcurrencia") {
					rclvs.sort((a, b) => b.anoOcurrencia - a.anoOcurrencia);
					rclvs.sort((a, b) => b.epocaOcurrencia.orden - a.epocaOcurrencia.orden);
				}
				// En los demás casos, ordena por su campo
				else
					rclvs.sort((a, b) =>
						typeof a[layout.codigo] == "string" && b[layout.codigo] == "string"
							? layout.ascDes == "ASC"
								? a[layout.codigo].toLowerCase() < b[layout.codigo].toLowerCase()
									? -1
									: 1
								: a[layout.codigo].toLowerCase() > b[layout.codigo].toLowerCase()
								? -1
								: 1
							: layout.ascDes == "ASC"
							? a[layout.codigo] < b[layout.codigo]
								? -1
								: 1
							: a[layout.codigo] > b[layout.codigo]
							? -1
							: 1
					);

				// Fin
				return rclvs;
			},
		},
		descartaCapsSiColPresente: {
			prods: (resultados) => {
				// Descarta capítulos si la colección está presente
				const colecciones = resultados.filter((n) => n.entidad == "colecciones");
				for (let coleccion of colecciones) resultados = resultados.filter((n) => n.coleccion_id != coleccion.id);

				// Descarta capítulos cuando ya hay uno existente de su colección
				for (let i = resultados.length - 1; i >= 0; i--) {
					// Si no es una colección, saltea la rutina
					if (!resultados[i].coleccion_id) continue;

					// Si corresponde, quita el capítulo
					if (resultados.find((n) => n.coleccion_id == resultados[i].coleccion_id).id != resultados[i].id)
						resultados.splice(i, 1);
				}

				// Fin
				return resultados;
			},
			rclvs: (rclvs) => {
				// Rutina por rclv
				rclvs.forEach((rclv, i) => {
					const colecciones = rclv.productos ? rclv.productos.filter((n) => n.entidad == "colecciones") : [];
					for (let coleccion of colecciones)
						rclvs[i].productos = rclv.productos.filter((n) => n.coleccion_id != coleccion.id);
				});

				// Fin
				return rclvs;
			},
		},
		quitaExcedente: ({resultados, layout, prefs}) => {
			// Variables
			const cantResults = layout.cantidad;

			// Casos particulares
			if (["santoralAzar", "azar"].includes(layout.codigo))
				resultados = alAzar.consolidado({resultados, cantResults, prefs, layout});
			// Demás casos
			else if (cantResults) resultados.splice(cantResults);

			// Fin
			return resultados;
		},
		camposNecesarios: {
			prods: (prods) => {
				// Si no hay registros a achicar, interrumpe la función
				if (!prods.length) return [];

				// Deja solamente los campos necesarios
				prods = prods.map((prod) => {
					// Obtiene campos mandatorios
					const {entidad, id, nombreCastellano, ppp, avatar, religion_id, linksGral} = prod;
					const datosNeces = {entidad, id, nombreCastellano, ppp, avatar, religion_id, linksGral};

					// Campos a pulir
					const {direccion, anoEstreno} = prod;
					datosNeces.direccion = !direccion
						? "desconocido"
						: direccion.indexOf(",") > 0
						? direccion.slice(0, direccion.indexOf(",")) // Achica el campo dirección
						: direccion;
					datosNeces.anoEstreno = !anoEstreno ? "0 (desconocido)" : anoEstreno;

					// Obtiene campos opcionales
					const {epocaEstreno, coleccion_id, crueldad, calificacion} = prod;
					if (epocaEstreno) datosNeces.epocaEstreno = epocaEstreno.nombre;
					if (coleccion_id) datosNeces.coleccion_id = coleccion_id;
					if (crueldad) datosNeces.crueldad = true;
					if (calificacion) datosNeces.calificacion = prod.calificacion;

					// Obtiene el nombre de la entidad
					datosNeces.entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(entidad);

					// Obtiene los rclvs
					for (let rclvEnt of rclvEnts) {
						// Variables
						const campo_id = comp.obtieneDesdeEntidad.campo_id(rclvEnt);
						const asociacion = comp.obtieneDesdeEntidad.asociacion(rclvEnt);
						const entidadNombre = comp.obtieneDesdeEntidad.entidadNombre(rclvEnt);

						// Rclv nombre
						if (prod[campo_id] > varios_id) {
							datosNeces[entidadNombre] = prod[asociacion].nombre;
							break;
						}
					}

					// Si es una colección, agrega el campo 'anoFin'
					if (prod.entidad == "colecciones") datosNeces.anoFin = prod.anoFin;

					// Fin
					return datosNeces;
				});

				// Fin
				return prods;
			},
			rclvs: ({rclvs, layout}) => {
				// Si no hay registros, interrumpe la función
				if (!rclvs.length) return [];

				// Deja solamente los campos necesarios
				rclvs = rclvs.map((rclv) => {
					// Arma el resultado
					const {entidad, id, nombre, productos, avatar, anoOcurrencia} = rclv; // necesarios
					const {fechaDelAno_id, fechaDelAno, epocaOcurrencia_id, epocaOcurrencia} = rclv; // eventuales
					const {religion_id, soloCfc, nombreAltern} = rclv; // eventuales
					let datosNeces = {entidad, id, nombre, productos, avatar, anoOcurrencia};

					// Casos especiales
					if (nombreAltern) datosNeces.nombreAltern = nombreAltern;
					if (religion_id) datosNeces.religion_id = religion_id;
					if (fechaDelAno && layout.codigo.startsWith("santoral"))
						datosNeces = {...datosNeces, fechaDelAno_id, fechaDelAno: fechaDelAno.nombre}; // sólo muestra la 'fechaDelAno_id' en el Front-End para las vistas con santoral
					if (epocaOcurrencia)
						datosNeces = {...datosNeces, epocaOcurrencia_id, epocaOcurrencia: epocaOcurrencia.consulta}; // hace falta la 'fechaDelAno_id' en el Front-End

					// Estandariza el campo religión
					if (soloCfc || ["eventos", "epocasDelAno"].includes(entidad)) datosNeces.cfc = true;

					// Obtiene campos en función de la entidad
					if (entidad == "personajes" && rclv.rolIglesia_id != "NN") {
						datosNeces.rolIglesiaNombre = rclv.rolIglesia[rclv.genero_id];
						if (rclv.canon_id != "NN") datosNeces.canonNombre = rclv.canon[rclv.genero_id];
					}

					// Fin
					return datosNeces;
				});

				// Fin
				return rclvs;
			},
		},
	},
};

// Funciones
const ordenStd = ({prods, layout}) => {
	// Variables
	const campo = false
		? false
		: layout.codigo.startsWith("nombre")
		? "nombreCastellano"
		: layout.codigo == "anoEstreno"
		? "anoEstreno"
		: layout.codigo == "misCalificadas"
		? "calificacion"
		: layout.codigo == "misConsultas"
		? "fechaConsulta"
		: layout.codigo == "santoral"
		? "fechaDelAno_id"
		: layout.codigo;

	// Ordena
	const menorPrimero = layout.ascDes == "ASC" ? -1 : 1;
	prods.sort((a, b) =>
		typeof a[campo] == "string" && b[campo] == "string"
			? a[campo].toLowerCase() < b[campo].toLowerCase() // acciones para strings
				? menorPrimero
				: -menorPrimero
			: a[campo] < b[campo] // acciones para 'no strings'
			? menorPrimero
			: -menorPrimero
	);

	// Orden adicional para "misPrefs"
	if (layout.codigo == "misPrefs") {
		prods.sort((a, b) => (a.yaLaVi && !b.yaLaVi ? -1 : 0));
		prods.sort((a, b) => (a.laQuieroVer && !b.laQuieroVer ? -1 : 0));
	}

	// Fin
	return;
};
const alAzar = {
	consolidado: function ({resultados, cantResults, prefs, layout}) {
		// Variables
		const v = {
			resultados,
			cantResults,
			ahora: new Date(),
			epocasEstrenoRecientes: epocasEstreno.slice(0, -1), // descarta la época más antigua, para que salga con menor frecuencia
			cfc: 0,
			vpc: 0,
			contador: 0,
			prodsFrontEnd: [],
		};

		// Averigua si se debe equilibrar entre 'cfc' y 'vpc'
		v.seDebeEquilibrar =
			prefs.religiones.includes("CFC") &&
			prefs.religiones.length > 1 && // se eligió más de una opción de 'religiones'
			!prefs.apMar && // 'apMar' no está contestado
			(!prefs.canons || prefs.canons == "NN") && // 'canons' no está contestado
			!prefs.rolesIgl; // 'rolesIgl' no está contestado

		// 1. Elije las altas del último día
		this.porAltaUltimosDias(v);
		if (v.contador < 4 && layout.codigo == "santoralAzar") this.porDiaVigente(v);

		// 2. Elige por la 'epocaEstreno', balanceando entre cfc y vpc
		if (v.contador < 4)
			for (let epocaEstreno of v.epocasEstrenoRecientes) if (v.contador < 4) this.porEpocaDeEstreno({epocaEstreno, v});

		// 3. Agrega registros hasta llegar a cuatro, balanceando entre cfc y vpc mientras sea posible
		while (v.contador < 4 && v.resultados.length) {
			// Busca el producto ideal
			v.resultado = v.resultados.find(
				(n) =>
					!v.seDebeEquilibrar || // no se debe equilibrar
					(v.cfc <= v.vpc ? n.religion_id == "CFC" : n.religion_id != "CFC") // se debe equilibrar
			);

			// Si no lo encontró, busca cualquier producto
			if (!v.resultado) v.resultado = v.resultados[0];

			// Lo agrega a la respuesta
			if (v.resultado) this.agregaUnBoton(v);
		}

		// 4. Ordena los 4 resultados
		v.prodsFrontEnd.sort((a, b) => b.anoEstreno - a.anoEstreno);
		if (layout.codigo == "santoralAzar") v.prodsFrontEnd.sort((a, b) => (a.hoy === b.hoy ? 0 : a.hoy ? -1 : 1)); // prioriza los productos del día

		// Agrega registros hasta completar los de 'cantResults'
		while ((v.contador < cantResults || !cantResults) && v.resultados.length) {
			v.resultado = v.resultados[0];
			this.agregaUnBoton(v);
		}

		// Fin
		return v.prodsFrontEnd;
	},
	porAltaUltimosDias: function (v) {
		// Outputs - Último día
		v.resultado = v.resultados.find((n) => n.altaRevisadaEn.getTime() > v.ahora.getTime() - unDia);
		this.agregaUnBoton(v);

		// Fin
		return;
	},
	porDiaVigente: function (v) {
		// Agrega un botón por epoca de estreno
		for (const epocaEstreno of v.epocasEstrenoRecientes) {
			// Si se llegó a la cantidad establecida, interrumpe la función
			if (v.contador >= v.cantResults) break;

			// Variables
			const epoca_id = epocaEstreno.id;

			// Obtiene el primer producto del día y de esa época de estreno
			v.resultado = v.resultados.find((n) => n.hoy && n.epocaEstreno_id == epoca_id);

			// Agrega un botón
			if (v.resultado) this.agregaUnBoton(v);
		}

		// Completa con los del día hasta llegar a la cantidad establecida
		while (v.resultados.find((n) => n.hoy) && v.contador < v.cantResults && v.resultados.length) {
			v.resultado = v.resultados.find((n) => n.hoy);
			this.agregaUnBoton(v);
		}

		// Fin
		return;
	},
	porEpocaDeEstreno: function ({epocaEstreno, v}) {
		// Variables
		const epoca_id = epocaEstreno.id;
		const suma = epoca_id < 3 ? 3 : 7; // la suma de los IDs posibles

		// Si ya existe un producto para esa epoca de estreno, termina la función
		if (v.prodsFrontEnd.find((n) => n.epocaEstreno_id == epoca_id)) return;

		// Obtiene los productos de esa época de estreno
		v.resultado = v.resultados.filter((n) => n.epocaEstreno_id == epoca_id);

		// Si se debe equilibrar entre 'cfc' y 'vpc', se queda con los resultados que correspondan
		if (v.resultado.length && v.seDebeEquilibrar) {
			const prodEnLaOtraEpocaEstr = v.prodsFrontEnd.find((n) => n.epocaEstreno_id == suma - epoca_id);
			if (prodEnLaOtraEpocaEstr) {
				const elOtroProdNoEsCfc = prodEnLaOtraEpocaEstr.religion_id != "CFC"; // si no hay cfc, se lo debe buscar
				v.resultado = v.resultado.filter((n) => (elOtroProdNoEsCfc ? n.religion_id == "CFC" : n.religion_id != "CFC"));
			}
		}

		// Agrega un botón
		if (v.resultado.length) {
			v.resultado = v.resultado[0];
			this.agregaUnBoton(v);
		}

		// Fin
		return;
	},
	agregaUnBoton: (v) => {
		// Si se llegó a los cuatro, aborta
		if (v.contador == v.cantResults || !v.resultado) return;

		// Miscelaneas
		v.prodsFrontEnd.push(v.resultado);
		v.contador++;
		v.resultado.religion_id == "CFC" ? v.cfc++ : v.vpc++;

		// Quita el registro de los resultados
		const indice = v.resultados.findIndex((n) => n.id == v.resultado.id && n.entidad == v.resultado.entidad);
		v.resultados.splice(indice, 1);

		// Borra los últimos resultados
		delete v.resultado;

		// Fin
		return;
	},
};
