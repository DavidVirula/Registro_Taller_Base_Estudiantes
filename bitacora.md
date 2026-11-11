# Bitácora de desarrollo

## Objetivo
Completar el sistema de registro de participantes del taller a partir del proyecto base, conservando su estructura visual y agregando persistencia, administración de registros y reportes.

## Cambios realizados

1. Se conservaron el encabezado, los paneles, la paleta de colores y la distribución general de la interfaz original.
2. Se completó el formulario con teléfono, horario, modalidad y nivel de experiencia.
3. Se corrigieron los valores de las opciones del horario para que cada opción envíe su propio texto.
4. Se implementó la validación del lado del navegador y del servidor, incluyendo formato de correo y campos obligatorios.
5. Se agregó `database.js`, que crea automáticamente la base SQLite y la tabla `inscripciones`.
6. Se implementaron las rutas GET, POST, PUT y DELETE para administrar los registros.
7. Se agregó la edición y eliminación desde la lista de participantes.
8. Se agregó el reporte de total de participantes y agrupaciones por taller, horario y modalidad.
9. Se amplió el diseño adaptable para teléfonos.
10. Se actualizó el README y se excluyeron la base de datos local y dependencias instaladas del repositorio.

## Verificaciones realizadas

- Revisión de sintaxis de los archivos JavaScript.
- Prueba de creación, lectura, actualización y eliminación de registros mediante la API.
- Prueba de validación de campos obligatorios y correo electrónico.
- Prueba de persistencia después de reiniciar el servidor.
- Prueba de los totales y agrupaciones de reportes.

## Consideraciones para la entrega

- Ejecutar `npm install` en el equipo donde se vaya a utilizar.
- Iniciar con `npm start`.
- Adjuntar capturas de pantalla propias del sistema funcionando y el enlace del repositorio GitHub, según las indicaciones de entrega de la clase.
- No se incluyen `node_modules` ni el archivo de base de datos, porque se generan/instalan localmente.
