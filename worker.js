// ============================================================
// WORKER
// ============================================================

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

// ============================================================
// ADMIN
// ============================================================

if (
  url.pathname ===
  "/admin/api/fotos"
) {
  return adminFotos(
    request,
    env
  );
}
    
if (
  url.pathname ===
  "/admin/api/vehiculo"
) {

  return adminVehiculo(
    request,
    env
  );

}
    

if (
  url.pathname ===
  "/admin/api/login"
) {

  return adminLogin(
    request,
    env
  );

}


if (
  url.pathname ===
  "/admin/api/logout"
) {

  return adminLogout(
    request
  );

}


if (
  url.pathname ===
  "/admin/api/session"
) {

  return adminSession(
    request,
    env
  );

}


if (
  url.pathname ===
  "/admin/api/vehiculos"
) {

  return adminVehiculos(
    request,
    env
  );

}
    

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
    // CATÁLOGO PÚBLICO - D1 + R2
    // ========================================================

    if (url.pathname === "/api/vehiculos") {
  return obtenerVehiculosD1(env);
}

// ========================================================
// REPOSICIONES PÚBLICAS - D1 + R2
// ========================================================

if (url.pathname === "/api/reposiciones") {

  return obtenerReposicionesD1(env);

}
    
// ============================================================
// IMÁGENES PRIVADAS DESDE R2
// ============================================================

if (url.pathname.startsWith("/media/")) {
  return servirImagenR2(url, env);
}
    
    return env.ASSETS.fetch(request);

  }

};

// ============================================================
// OBTENER VEHÍCULOS DESDE D1
// ============================================================

async function obtenerVehiculosD1(env) {

  try {

    const consulta =
      await env.DB
        .prepare(`
          SELECT

            v.id,
            v.vehiculo,
            v.publicado,
            v.estado,
            v.destacado,

            v.marca,
            v.modelo,
            v.version,

            v.precio,
            v.ano,
            v.kilometros,

            v.combustible,
            v.cambio,
            v.potencia,
            v.procedencia,

            v.descripcion,
            v.orden,

            f.id AS foto_id,
            f.r2_key,
            f.nombre_archivo,
            f.mime_type,
            f.orden AS foto_orden

          FROM vehiculos v

          LEFT JOIN fotos_vehiculos f
            ON f.vehiculo_id = v.id

          WHERE
            v.publicado = 1

            AND (
              v.estado IS NULL
              OR v.estado <> 'Vendido'
            )

          ORDER BY
            v.orden ASC,
            v.id ASC,
            f.orden ASC,
            f.id ASC
        `)

        .all();


    const mapaVehiculos =
      new Map();


    for (
      const fila
      of consulta.results || []
    ) {

      if (
        !mapaVehiculos.has(
          fila.id
        )
      ) {

        mapaVehiculos.set(
          fila.id,
          {

            id:
              String(fila.id),

            vehiculo:
              fila.vehiculo || "",

            estado:
              fila.estado || "Disponible",

            destacado:
              Boolean(
                fila.destacado
              ),

            marca:
              fila.marca || "",

            modelo:
              fila.modelo || "",

            version:
              fila.version || "",

            precio:
              fila.precio ?? null,

            ano:
              fila.ano ?? null,

            kilometros:
              fila.kilometros ?? null,

            combustible:
              fila.combustible || "",

            cambio:
              fila.cambio || "",

            potencia:
              fila.potencia ?? null,

            procedencia:
              fila.procedencia || "",

            descripcion:
              fila.descripcion || "",

            orden:
              fila.orden ?? 999,

            fotos: []

          }
        );

      }


      // ------------------------------------------------------
      // AÑADIR FOTOGRAFÍA
      // ------------------------------------------------------

      if (fila.r2_key) {

        const vehiculo =
          mapaVehiculos.get(
            fila.id
          );


        vehiculo.fotos.push({

          url:
            rutaPublicaR2(
              fila.r2_key
            ),

          nombre:
            fila.nombre_archivo || ""

        });

      }

    }


    const vehiculos =
      Array.from(
        mapaVehiculos.values()
      );


    return Response.json(
      {
        ok: true,
        total:
          vehiculos.length,
        vehiculos
      },
      {
        headers: {
          "Cache-Control":
            "no-store"
        }
      }
    );


  } catch (error) {

    console.error(
      "Error obteniendo vehículos D1:",
      error
    );


    return Response.json(
      {
        ok: false,
        error:
          "No se pudo cargar el catálogo desde D1"
      },
      {
        status: 500
      }
    );

  }

}


// ============================================================
// OBTENER REPOSICIONES DESDE D1
// ============================================================

