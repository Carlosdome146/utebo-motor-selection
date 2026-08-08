const AIRTABLE_TABLE = "Vehículos";
const AIRTABLE_VIEW = "WEB - Publicados";

const MAX_FOTOS_POR_MIGRACION = 20;


// ============================================================
// WORKER
// ============================================================

export default {

  async fetch(request, env) {

    const url = new URL(request.url);


    // ========================================================
    // TEST SIMPLE
    // ========================================================

    if (url.pathname === "/api/test") {

      return Response.json({
        ok: true,
        proyecto: "Utebo Motor Selection"
      });

    }


    // ========================================================
    // TEST D1 + R2
    // ========================================================

    if (url.pathname === "/api/storage-test") {

      try {

        const dbTest = await env.DB
          .prepare("SELECT COUNT(*) AS total FROM vehiculos")
          .first();


        const r2Test = await env.IMAGES.list({
          limit: 1
        });


        return Response.json({

          ok: true,

          d1: {
            conectado: true,
            vehiculos: dbTest?.total ?? 0
          },

          r2: {
            conectado: true,
            objetos: r2Test.objects.length
          }

        });

      } catch (error) {

        return Response.json(
          {
            ok: false,
            error: error.message
          },
          {
            status: 500
          }
        );

      }

    }


    // ========================================================
    // MIGRACIÓN AIRTABLE -> D1 + R2
    // ========================================================

    if (url.pathname === "/api/migracion-airtable") {

      return gestionarMigracion(request, env);

    }


    // ========================================================
    // CATÁLOGO PÚBLICO
    //
    // IMPORTANTE:
    // De momento sigue leyendo Airtable.
    // Cuando validemos la migración lo cambiaremos a D1.
    // ========================================================

    if (url.pathname === "/api/vehiculos") {

      return obtenerVehiculosAirtable(env);

    }


    // ========================================================
    // WEB ESTÁTICA
    // ========================================================

    return env.ASSETS.fetch(request);

  }

};


// ============================================================
// CATÁLOGO ACTUAL DESDE AIRTABLE
// ============================================================

async function obtenerVehiculosAirtable(env) {

  try {

    if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE_ID) {

      return Response.json(
        {
          ok: false,
          error: "Configuración de Airtable incompleta"
        },
        {
          status: 500
        }
      );

    }


    const tabla =
      encodeURIComponent(AIRTABLE_TABLE);

    const vista =
      encodeURIComponent(AIRTABLE_VIEW);


    const airtableUrl =
      `https://api.airtable.com/v0/` +
      `${env.AIRTABLE_BASE_ID}/` +
      `${tabla}` +
      `?view=${vista}` +
      `&pageSize=100`;


    const response =
      await fetch(
        airtableUrl,
        {
          headers: {
            Authorization:
              `Bearer ${env.AIRTABLE_TOKEN}`
          }
        }
      );


    if (!response.ok) {

      console.error(
        "Error Airtable:",
        response.status,
        await response.text()
      );


      return Response.json(
        {
          ok: false,
          error: "No se pudo cargar el catálogo"
        },
        {
          status: 502
        }
      );

    }


    const data =
      await response.json();


    const vehiculos =
      data.records
        .map((record) => {

          const f =
            record.fields;


          return {

            id:
              record.id,

            vehiculo:
              f["Vehículo"] || "",

            estado:
              f["Estado"] || "Disponible",

            destacado:
              Boolean(f["Destacado"]),

            marca:
              f["Marca"] || "",

            modelo:
              f["Modelo"] || "",

            version:
              f["Versión"] || "",

            precio:
              f["Precio"] ?? null,

            ano:
              f["Año"] ?? null,

            kilometros:
              f["Kilómetros"] ?? null,

            combustible:
              f["Combustible"] || "",

            cambio:
              f["Cambio"] || "",

            potencia:
              f["Potencia"] ?? null,

            procedencia:
              f["Procedencia"] || "",

            descripcion:
              f["Descripción"] || "",

            fotos:
              Array.isArray(f["Fotos"])
                ? f["Fotos"].map((foto) => ({
                    url:
                      foto.thumbnails?.large?.url ||
                      foto.thumbnails?.full?.url ||
                      foto.url,

                    nombre:
                      foto.filename || ""
                  }))
                : [],

            orden:
              f["Orden"] ?? 999

          };

        })

        .sort(
          (a, b) =>
            a.orden - b.orden
        );


    return Response.json(
      {
        ok: true,
        total: vehiculos.length,
        vehiculos
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );


  } catch (error) {

    console.error(
      "Error API vehículos:",
      error
    );


    return Response.json(
      {
        ok: false,
        error:
          "Error interno cargando vehículos"
      },
      {
        status: 500
      }
    );

  }

}


