const formulario = document.querySelector("#formulario-registro");
const lista = document.querySelector("#lista-inscripciones");
const mensaje = document.querySelector("#mensaje");
const botonGuardar = document.querySelector("#boton-guardar");
const botonCancelar = document.querySelector("#boton-cancelar");
const contador = document.querySelector("#contador");

let idEnEdicion = null;

function mostrarMensaje(texto, tipo = "exito") {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

function datosFormulario() {
  const formData = new FormData(formulario);
  return Object.fromEntries(formData.entries());
}

function crearElemento(tag, texto, clase) {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;
  if (clase) elemento.className = clase;
  return elemento;
}

async function respuestaApi(url, opciones = {}) {
  const respuesta = await fetch(url, opciones);
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.mensaje || datos.error || "No fue posible completar la solicitud.");
  }
  return datos;
}

async function cargarInscripciones() {
  try {
    const registros = await respuestaApi("/api/inscripciones");
    lista.replaceChildren();
    contador.textContent = `${registros.length} ${registros.length === 1 ? "registro" : "registros"}`;

    if (registros.length === 0) {
      lista.appendChild(crearElemento("li", "Aún no hay inscripciones.", "vacio"));
      return;
    }

    for (const registro of registros) {
      const item = document.createElement("li");
      item.className = "inscripcion";
      const informacion = document.createElement("div");
      informacion.className = "informacion-inscripcion";

      const nombre = crearElemento("strong", registro.nombre);
      const detalle = crearElemento(
        "span",
        `${registro.correo} · ${registro.telefono} · ${registro.taller}`
      );
      const extras = crearElemento(
        "span",
        `${registro.horario} · ${registro.modalidad} · ${registro.nivel_experiencia}`,
        "detalle-secundario"
      );
      const fecha = crearElemento(
        "small",
        `Registrado: ${registro.fecha_registro || "Sin fecha"}`
      );

      informacion.append(nombre, detalle, extras, fecha);

      const acciones = document.createElement("div");
      acciones.className = "acciones-registro";
      const editar = crearElemento("button", "Editar", "boton-pequeno");
      editar.type = "button";
      editar.addEventListener("click", () => prepararEdicion(registro));
      const eliminar = crearElemento("button", "Eliminar", "boton-pequeno peligro");
      eliminar.type = "button";
      eliminar.addEventListener("click", () => eliminarInscripcion(registro.id));
      acciones.append(editar, eliminar);
      item.append(informacion, acciones);
      lista.appendChild(item);
    }
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

async function cargarReportes() {
  const ids = {
    porTaller: "#reporte-taller",
    porHorario: "#reporte-horario",
    porModalidad: "#reporte-modalidad"
  };
  try {
    const resumen = await respuestaApi("/api/reportes/resumen");
    document.querySelector("#total-inscripciones").textContent = resumen.total;
    for (const [grupo, selector] of Object.entries(ids)) {
      const destino = document.querySelector(selector);
      destino.replaceChildren();
      if (!resumen[grupo].length) {
        destino.appendChild(crearElemento("li", "Sin datos"));
      } else {
        resumen[grupo].forEach(fila => {
          destino.appendChild(crearElemento("li", `${fila.nombre}: ${fila.total}`));
        });
      }
    }
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

async function actualizarVista() {
  await Promise.all([cargarInscripciones(), cargarReportes()]);
}

function prepararEdicion(registro) {
  idEnEdicion = registro.id;
  for (const [campo, valor] of Object.entries(registro)) {
    const control = formulario.elements.namedItem(campo);
    if (control) control.value = valor;
  }
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.classList.remove("oculto");
  document.querySelector("#titulo-formulario").textContent = "Editar inscripción";
  mostrarMensaje(`Editando la inscripción de ${registro.nombre}.`, "aviso");
  formulario.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelarEdicion() {
  idEnEdicion = null;
  formulario.reset();
  botonGuardar.textContent = "Registrar inscripción";
  botonCancelar.classList.add("oculto");
  document.querySelector("#titulo-formulario").textContent = "Datos de inscripción";
}

async function eliminarInscripcion(id) {
  if (!window.confirm("¿Deseas eliminar esta inscripción? Esta acción no se puede deshacer.")) return;
  try {
    const resultado = await respuestaApi(`/api/inscripciones/${id}`, { method: "DELETE" });
    if (idEnEdicion === id) cancelarEdicion();
    mostrarMensaje(resultado.mensaje);
    await actualizarVista();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!formulario.reportValidity()) return;

  const datos = datosFormulario();
  const metodo = idEnEdicion ? "PUT" : "POST";
  const url = idEnEdicion ? `/api/inscripciones/${idEnEdicion}` : "/api/inscripciones";

  try {
    const resultado = await respuestaApi(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    cancelarEdicion();
    mostrarMensaje(resultado.mensaje);
    await actualizarVista();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
});

botonCancelar.addEventListener("click", cancelarEdicion);
actualizarVista();