async function obtenerReposicionesD1(
  env
) {

  try {

    const consulta =
      await env.DB
        .prepare(`
          SELECT

            r.id,
            r.nombre,
            r.precio,
            r.publicado,
            r.orden,

            f.id AS foto_id,
            f.r2_key,
            f.nombre_archivo,
            f.mime_type,
            f.orden AS foto_orden

          FROM reposiciones r

          LEFT JOIN fotos_reposiciones f
            ON f.reposicion_id = r.id

          WHERE
            r.publicado = 1

          ORDER BY
            r.orden ASC,
            r.id ASC,
            f.orden ASC,
            f.id ASC
        `)

        .all();


    const mapaReposiciones =
      new Map();


    for (
      const fila
      of consulta.results || []
    ) {

      if (
        !mapaReposiciones.has(
          fila.id
        )
      ) {

        mapaReposiciones.set(
          fila.id,
          {

            id:
              String(fila.id),

            nombre:
              fila.nombre || "",

            precio:
              fila.precio ?? null,

            orden:
              fila.orden ?? 999,

            fotos: []

          }
        );

      }


      // ------------------------------------------------------
      // AÑADIR FOTOGRAFÍA
      // ------------------------------------------------------

      if (fila.r2_key) {

        const reposicion =
          mapaReposiciones.get(
            fila.id
          );


        reposicion.fotos.push({

          id:
            fila.foto_id,

          url:
            rutaPublicaR2(
              fila.r2_key
            ),

          nombre:
            fila.nombre_archivo || ""

        });

      }

    }


    const reposiciones =
      Array.from(
        mapaReposiciones.values()
      );


    return Response.json(
      {
        ok: true,
        total:
          reposiciones.length,
        reposiciones
      },
      {
        headers: {
          "Cache-Control":
            "no-store"
        }
      }
    );


  } catch (error) {

    console.error(
      "Error obteniendo reposiciones D1:",
      error
    );


    return Response.json(
      {
        ok: false,
        error:
          "No se pudieron cargar las reposiciones"
      },
      {
        status: 500
      }
    );

  }

}

// ============================================================
// SERVIR IMÁGENES DESDE R2
// ============================================================

async function servirImagenR2(url, env) {

  try {

    const ruta =
      url.pathname.substring(
        "/media/".length
      );


    if (!ruta) {

      return new Response(
        "Imagen no encontrada",
        {
          status: 404
        }
      );

    }


    const key =
      decodeURIComponent(ruta);


    const objeto =
      await env.IMAGES.get(key);


    if (!objeto) {

      return new Response(
        "Imagen no encontrada",
        {
          status: 404
        }
      );

    }


    const headers =
      new Headers();


    // Recuperar metadatos HTTP guardados en R2
    objeto.writeHttpMetadata(headers);


    // ETag para caché del navegador
    headers.set(
      "ETag",
      objeto.httpEtag
    );


    // Seguridad básica
    headers.set(
      "X-Content-Type-Options",
      "nosniff"
    );


    // Las imágenes migradas usan claves únicas,
    // así que pueden cachearse durante mucho tiempo.
    if (!headers.has("Cache-Control")) {

      headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );

    }


    return new Response(
      objeto.body,
      {
        headers
      }
    );


  } catch (error) {

    console.error(
      "Error obteniendo imagen R2:",
      error
    );


    return new Response(
      "Error cargando imagen",
      {
        status: 500
      }
    );

  }

}

// ============================================================
// ADMIN - LOGIN
// ============================================================

async function adminLogin(
  request,
  env
) {

  if (request.method !== "POST") {

    return Response.json(
      {
        ok: false,
        error:
          "Método no permitido"
      },
      {
        status: 405
      }
    );

  }


  try {

    const body =
      await request.json();


    const password =
      String(
        body.password || ""
      );


    if (
      !env.ADMIN_PASSWORD ||
      !env.ADMIN_SESSION_SECRET
    ) {

      return Response.json(
        {
          ok: false,
          error:
            "Administración no configurada"
        },
        {
          status: 500
        }
      );

    }


    const correcto =
      await compararSeguro(
        password,
        env.ADMIN_PASSWORD
      );


    if (!correcto) {

      return Response.json(
        {
          ok: false,
          error:
            "Contraseña incorrecta"
        },
        {
          status: 401
        }
      );

    }


    const expira =
      Date.now() +
      (
        8 *
        60 *
        60 *
        1000
      );


    const payload =
      String(expira);


    const firma =
      await firmarAdmin(
        payload,
        env.ADMIN_SESSION_SECRET
      );


    const cookie =
      `utebo_admin=` +
      `${payload}.${firma}; ` +
      `Path=/admin; ` +
      `HttpOnly; ` +
      `Secure; ` +
      `SameSite=Strict; ` +
      `Max-Age=28800`;


    return Response.json(
      {
        ok: true
      },
      {
        headers: {
          "Set-Cookie":
            cookie,

          "Cache-Control":
            "no-store"
        }
      }
    );


  } catch (error) {

    return Response.json(
      {
        ok: false,
        error:
          "Error iniciando sesión"
      },
      {
        status: 500
      }
    );

  }

}