// ============================================================
// GESTIÓN DE MIGRACIÓN
// ============================================================

async function gestionarMigracion(request, env) {

  // ----------------------------------------------------------
  // SOLO POST
  // ----------------------------------------------------------

  if (request.method !== "POST") {

    return Response.json(
      {
        ok: false,
        error: "Método no permitido"
      },
      {
        status: 405
      }
    );

  }


  // ----------------------------------------------------------
  // SEGURIDAD
  // ----------------------------------------------------------

  const migrationKey =
    request.headers.get(
      "X-Migration-Key"
    );


  if (
    !env.MIGRATION_KEY ||
    migrationKey !== env.MIGRATION_KEY
  ) {

    return Response.json(
      {
        ok: false,
        error: "No autorizado"
      },
      {
        status: 401
      }
    );

  }


  try {

    const body =
      await request.json();


    // ========================================================
    // ACCIÓN: LISTAR VEHÍCULOS DE AIRTABLE
    // ========================================================

    if (body.action === "list") {

      const records =
        await obtenerTodosRegistrosAirtable(
          env
        );


      const vehiculos =
        records.map((record) => {

          const f =
            record.fields;


          return {

            id:
              record.id,

            vehiculo:
              f["Vehículo"] || "",

            publicado:
              Boolean(f["Publicado"]),

            estado:
              f["Estado"] || "",

            fotos:
              Array.isArray(f["Fotos"])
                ? f["Fotos"].length
                : 0

          };

        });


      return Response.json({
        ok: true,
        total: vehiculos.length,
        vehiculos
      });

    }


    // ========================================================
    // ACCIÓN: MIGRAR UN VEHÍCULO
    // ========================================================

    if (body.action === "migrate") {

      if (!body.recordId) {

        return Response.json(
          {
            ok: false,
            error:
              "Falta recordId"
          },
          {
            status: 400
          }
        );

      }


      const photoOffset =
        Math.max(
          0,
          Number(body.photoOffset) || 0
        );


      return await migrarVehiculo(
        env,
        body.recordId,
        photoOffset
      );

    }


    return Response.json(
      {
        ok: false,
        error:
          "Acción de migración desconocida"
      },
      {
        status: 400
      }
    );


  } catch (error) {

    console.error(
      "Error migración:",
      error
    );


    return Response.json(
      {
        ok: false,
        error: error.message
      },
      {
        status: 500
      }
    );

  }

}


// ============================================================
// OBTENER TODOS LOS REGISTROS DE AIRTABLE
// ============================================================

