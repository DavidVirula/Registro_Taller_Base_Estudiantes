const express = require("express");
const path = require("node:path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

const CAMPOS = [
  "nombre", "correo", "telefono", "taller",
  "horario", "modalidad", "nivel_experiencia"
];

function validar(datos) {
  const limpios = {};
  for (const campo of CAMPOS) {
    const valor = datos[campo];
    if (typeof valor !== "string" || !valor.trim()) {
      return { error: `El campo ${campo.replace("_", " ")} es obligatorio.` };
    }
    limpios[campo] = valor.trim();
  }

  if (limpios.nombre.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres." };
  }
  if (limpios.nombre.length > 120 || limpios.correo.length > 160 ||
      limpios.telefono.length > 30) {
    return { error: "Uno o más campos exceden la longitud permitida." };
  }
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!correoValido.test(limpios.correo)) {
    return { error: "El correo electrónico no tiene un formato válido." };
  }
  const talleres = ["HTML y CSS", "JavaScript", "Node.js y Express"];
  const horarios = ["07:00 - 09:00", "09:00 - 11:00", "11:00 - 13:00"];
  const modalidades = ["Presencial", "Virtual"];
  const niveles = ["Principiante", "Intermedio", "Avanzado"];
  if (!talleres.includes(limpios.taller)) return { error: "Selecciona un taller válido." };
  if (!horarios.includes(limpios.horario)) return { error: "Selecciona un horario válido." };
  if (!modalidades.includes(limpios.modalidad)) return { error: "Selecciona una modalidad válida." };
  if (!niveles.includes(limpios.nivel_experiencia)) return { error: "Selecciona un nivel de experiencia válido." };

  return { datos: limpios };
}

function obtenerPorId(id) {
  return db.prepare(`
    SELECT id, nombre, correo, telefono, taller, horario, modalidad,
           nivel_experiencia, fecha_registro
    FROM inscripciones WHERE id = ?
  `).get(id);
}

app.get("/api/inscripciones", (req, res) => {
  const filas = db.prepare(`
    SELECT id, nombre, correo, telefono, taller, horario, modalidad,
           nivel_experiencia, fecha_registro
    FROM inscripciones ORDER BY id DESC
  `).all();
  res.json(filas);
});

app.post("/api/inscripciones", (req, res) => {
  const resultado = validar(req.body || {});
  if (resultado.error) {
    return res.status(400).json({ error: "Error de validación", mensaje: resultado.error });
  }

  const d = resultado.datos;
  const insert = db.prepare(`
    INSERT INTO inscripciones
      (nombre, correo, telefono, taller, horario, modalidad, nivel_experiencia)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = insert.run(d.nombre, d.correo, d.telefono, d.taller,
    d.horario, d.modalidad, d.nivel_experiencia);

  return res.status(201).json({
    mensaje: "¡Inscripción registrada con éxito!",
    registro: obtenerPorId(Number(info.lastInsertRowid))
  });
});

app.put("/api/inscripciones/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "El identificador no es válido." });
  }
  if (!obtenerPorId(id)) {
    return res.status(404).json({ error: "No se encontró la inscripción solicitada." });
  }

  const resultado = validar(req.body || {});
  if (resultado.error) {
    return res.status(400).json({ error: "Error de validación", mensaje: resultado.error });
  }

  const d = resultado.datos;
  db.prepare(`
    UPDATE inscripciones
    SET nombre = ?, correo = ?, telefono = ?, taller = ?, horario = ?,
        modalidad = ?, nivel_experiencia = ?
    WHERE id = ?
  `).run(d.nombre, d.correo, d.telefono, d.taller, d.horario,
    d.modalidad, d.nivel_experiencia, id);

  res.json({ mensaje: "Inscripción actualizada correctamente.", registro: obtenerPorId(id) });
});

app.delete("/api/inscripciones/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "El identificador no es válido." });
  }
  const info = db.prepare("DELETE FROM inscripciones WHERE id = ?").run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: "No se encontró la inscripción solicitada." });
  }
  res.json({ mensaje: "Inscripción eliminada correctamente." });
});

app.get("/api/reportes/resumen", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS total FROM inscripciones").get().total;
  const porTaller = db.prepare(`
    SELECT taller AS nombre, COUNT(*) AS total
    FROM inscripciones GROUP BY taller ORDER BY total DESC, taller
  `).all();
  const porHorario = db.prepare(`
    SELECT horario AS nombre, COUNT(*) AS total
    FROM inscripciones GROUP BY horario ORDER BY horario
  `).all();
  const porModalidad = db.prepare(`
    SELECT modalidad AS nombre, COUNT(*) AS total
    FROM inscripciones GROUP BY modalidad ORDER BY modalidad
  `).all();

  res.json({ total, porTaller, porHorario, porModalidad });
});

// Respuestas JSON para errores inesperados y rutas API inexistentes.
app.use("/api", (req, res) => res.status(404).json({ error: "Ruta API no encontrada." }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Ocurrió un error interno en el servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor disponible en http://localhost:${PORT}`);
});