// ============================================================
// ADMIN - LOGOUT
// ============================================================

function adminLogout(
  request
) {

  if (request.method !== "POST") {

    return Response.json(
      {
        ok: false
      },
      {
        status: 405
      }
    );

  }


  return Response.json(
    {
      ok: true
    },
    {
      headers: {

        "Set-Cookie":
          "utebo_admin=; " +
          "Path=/admin; " +
          "HttpOnly; " +
          "Secure; " +
          "SameSite=Strict; " +
          "Max-Age=0",

        "Cache-Control":
          "no-store"

      }
    }
  );

}



// ============================================================
// ADMIN - SESIÓN
// ============================================================

async function adminSession(
  request,
  env
) {

  const autorizado =
    await adminAutorizado(
      request,
      env
    );


  if (!autorizado) {

    return Response.json(
      {
        ok: false
      },
      {
        status: 401,
        headers: {
          "Cache-Control":
            "no-store"
        }
      }
    );

  }


  return Response.json(
    {
      ok: true
    },
    {
      headers: {
        "Cache-Control":
          "no-store"
      }
    }
  );

}



// ============================================================
// ADMIN - LISTADO VEHÍCULOS
// ============================================================

async function adminVehiculos(
  request,
  env
) {

  if (request.method !== "GET") {

    return Response.json(
      {
        ok: false
      },
      {
        status: 405
      }
    );

  }


  const autorizado =
    await adminAutorizado(
      request,
      env
    );


  if (!autorizado) {

    return Response.json(
      {
        ok: false,
        error:
          "No autorizado"
      },
      {
        status: 401
      }
    );

  }


  try {

    const resultado =
      await env.DB
        .prepare(`
          SELECT

            v.id,
            v.vehiculo,

            v.publicado,
            v.estado,
            v.destacado,

            v.marca,
            v.modelo,
            v.version,

            v.precio,
            v.ano,
            v.kilometros,

            v.combustible,
            v.cambio,
            v.potencia,
            v.procedencia,

            v.descripcion,
            v.orden,

            COUNT(f.id)
              AS fotos

          FROM vehiculos v

          LEFT JOIN
            fotos_vehiculos f

          ON
            f.vehiculo_id =
            v.id

          GROUP BY
            v.id

          ORDER BY
            v.orden ASC,
            v.id ASC
        `)

        .all();


    const vehiculos =
      (
        resultado.results || []
      ).map(
        v => ({

          ...v,

          publicado:
            Boolean(v.publicado),

          destacado:
            Boolean(v.destacado),

          fotos:
            Number(v.fotos || 0)

        })
      );


    return Response.json(
      {
        ok: true,
        total:
          vehiculos.length,
        vehiculos
      },
      {
        headers: {
          "Cache-Control":
            "no-store"
        }
      }
    );


  } catch (error) {

    console.error(
      "Admin vehículos:",
      error
    );


    return Response.json(
      {
        ok: false,
        error:
          "No se pudieron cargar los vehículos"
      },
      {
        status: 500
      }
    );

  }

}



// ============================================================
// ADMIN - VALIDAR SESIÓN
// ============================================================

async function adminAutorizado(
  request,
  env
) {

  if (
    !env.ADMIN_SESSION_SECRET
  ) {

    return false;

  }


  const cookies =
    request.headers.get(
      "Cookie"
    ) || "";


  const cookie =
    cookies
      .split(";")
      .map(
        item =>
          item.trim()
      )
      .find(
        item =>
          item.startsWith(
            "utebo_admin="
          )
      );


  if (!cookie) {

    return false;

  }


  const value =
    cookie.substring(
      "utebo_admin=".length
    );


  const punto =
    value.indexOf(".");


  if (punto === -1) {

    return false;

  }


  const payload =
    value.substring(
      0,
      punto
    );


  const firma =
    value.substring(
      punto + 1
    );


  const expiracion =
    Number(payload);


  if (
    !Number.isFinite(
      expiracion
    ) ||
    Date.now() >
      expiracion
  ) {

    return false;

  }


  const firmaEsperada =
    await firmarAdmin(
      payload,
      env.ADMIN_SESSION_SECRET
    );


  return compararSeguro(
    firma,
    firmaEsperada
  );

}



// ============================================================
// ADMIN - FIRMA HMAC
// ============================================================

async function firmarAdmin(
  contenido,
  secreto
) {

  const encoder =
    new TextEncoder();


  const key =
    await crypto.subtle.importKey(

      "raw",

      encoder.encode(
        secreto
      ),

      {
        name: "HMAC",
        hash: "SHA-256"
      },

      false,

      ["sign"]

    );


  const firma =
    await crypto.subtle.sign(

      "HMAC",

      key,

      encoder.encode(
        contenido
      )

    );


  return bytesToBase64Url(
    new Uint8Array(
      firma
    )
  );

}