async function obtenerTodosRegistrosAirtable(env) {

  const registros = [];

  let offset = null;


  do {

    const tabla =
      encodeURIComponent(
        AIRTABLE_TABLE
      );


    let apiUrl =
      `https://api.airtable.com/v0/` +
      `${env.AIRTABLE_BASE_ID}/` +
      `${tabla}` +
      `?pageSize=100`;


    if (offset) {

      apiUrl +=
        `&offset=${encodeURIComponent(offset)}`;

    }


    const response =
      await fetch(
        apiUrl,
        {
          headers: {
            Authorization:
              `Bearer ${env.AIRTABLE_TOKEN}`
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        "No se pudieron leer los vehículos de Airtable"
      );

    }


    const data =
      await response.json();


    registros.push(
      ...(data.records || [])
    );


    offset =
      data.offset || null;


  } while (offset);


  return registros;

}


// ============================================================
// OBTENER UN VEHÍCULO CONCRETO DE AIRTABLE
// ============================================================

async function obtenerRegistroAirtable(
  env,
  recordId
) {

  const tabla =
    encodeURIComponent(
      AIRTABLE_TABLE
    );


  const url =
    `https://api.airtable.com/v0/` +
    `${env.AIRTABLE_BASE_ID}/` +
    `${tabla}/` +
    `${encodeURIComponent(recordId)}`;


  const response =
    await fetch(
      url,
      {
        headers: {
          Authorization:
            `Bearer ${env.AIRTABLE_TOKEN}`
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      `No se pudo leer ${recordId} desde Airtable`
    );

  }


  return await response.json();

}


// ============================================================
// MIGRAR VEHÍCULO
// ============================================================

async function migrarVehiculo(
  env,
  airtableId,
  photoOffset
) {

  // ----------------------------------------------------------
  // LEER AIRTABLE
  // ----------------------------------------------------------

  const record =
    await obtenerRegistroAirtable(
      env,
      airtableId
    );


  const f =
    record.fields;


  // ----------------------------------------------------------
  // INSERTAR / ACTUALIZAR D1
  // ----------------------------------------------------------

  await env.DB
    .prepare(`
      INSERT INTO vehiculos (

        airtable_id,
        vehiculo,

        publicado,
        estado,
        destacado,

        marca,
        modelo,
        version,

        precio,
        ano,
        kilometros,

        combustible,
        cambio,
        potencia,
        procedencia,

        descripcion,
        orden,

        updated_at

      )

      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        CURRENT_TIMESTAMP
      )

      ON CONFLICT(airtable_id)

      DO UPDATE SET

        vehiculo = excluded.vehiculo,

        publicado = excluded.publicado,
        estado = excluded.estado,
        destacado = excluded.destacado,

        marca = excluded.marca,
        modelo = excluded.modelo,
        version = excluded.version,

        precio = excluded.precio,
        ano = excluded.ano,
        kilometros = excluded.kilometros,

        combustible = excluded.combustible,
        cambio = excluded.cambio,
        potencia = excluded.potencia,
        procedencia = excluded.procedencia,

        descripcion = excluded.descripcion,
        orden = excluded.orden,

        updated_at = CURRENT_TIMESTAMP

    `)

    .bind(

      record.id,

      f["Vehículo"] || "Vehículo",

      f["Publicado"] ? 1 : 0,

      f["Estado"] || "Disponible",

      f["Destacado"] ? 1 : 0,

      f["Marca"] || null,

      f["Modelo"] || null,

      f["Versión"] || null,

      f["Precio"] ?? null,

      f["Año"] ?? null,

      f["Kilómetros"] ?? null,

      f["Combustible"] || null,

      f["Cambio"] || null,

      f["Potencia"] ?? null,

      f["Procedencia"] || null,

      f["Descripción"] || null,

      f["Orden"] ?? 999

    )

    .run();


  // ----------------------------------------------------------
  // OBTENER ID D1
  // ----------------------------------------------------------

  const vehiculoD1 =
    await env.DB
      .prepare(`
        SELECT id
        FROM vehiculos
        WHERE airtable_id = ?
      `)

      .bind(record.id)

      .first();


  if (!vehiculoD1) {

    throw new Error(
      "No se ha podido obtener el ID D1"
    );

  }


  const vehiculoId =
    vehiculoD1.id;


  // ----------------------------------------------------------
  // FOTOS AIRTABLE
  // ----------------------------------------------------------

  const fotos =
    Array.isArray(f["Fotos"])
      ? f["Fotos"]
      : [];


  const fotosLote =
    fotos.slice(
      photoOffset,
      photoOffset +
        MAX_FOTOS_POR_MIGRACION
    );


  let migradas = 0;


  for (
    let i = 0;
    i < fotosLote.length;
    i++
  ) {

    const foto =
      fotosLote[i];


    const posicion =
      photoOffset + i;


    await migrarFoto(
      env,
      vehiculoId,
      foto,
      posicion
    );


    migradas++;

  }


  const siguienteOffset =
    photoOffset +
      fotosLote.length <
    fotos.length

      ? photoOffset +
          fotosLote.length

      : null;


  return Response.json({

    ok: true,

    airtableId:
      record.id,

    vehiculoId,

    vehiculo:
      f["Vehículo"] || "",

    fotosTotales:
      fotos.length,

    fotosProcesadas:
      migradas,

    photoOffset,

    nextOffset:
      siguienteOffset

  });

}


// ============================================================
// MIGRAR FOTO A R2
// ============================================================

async function migrarFoto(
  env,
  vehiculoId,
  foto,
  posicion
) {

  const attachmentId =
    foto.id ||
    `foto-${posicion + 1}`;


  const extension =
    obtenerExtension(
      foto.filename,
      foto.type
    );


  const r2Key =
    `vehiculos/` +
    `${vehiculoId}/` +
    `${attachmentId}.${extension}`;


  // ----------------------------------------------------------
  // COMPROBAR SI YA ESTÁ MIGRADA
  // ----------------------------------------------------------

  const existente =
    await env.DB
      .prepare(`
        SELECT id
        FROM fotos_vehiculos
        WHERE r2_key = ?
      `)

      .bind(r2Key)

      .first();


  if (existente) {

    // Actualizamos orden por si ha cambiado
    await env.DB
      .prepare(`
        UPDATE fotos_vehiculos

        SET
          orden = ?,
          nombre_archivo = ?,
          mime_type = ?

        WHERE r2_key = ?
      `)

      .bind(
        posicion,
        foto.filename || null,
        foto.type || null,
        r2Key
      )

      .run();


    return;

  }


  // ----------------------------------------------------------
  // DESCARGAR FOTO DE AIRTABLE
  // ----------------------------------------------------------

  const fotoResponse =
    await fetch(
      foto.url,
      {
        redirect: "follow"
      }
    );


  if (!fotoResponse.ok) {

    throw new Error(
      `Error descargando foto ${foto.filename || attachmentId}`
    );

  }


  const contentType =
    fotoResponse.headers.get(
      "content-type"
    ) ||
    foto.type ||
    "application/octet-stream";


  // ----------------------------------------------------------
  // GUARDAR EN R2
  // ----------------------------------------------------------

  await env.IMAGES.put(

    r2Key,

    fotoResponse.body,

    {
      httpMetadata: {

        contentType,

        cacheControl:
          "public, max-age=31536000, immutable"

      }
    }

  );


  // ----------------------------------------------------------
  // GUARDAR RELACIÓN EN D1
  // ----------------------------------------------------------

  await env.DB
    .prepare(`
      INSERT OR IGNORE
      INTO fotos_vehiculos (

        vehiculo_id,
        r2_key,
        nombre_archivo,
        mime_type,
        orden

      )

      VALUES (?, ?, ?, ?, ?)
    `)

    .bind(

      vehiculoId,

      r2Key,

      foto.filename || null,

      contentType,

      posicion

    )

    .run();

}


// ============================================================
// EXTENSIÓN DE ARCHIVO
// ============================================================

function obtenerExtension(
  filename,
  mimeType
) {

  if (
    filename &&
    filename.includes(".")
  ) {

    const extension =
      filename
        .split(".")
        .pop()
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ""
        );


    if (extension) {

      return extension;

    }

  }


  switch (mimeType) {

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/gif":
      return "gif";

    case "image/avif":
      return "avif";

    default:
      return "jpg";

  }

}