// ============================================================
// ADMIN - COMPARACIÓN SEGURA
// ============================================================

async function compararSeguro(
  a,
  b
) {

  const encoder =
    new TextEncoder();


  const hashA =
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(
          String(a)
        )
      )
    );


  const hashB =
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(
          String(b)
        )
      )
    );


  if (
    hashA.length !==
    hashB.length
  ) {

    return false;

  }


  let diferencia = 0;


  for (
    let i = 0;
    i < hashA.length;
    i++
  ) {

    diferencia |=
      hashA[i] ^
      hashB[i];

  }


  return diferencia === 0;

}



// ============================================================
// BASE64 URL
// ============================================================

function bytesToBase64Url(
  bytes
) {

  let binary = "";


  for (
    const byte of bytes
  ) {

    binary +=
      String.fromCharCode(
        byte
      );

  }


  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

}

// ============================================================
// ADMIN - OBTENER / CREAR / EDITAR / ELIMINAR VEHÍCULO
// ============================================================

async function adminVehiculo(
  request,
  env
) {

  // ----------------------------------------------------------
  // COMPROBAR SESIÓN
  // ----------------------------------------------------------

  const autorizado =
    await adminAutorizado(
      request,
      env
    );

  if (!autorizado) {

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


  // ==========================================================
  // GET - OBTENER VEHÍCULO
  // ==========================================================

  if (request.method === "GET") {

    const url =
      new URL(request.url);


    const id =
      Number(
        url.searchParams.get("id")
      );


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return Response.json(
        {
          ok: false,
          error:
            "ID de vehículo incorrecto"
        },
        {
          status: 400
        }
      );

    }


    const vehiculo =
      await obtenerVehiculoAdmin(
        env,
        id
      );


    if (!vehiculo) {

      return Response.json(
        {
          ok: false,
          error:
            "Vehículo no encontrado"
        },
        {
          status: 404
        }
      );

    }


    return Response.json(
      {
        ok: true,
        vehiculo
      },
      {
        headers: {
          "Cache-Control":
            "no-store"
        }
      }
    );

  }


  // ==========================================================
  // SOLO PERMITIMOS POST / PUT / DELETE
  // ==========================================================

  if (
    request.method !== "POST" &&
    request.method !== "PUT" &&
    request.method !== "DELETE"
  ) {

    return Response.json(
      {
        ok: false,
        error:
          "Método no permitido"
      },
      {
        status: 405
      }
    );

  }


  // ==========================================================
  // SEGURIDAD DE ESCRITURA
  // ==========================================================

  if (
    !origenAdminValido(
      request
    )
  ) {

    return Response.json(
      {
        ok: false,
        error:
          "Origen no permitido"
      },
      {
        status: 403
      }
    );

  }


  // ==========================================================
  // LEER BODY
  // ==========================================================

  let body;


  try {

    body =
      await request.json();

  } catch {

    return Response.json(
      {
        ok: false,
        error:
          "Datos incorrectos"
      },
      {
        status: 400
      }
    );

  }


  // ==========================================================
  // DELETE - ELIMINAR VEHÍCULO
  // ==========================================================

  if (
    request.method === "DELETE"
  ) {

    const id =
      Number(
        body.id
      );


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return Response.json(
        {
          ok: false,
          error:
            "ID incorrecto"
        },
        {
          status: 400
        }
      );

    }


    try {

      // ------------------------------------------------------
      // COMPROBAR QUE EXISTE
      // ------------------------------------------------------

      const vehiculo =
        await env.DB
          .prepare(`
            SELECT
              id,
              vehiculo

            FROM vehiculos

            WHERE id = ?

            LIMIT 1
          `)

          .bind(id)

          .first();


      if (!vehiculo) {

        return Response.json(
          {
            ok: false,
            error:
              "Vehículo no encontrado"
          },
          {
            status: 404
          }
        );

      }


      // ------------------------------------------------------
      // OBTENER FOTOS
      // ------------------------------------------------------

      const fotosResultado =
        await env.DB
          .prepare(`
            SELECT
              r2_key

            FROM fotos_vehiculos

            WHERE vehiculo_id = ?
          `)

          .bind(id)

          .all();


      const fotos =
        fotosResultado.results || [];


      // ------------------------------------------------------
      // ELIMINAR DE D1
      // ------------------------------------------------------

      await env.DB.batch([

        env.DB
          .prepare(`
            DELETE FROM fotos_vehiculos
            WHERE vehiculo_id = ?
          `)
          .bind(id),

        env.DB
          .prepare(`
            DELETE FROM vehiculos
            WHERE id = ?
          `)
          .bind(id)

      ]);


      // ------------------------------------------------------
      // ELIMINAR FOTOS DE R2
      // ------------------------------------------------------

      for (
        const foto of fotos
      ) {

        try {

          await env.IMAGES.delete(
            foto.r2_key
          );

        } catch (error) {

          console.error(
            "No se pudo borrar objeto R2:",
            foto.r2_key,
            error
          );

        }

      }


      return Response.json({
        ok: true,
        eliminado: id,
        vehiculo:
          vehiculo.vehiculo,
        fotosEliminadas:
          fotos.length
      });


    } catch (error) {

      console.error(
        "Eliminar vehículo:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo eliminar el vehículo"
        },
        {
          status: 500
        }
      );

    }

  }


  // ==========================================================
  // POST / PUT: NORMALIZAR DATOS
  // ==========================================================

  const datos =
    normalizarDatosVehiculo(
      body
    );


  if (!datos.vehiculo) {

    return Response.json(
      {
        ok: false,
        error:
          "El nombre del vehículo es obligatorio"
      },
      {
        status: 400
      }
    );

  }


  // ==========================================================
  // POST - CREAR VEHÍCULO
  // ==========================================================

  if (
    request.method === "POST"
  ) {

    try {

      const resultado =
        await env.DB
          .prepare(`
            INSERT INTO vehiculos (

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
              ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?, ?,
              CURRENT_TIMESTAMP
            )
          `)

          .bind(

            datos.vehiculo,

            datos.publicado,
            datos.estado,
            datos.destacado,

            datos.marca,
            datos.modelo,
            datos.version,

            datos.precio,
            datos.ano,
            datos.kilometros,

            datos.combustible,
            datos.cambio,
            datos.potencia,
            datos.procedencia,

            datos.descripcion,
            datos.orden

          )

          .run();


      const id =
        Number(
          resultado.meta
            ?.last_row_id
        );


      if (!id) {

        throw new Error(
          "No se ha podido obtener el ID del vehículo"
        );

      }


      const vehiculo =
        await obtenerVehiculoAdmin(
          env,
          id
        );


      return Response.json({
        ok: true,
        accion:
          "creado",
        vehiculo
      });


    } catch (error) {

      console.error(
        "Crear vehículo:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo crear el vehículo"
        },
        {
          status: 500
        }
      );

    }

  }


  // ==========================================================
  // PUT - ACTUALIZAR VEHÍCULO
  // ==========================================================

  if (
    request.method === "PUT"
  ) {

    const id =
      Number(
        body.id
      );


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return Response.json(
        {
          ok: false,
          error:
            "ID incorrecto"
        },
        {
          status: 400
        }
      );

    }


    try {

      const resultado =
        await env.DB
          .prepare(`
            UPDATE vehiculos

            SET

              vehiculo = ?,

              publicado = ?,
              estado = ?,
              destacado = ?,

              marca = ?,
              modelo = ?,
              version = ?,

              precio = ?,
              ano = ?,
              kilometros = ?,

              combustible = ?,
              cambio = ?,
              potencia = ?,
              procedencia = ?,

              descripcion = ?,
              orden = ?,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = ?
          `)

          .bind(

            datos.vehiculo,

            datos.publicado,
            datos.estado,
            datos.destacado,

            datos.marca,
            datos.modelo,
            datos.version,

            datos.precio,
            datos.ano,
            datos.kilometros,

            datos.combustible,
            datos.cambio,
            datos.potencia,
            datos.procedencia,

            datos.descripcion,
            datos.orden,

            id

          )

          .run();


      if (
        Number(
          resultado.meta
            ?.changes || 0
        ) === 0
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Vehículo no encontrado"
          },
          {
            status: 404
          }
        );

      }


      const vehiculo =
        await obtenerVehiculoAdmin(
          env,
          id
        );


      return Response.json({
        ok: true,
        accion:
          "actualizado",
        vehiculo
      });


    } catch (error) {

      console.error(
        "Actualizar vehículo:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo actualizar el vehículo"
        },
        {
          status: 500
        }
      );

    }

  }


  return Response.json(
    {
      ok: false,
      error:
        "Método no permitido"
    },
    {
      status: 405
    }
  );

}

// ============================================================
// ADMIN - LEER UN VEHÍCULO
// ============================================================

async function obtenerVehiculoAdmin(
  env,
  id
) {

  const v =
    await env.DB
      .prepare(`
        SELECT

          v.id,
          v.vehiculo,

          v.publicado,
          v.estado,
          v.destacado,

          v.marca,
          v.modelo,
          v.version,

          v.precio,
          v.ano,
          v.kilometros,

          v.combustible,
          v.cambio,
          v.potencia,
          v.procedencia,

          v.descripcion,
          v.orden,

          (
            SELECT COUNT(*)

            FROM fotos_vehiculos f

            WHERE
              f.vehiculo_id =
              v.id
          ) AS fotos

        FROM vehiculos v

        WHERE
          v.id = ?

        LIMIT 1
      `)

      .bind(id)

      .first();


  if (!v) {

    return null;

  }


  return {

    ...v,

    publicado:
      Boolean(v.publicado),

    destacado:
      Boolean(v.destacado),

    fotos:
      Number(v.fotos || 0)

  };

}



// ============================================================
// ADMIN - NORMALIZAR DATOS
// ============================================================

function normalizarDatosVehiculo(
  body
) {

  const estadosPermitidos = [
    "Disponible",
    "Reservado",
    "Vendido"
  ];


  let estado =
    textoAdmin(
      body.estado
    );


  if (
    !estadosPermitidos.includes(
      estado
    )
  ) {

    estado =
      "Disponible";

  }


  return {

    vehiculo:
      textoAdmin(
        body.vehiculo
      ),

    publicado:
      body.publicado
        ? 1
        : 0,

    estado,

    destacado:
      body.destacado
        ? 1
        : 0,

    marca:
      textoNullableAdmin(
        body.marca
      ),

    modelo:
      textoNullableAdmin(
        body.modelo
      ),

    version:
      textoNullableAdmin(
        body.version
      ),

    precio:
      numeroNullableAdmin(
        body.precio
      ),

    ano:
      numeroNullableAdmin(
        body.ano
      ),

    kilometros:
      numeroNullableAdmin(
        body.kilometros
      ),

    combustible:
      textoNullableAdmin(
        body.combustible
      ),

    cambio:
      textoNullableAdmin(
        body.cambio
      ),

    potencia:
      numeroNullableAdmin(
        body.potencia
      ),

    procedencia:
      textoNullableAdmin(
        body.procedencia
      ),

    descripcion:
      textoNullableAdmin(
        body.descripcion,
        10000
      ),

    orden:
      numeroNullableAdmin(
        body.orden
      ) ?? 999

  };

}



// ============================================================
// HELPERS ADMIN
// ============================================================

function textoAdmin(
  value,
  max = 500
) {

  return String(
    value ?? ""
  )
    .trim()
    .slice(
      0,
      max
    );

}


function textoNullableAdmin(
  value,
  max = 500
) {

  const valueNormalizado =
    textoAdmin(
      value,
      max
    );


  return valueNormalizado
    ? valueNormalizado
    : null;

}


function numeroNullableAdmin(
  value
) {

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {

    return null;

  }


  const numero =
    Number(value);


  if (
    !Number.isFinite(numero)
  ) {

    return null;

  }


  return Math.round(
    numero
  );

}


function origenAdminValido(
  request
) {

  const origin =
    request.headers.get(
      "Origin"
    );


  if (!origin) {

    return true;

  }


  return (
    origin ===
    new URL(
      request.url
    ).origin
  );

}


// ============================================================
// ADMIN - FOTOGRAFÍAS
// ============================================================

async function adminFotos(
  request,
  env
) {

  // ----------------------------------------------------------
  // SESIÓN
  // ----------------------------------------------------------

  const autorizado =
    await adminAutorizado(
      request,
      env
    );


  if (!autorizado) {

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


  // ==========================================================
  // GET - LISTAR FOTOS
  // ==========================================================

  if (request.method === "GET") {

    const url =
      new URL(request.url);


    const vehiculoId =
      Number(
        url.searchParams.get(
          "vehiculoId"
        )
      );


    if (
      !Number.isInteger(
        vehiculoId
      ) ||
      vehiculoId <= 0
    ) {

      return Response.json(
        {
          ok: false,
          error:
            "Vehículo incorrecto"
        },
        {
          status: 400
        }
      );

    }


    try {

      const resultado =
        await env.DB
          .prepare(`
            SELECT

              id,
              vehiculo_id,
              r2_key,
              nombre_archivo,
              mime_type,
              orden

            FROM fotos_vehiculos

            WHERE
              vehiculo_id = ?

            ORDER BY
              orden ASC,
              id ASC
          `)

          .bind(
            vehiculoId
          )

          .all();


      const fotos =
        (
          resultado.results || []
        ).map(
          foto => ({

            id:
              foto.id,

            vehiculoId:
              foto.vehiculo_id,

            nombre:
              foto.nombre_archivo ||
              "",

            tipo:
              foto.mime_type ||
              "",

            orden:
              foto.orden,

            url:
              rutaPublicaR2(
                foto.r2_key
              )

          })
        );


      return Response.json(
        {
          ok: true,
          total:
            fotos.length,
          fotos
        },
        {
          headers: {
            "Cache-Control":
              "no-store"
          }
        }
      );


    } catch (error) {

      console.error(
        "Listar fotos:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudieron cargar las fotografías"
        },
        {
          status: 500
        }
      );

    }

  }


  // ----------------------------------------------------------
  // ESCRITURAS: SOLO MISMO ORIGEN
  // ----------------------------------------------------------

  if (
    !origenAdminValido(
      request
    )
  ) {

    return Response.json(
      {
        ok: false,
        error:
          "Origen no permitido"
      },
      {
        status: 403
      }
    );

  }


  // ==========================================================
  // POST - SUBIR FOTOGRAFÍAS
  // ==========================================================

  if (request.method === "POST") {

    try {

      const formData =
        await request.formData();


      const vehiculoId =
        Number(
          formData.get(
            "vehiculoId"
          )
        );


      if (
        !Number.isInteger(
          vehiculoId
        ) ||
        vehiculoId <= 0
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Vehículo incorrecto"
          },
          {
            status: 400
          }
        );

      }


      // ------------------------------------------------------
      // COMPROBAR VEHÍCULO
      // ------------------------------------------------------

      const vehiculo =
        await env.DB
          .prepare(`
            SELECT id
            FROM vehiculos
            WHERE id = ?
          `)

          .bind(
            vehiculoId
          )

          .first();


      if (!vehiculo) {

        return Response.json(
          {
            ok: false,
            error:
              "Vehículo no encontrado"
          },
          {
            status: 404
          }
        );

      }


      // ------------------------------------------------------
      // ARCHIVOS
      // ------------------------------------------------------

      const archivos =
        formData
          .getAll("fotos")
          .filter(
            archivo =>
              archivo instanceof File
          );


      if (
        archivos.length === 0
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "No se han seleccionado fotografías"
          },
          {
            status: 400
          }
        );

      }


      if (
        archivos.length > 10
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Puedes subir un máximo de 10 fotografías cada vez"
          },
          {
            status: 400
          }
        );

      }


      const tiposPermitidos =
        new Set([
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/avif"
        ]);


      let tamanoTotal = 0;


      for (
        const archivo of archivos
      ) {

        if (
          !tiposPermitidos.has(
            archivo.type
          )
        ) {

          return Response.json(
            {
              ok: false,
              error:
                `Formato no permitido: ${archivo.name}`
            },
            {
              status: 400
            }
          );

        }


        if (
          archivo.size >
          12 * 1024 * 1024
        ) {

          return Response.json(
            {
              ok: false,
              error:
                `${archivo.name} supera los 12 MB`
            },
            {
              status: 400
            }
          );

        }


        tamanoTotal +=
          archivo.size;

      }


      if (
        tamanoTotal >
        50 * 1024 * 1024
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "La subida supera los 50 MB"
          },
          {
            status: 400
          }
        );

      }


      // ------------------------------------------------------
      // ORDEN DE PARTIDA
      // ------------------------------------------------------

      const maxOrden =
        await env.DB
          .prepare(`
            SELECT
              COALESCE(
                MAX(orden),
                -1
              ) AS max_orden

            FROM fotos_vehiculos

            WHERE
              vehiculo_id = ?
          `)

          .bind(
            vehiculoId
          )

          .first();


      let siguienteOrden =
        Number(
          maxOrden?.max_orden ??
          -1
        ) + 1;


      const fotosSubidas = [];


      // ------------------------------------------------------
      // SUBIR UNA A UNA
      // ------------------------------------------------------

      for (
        const archivo of archivos
      ) {

        const extension =
          extensionImagen(
            archivo.type
          );


        const r2Key =
          `vehiculos/` +
          `${vehiculoId}/` +
          `${crypto.randomUUID()}` +
          `.${extension}`;


        // R2
        await env.IMAGES.put(
          r2Key,
          archivo.stream(),
          {
            httpMetadata: {

              contentType:
                archivo.type,

              cacheControl:
                "public, max-age=31536000, immutable"

            }
          }
        );


        try {

          const resultado =
            await env.DB
              .prepare(`
                INSERT INTO
                  fotos_vehiculos
                (
                  vehiculo_id,
                  r2_key,
                  nombre_archivo,
                  mime_type,
                  orden
                )

                VALUES (
                  ?, ?, ?, ?, ?
                )
              `)

              .bind(

                vehiculoId,

                r2Key,

                archivo.name,

                archivo.type,

                siguienteOrden

              )

              .run();


          fotosSubidas.push({
            id:
              resultado.meta
                ?.last_row_id,

            nombre:
              archivo.name,

            orden:
              siguienteOrden,

            url:
              rutaPublicaR2(
                r2Key
              )
          });


          siguienteOrden++;


        } catch (error) {

          // Evitar dejar un objeto huérfano
          await env.IMAGES.delete(
            r2Key
          );


          throw error;

        }

      }


      return Response.json({
        ok: true,
        total:
          fotosSubidas.length,
        fotos:
          fotosSubidas
      });


    } catch (error) {

      console.error(
        "Subir fotos:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudieron subir las fotografías"
        },
        {
          status: 500
        }
      );

    }

  }


  // ==========================================================
  // DELETE - ELIMINAR FOTO
  // ==========================================================

  if (
    request.method ===
    "DELETE"
  ) {

    try {

      const body =
        await request.json();


      const vehiculoId =
        Number(
          body.vehiculoId
        );


      const fotoId =
        Number(
          body.fotoId
        );


      if (
        !vehiculoId ||
        !fotoId
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Datos incorrectos"
          },
          {
            status: 400
          }
        );

      }


      const foto =
        await env.DB
          .prepare(`
            SELECT
              id,
              r2_key

            FROM fotos_vehiculos

            WHERE
              id = ?
              AND
              vehiculo_id = ?
          `)

          .bind(
            fotoId,
            vehiculoId
          )

          .first();


      if (!foto) {

        return Response.json(
          {
            ok: false,
            error:
              "Fotografía no encontrada"
          },
          {
            status: 404
          }
        );

      }


      // Primero quitamos la relación de la web.
      await env.DB
        .prepare(`
          DELETE FROM
            fotos_vehiculos

          WHERE
            id = ?
            AND
            vehiculo_id = ?
        `)

        .bind(
          fotoId,
          vehiculoId
        )

        .run();


      // Luego borramos físicamente el archivo.
      try {

        await env.IMAGES.delete(
          foto.r2_key
        );

      } catch (error) {

        // La foto ya no será visible aunque R2 falle.
        console.error(
          "R2 delete:",
          error
        );

      }


      return Response.json({
        ok: true
      });


    } catch (error) {

      console.error(
        "Eliminar foto:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo eliminar la fotografía"
        },
        {
          status: 500
        }
      );

    }

  }


  // ==========================================================
  // PUT - CAMBIAR ORDEN
  // ==========================================================

  if (request.method === "PUT") {

    try {

      const body =
        await request.json();


      const vehiculoId =
        Number(
          body.vehiculoId
        );


      const orden =
        Array.isArray(
          body.orden
        )
          ? body.orden.map(
              Number
            )
          : [];


      if (
        !vehiculoId ||
        orden.length === 0
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Orden incorrecto"
          },
          {
            status: 400
          }
        );

      }


      // ------------------------------------------------------
      // COMPROBAR QUE TODAS LAS FOTOS PERTENECEN AL COCHE
      // ------------------------------------------------------

      const actuales =
        await env.DB
          .prepare(`
            SELECT id

            FROM fotos_vehiculos

            WHERE
              vehiculo_id = ?

            ORDER BY
              orden,
              id
          `)

          .bind(
            vehiculoId
          )

          .all();


      const idsActuales =
        (
          actuales.results || []
        ).map(
          fila =>
            Number(fila.id)
        );


      if (
        idsActuales.length !==
        orden.length
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "La lista de fotografías no coincide"
          },
          {
            status: 400
          }
        );

      }


      const conjuntoActual =
        new Set(
          idsActuales
        );


      const conjuntoNuevo =
        new Set(
          orden
        );


      if (
        conjuntoNuevo.size !==
        idsActuales.length ||
        !orden.every(
          id =>
            conjuntoActual.has(
              id
            )
        )
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Orden de fotografías incorrecto"
          },
          {
            status: 400
          }
        );

      }


      // ------------------------------------------------------
      // ACTUALIZACIÓN EN LOTE
      // ------------------------------------------------------

      const sentencia =
        env.DB.prepare(`
          UPDATE fotos_vehiculos

          SET orden = ?

          WHERE
            id = ?
            AND
            vehiculo_id = ?
        `);


      const consultas =
        orden.map(
          (fotoId, index) =>
            sentencia.bind(
              index,
              fotoId,
              vehiculoId
            )
        );


      await env.DB.batch(
        consultas
      );


      return Response.json({
        ok: true
      });


    } catch (error) {

      console.error(
        "Ordenar fotos:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo cambiar el orden"
        },
        {
          status: 500
        }
      );

    }

  }


  return Response.json(
    {
      ok: false,
      error:
        "Método no permitido"
    },
    {
      status: 405
    }
  );

}


// ============================================================
// FOTO - RUTA PÚBLICA
// ============================================================

function rutaPublicaR2(
  r2Key
) {

  return (
    "/media/" +
    String(r2Key)
      .split("/")
      .map(
        parte =>
          encodeURIComponent(
            parte
          )
      )
      .join("/")
  );

}


// ============================================================
// FOTO - EXTENSIÓN
// ============================================================

function extensionImagen(
  mimeType
) {

  switch (mimeType) {

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/avif":
      return "avif";

    case "image/jpeg":
    default:
      return "jpg";

  }

}
