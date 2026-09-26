// ============================================================
// WORKER
// ============================================================

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    if (url.pathname === "/sitemap.xml") {
      return servirSitemap(request, env);
    }

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

// ============================================================
// ADMIN - ALQUILERES
// ============================================================

if (
  url.pathname ===
  "/admin/api/alquileres"
) {

  return adminAlquileres(
    request,
    env
  );

}


if (
  url.pathname ===
  "/admin/api/alquiler"
) {

  return adminAlquiler(
    request,
    env
  );

}
    
// ============================================================
// ADMIN - REPOSICIONES
// ============================================================

if (
  url.pathname ===
  "/admin/api/reposicion-fotos"
) {
  return adminReposicionFotos(
    request,
    env
  );
}
    
if (
  url.pathname ===
  "/admin/api/reposiciones"
) {

  return adminReposiciones(
    request,
    env
  );

}


if (
  url.pathname ===
  "/admin/api/reposicion"
) {

  return adminReposicion(
    request,
    env
  );

}

// ============================================================
// ADMIN - FOTOS REPOSICIONES
// ============================================================

async function adminReposicionFotos(
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

    const reposicionId =
      Number(
        url.searchParams.get(
          "reposicionId"
        )
      );

    if (
      !Number.isInteger(
        reposicionId
      ) ||
      reposicionId <= 0
    ) {

      return Response.json(
        {
          ok: false,
          error:
            "Reposición incorrecta"
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
              reposicion_id,
              r2_key,
              nombre_archivo,
              mime_type,
              orden
            FROM fotos_reposiciones
            WHERE reposicion_id = ?
            ORDER BY orden ASC, id ASC
          `)
          .bind(reposicionId)
          .all();

      const fotos =
        (
          resultado.results || []
        ).map(
          foto => ({
            id: foto.id,
            reposicionId:
              foto.reposicion_id,
            nombre:
              foto.nombre_archivo || "",
            tipo:
              foto.mime_type || "",
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
        "Listar fotos reposiciones:",
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

      const reposicionId =
        Number(
          formData.get(
            "reposicionId"
          )
        );

      if (
        !Number.isInteger(
          reposicionId
        ) ||
        reposicionId <= 0
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Reposición incorrecta"
          },
          {
            status: 400
          }
        );

      }

      const reposicion =
        await env.DB
          .prepare(`
            SELECT id
            FROM reposiciones
            WHERE id = ?
          `)
          .bind(
            reposicionId
          )
          .first();

      if (!reposicion) {

        return Response.json(
          {
            ok: false,
            error:
              "Reposición no encontrada"
          },
          {
            status: 404
          }
        );

      }

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

      const maxOrden =
        await env.DB
          .prepare(`
            SELECT
              COALESCE(
                MAX(orden),
                -1
              ) AS max_orden
            FROM fotos_reposiciones
            WHERE reposicion_id = ?
          `)
          .bind(
            reposicionId
          )
          .first();

      let siguienteOrden =
        Number(
          maxOrden?.max_orden ??
          -1
        ) + 1;

      const fotosSubidas = [];

      for (
        const archivo of archivos
      ) {

        const extension =
          extensionImagen(
            archivo.type
          );

        const r2Key =
          `reposiciones/` +
          `${reposicionId}/` +
          `${crypto.randomUUID()}` +
          `.${extension}`;

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
                INSERT INTO fotos_reposiciones (
                  reposicion_id,
                  r2_key,
                  nombre_archivo,
                  mime_type,
                  orden
                )
                VALUES (?, ?, ?, ?, ?)
              `)
              .bind(
                reposicionId,
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
        "Subir fotos reposiciones:",
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

      const reposicionId =
        Number(
          body.reposicionId
        );

      const fotoId =
        Number(
          body.fotoId
        );

      if (
        !reposicionId ||
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
            FROM fotos_reposiciones
            WHERE
              id = ?
              AND reposicion_id = ?
          `)
          .bind(
            fotoId,
            reposicionId
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

      await env.DB
        .prepare(`
          DELETE FROM fotos_reposiciones
          WHERE
            id = ?
            AND reposicion_id = ?
        `)
        .bind(
          fotoId,
          reposicionId
        )
        .run();

      try {

        await env.IMAGES.delete(
          foto.r2_key
        );

      } catch (error) {

        console.error(
          "R2 delete reposicion:",
          error
        );

      }

      return Response.json({
        ok: true
      });

    } catch (error) {

      console.error(
        "Eliminar foto reposicion:",
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

      const reposicionId =
        Number(
          body.reposicionId
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
        !reposicionId ||
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

      const actuales =
        await env.DB
          .prepare(`
            SELECT id
            FROM fotos_reposiciones
            WHERE reposicion_id = ?
            ORDER BY orden, id
          `)
          .bind(
            reposicionId
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
        new Set(idsActuales);

      const conjuntoNuevo =
        new Set(orden);

      if (
        conjuntoNuevo.size !==
        idsActuales.length ||
        !orden.every(
          id =>
            conjuntoActual.has(id)
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

      const sentencia =
        env.DB.prepare(`
          UPDATE fotos_reposiciones
          SET orden = ?
          WHERE
            id = ?
            AND reposicion_id = ?
        `);

      const consultas =
        orden.map(
          (fotoId, index) =>
            sentencia.bind(
              index,
              fotoId,
              reposicionId
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
        "Ordenar fotos reposiciones:",
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
// FICHA INDIVIDUAL DE VEHÍCULO
// ========================================================

if (
  url.pathname.startsWith(
    "/vehiculo/"
  )
) {

  return servirFichaVehiculo(
    request,
    env,
    url
  );

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
// ADMIN - LISTAR ALQUILERES
// ============================================================

async function adminAlquileres(
  request,
  env
) {

  // ----------------------------------------------------------
  // AUTORIZACIÓN
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


  // ----------------------------------------------------------
  // SOLO GET
  // ----------------------------------------------------------

  if (
    request.method !== "GET"
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


  try {

    const resultado =
      await env.DB
        .prepare(`
          SELECT

            a.id,

            a.vehiculo_id,

            a.nombre_completo,
            a.dni,

            a.fecha_salida,
            a.fecha_vuelta,

            a.estado,

            a.fecha_devolucion_real,

            a.created_at,
            a.updated_at,

            v.vehiculo,
            v.marca,
            v.modelo,
            v.version,
            v.estado AS estado_vehiculo

          FROM alquileres a

          INNER JOIN vehiculos v
            ON v.id = a.vehiculo_id

          ORDER BY

            CASE
              WHEN a.estado = 'Activo'
              THEN 0
              ELSE 1
            END ASC,

            a.fecha_vuelta ASC,

            a.id DESC
        `)
        .all();


    return Response.json({
      ok: true,

      alquileres:
        resultado.results || []
    });


  } catch (error) {

    console.error(
      "Listar alquileres:",
      error
    );


    return Response.json(
      {
        ok: false,
        error:
          "No se pudieron cargar los alquileres"
      },
      {
        status: 500
      }
    );

  }

}

// ============================================================
// ADMIN - ALQUILER
// ============================================================

async function adminAlquiler(
  request,
  env
) {

  // ----------------------------------------------------------
  // AUTORIZACIÓN
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


  // ----------------------------------------------------------
  // VALIDAR ORIGEN
  // ----------------------------------------------------------

  if (
    request.method !== "GET" &&
    !origenAdminValido(
      request
    )
  ) {

    return Response.json(
      {
        ok: false,
        error: "Origen no permitido"
      },
      {
        status: 403
      }
    );

  }


  // ==========================================================
  // POST - CREAR ALQUILER
  // ==========================================================

  if (
    request.method === "POST"
  ) {

    try {

      const body =
        await request.json();


      const vehiculoId =
        Number(
          body.vehiculoId
        );


      const nombreCompleto =
        textoAdmin(
          body.nombreCompleto,
          200
        );


      const dni =
        textoAdmin(
          body.dni,
          30
        )
        .toUpperCase();


      const fechaSalida =
        normalizarFechaAlquiler(
          body.fechaSalida
        );


      const fechaVuelta =
        normalizarFechaAlquiler(
          body.fechaVuelta
        );


      // --------------------------------------------------------
      // VALIDACIONES
      // --------------------------------------------------------

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


      if (
        !nombreCompleto
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Debes indicar el nombre completo"
          },
          {
            status: 400
          }
        );

      }


      if (!dni) {

        return Response.json(
          {
            ok: false,
            error:
              "Debes indicar el DNI"
          },
          {
            status: 400
          }
        );

      }


      if (
        !fechaSalida ||
        !fechaVuelta
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Las fechas del alquiler no son correctas"
          },
          {
            status: 400
          }
        );

      }


      if (
        fechaVuelta <
        fechaSalida
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "La fecha de vuelta no puede ser anterior a la fecha de salida"
          },
          {
            status: 400
          }
        );

      }


      // --------------------------------------------------------
      // COMPROBAR VEHÍCULO
      // --------------------------------------------------------

      const vehiculo =
        await env.DB
          .prepare(`
            SELECT

              id,
              vehiculo,
              estado

            FROM vehiculos

            WHERE id = ?

            LIMIT 1
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


      if (
        vehiculo.estado !==
        "Disponible"
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "El vehículo ya no está disponible para alquiler"
          },
          {
            status: 409
          }
        );

      }


      // --------------------------------------------------------
      // COMPROBAR ALQUILER ACTIVO
      // --------------------------------------------------------

      const alquilerActivo =
        await env.DB
          .prepare(`
            SELECT id

            FROM alquileres

            WHERE
              vehiculo_id = ?
              AND estado = 'Activo'

            LIMIT 1
          `)
          .bind(
            vehiculoId
          )
          .first();


      if (alquilerActivo) {

        return Response.json(
          {
            ok: false,
            error:
              "Este vehículo ya tiene un alquiler activo"
          },
          {
            status: 409
          }
        );

      }


      // --------------------------------------------------------
      // CREAR ALQUILER + CAMBIAR VEHÍCULO
      // --------------------------------------------------------

      await env.DB.batch([

        env.DB
          .prepare(`
            INSERT INTO alquileres (

              vehiculo_id,

              nombre_completo,
              dni,

              fecha_salida,
              fecha_vuelta,

              estado,

              created_at,
              updated_at

            )

            VALUES (
              ?,
              ?,
              ?,
              ?,
              ?,
              'Activo',
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
          `)
          .bind(

            vehiculoId,

            nombreCompleto,
            dni,

            fechaSalida,
            fechaVuelta

          ),


        env.DB
          .prepare(`
            UPDATE vehiculos

            SET

              estado =
                'Alquilado',

              fecha_disponible =
                NULL,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = ?
          `)
          .bind(
            vehiculoId
          )

      ]);


      return Response.json({
        ok: true,
        accion:
          "alquiler_creado"
      });


    } catch (error) {

      console.error(
        "Crear alquiler:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo registrar el alquiler"
        },
        {
          status: 500
        }
      );

    }

  }


  // ==========================================================
  // PUT - REGISTRAR DEVOLUCIÓN
  // ==========================================================

  if (
    request.method === "PUT"
  ) {

    try {

      const body =
        await request.json();


      const alquilerId =
        Number(
          body.id
        );


      const estadoVehiculo =
        textoAdmin(
          body.estadoVehiculo
        );


      const fechaDisponible =
        normalizarFechaAlquiler(
          body.fechaDisponible
        );


      if (
        !Number.isInteger(
          alquilerId
        ) ||
        alquilerId <= 0
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Alquiler incorrecto"
          },
          {
            status: 400
          }
        );

      }


      if (
        ![
          "Disponible",
          "En Preparación"
        ].includes(
          estadoVehiculo
        )
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Estado final del vehículo incorrecto"
          },
          {
            status: 400
          }
        );

      }


      if (
        estadoVehiculo ===
          "En Preparación" &&
        !fechaDisponible
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Debes indicar cuándo estará disponible el vehículo"
          },
          {
            status: 400
          }
        );

      }


      // --------------------------------------------------------
      // BUSCAR ALQUILER
      // --------------------------------------------------------

      const alquiler =
        await env.DB
          .prepare(`
            SELECT

              id,
              vehiculo_id,
              estado

            FROM alquileres

            WHERE id = ?

            LIMIT 1
          `)
          .bind(
            alquilerId
          )
          .first();


      if (!alquiler) {

        return Response.json(
          {
            ok: false,
            error:
              "Alquiler no encontrado"
          },
          {
            status: 404
          }
        );

      }


      if (
        alquiler.estado !==
        "Activo"
      ) {

        return Response.json(
          {
            ok: false,
            error:
              "Este alquiler ya está finalizado"
          },
          {
            status: 409
          }
        );

      }


      // --------------------------------------------------------
      // FINALIZAR
      // --------------------------------------------------------

      await env.DB.batch([

        env.DB
          .prepare(`
            UPDATE alquileres

            SET

              estado =
                'Finalizado',

              fecha_devolucion_real =
                date('now'),

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = ?
          `)
          .bind(
            alquilerId
          ),


        env.DB
          .prepare(`
            UPDATE vehiculos

            SET

              estado = ?,

              fecha_disponible = ?,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = ?
          `)
          .bind(

            estadoVehiculo,

            estadoVehiculo ===
              "En Preparación"
              ? fechaDisponible
              : null,

            alquiler.vehiculo_id

          )

      ]);


      return Response.json({
        ok: true,
        accion:
          "alquiler_finalizado"
      });


    } catch (error) {

      console.error(
        "Finalizar alquiler:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo registrar la devolución"
        },
        {
          status: 500
        }
      );

    }

  }


  // ----------------------------------------------------------
  // RESTO
  // ----------------------------------------------------------

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
// NORMALIZAR FECHA DE ALQUILER
// ============================================================

function normalizarFechaAlquiler(
  valor
) {

  const fecha =
    String(
      valor || ""
    ).trim();


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      fecha
    )
  ) {

    return null;

  }


  return fecha;

}

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
            v.fecha_disponible,
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

            OR v.estado NOT IN (
              'Vendido',
              'Alquilado'
            )
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

            fecha_disponible:
              fila.fecha_disponible ||
                                     null,

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

async function obtenerReposicionesD1(env) {

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

      // ------------------------------------------------------
      // CREAR REPOSICIÓN EN EL MAPA
      // ------------------------------------------------------

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


    // --------------------------------------------------------
    // RESULTADO
    // --------------------------------------------------------

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
      "Reposiciones públicas:",
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

  if (
    request.method !== "POST"
  ) {

    return respuestaLoginAdmin(
      {
        ok: false,
        error:
          "Método no permitido"
      },
      405
    );

  }


  try {

    if (
      !env.ADMIN_PASSWORD ||
      !env.ADMIN_SESSION_SECRET
    ) {

      return respuestaLoginAdmin(
        {
          ok: false,
          error:
            "Administración no configurada"
        },
        500
      );

    }


    // ========================================================
    // IDENTIFICAR IP
    // ========================================================

    const ip =
      request.headers.get(
        "CF-Connecting-IP"
      ) ||
      "IP_DESCONOCIDA";


    // No almacenamos la IP real.
    // Guardamos un HMAC irreversible para identificarla.

    const ipHash =
      await hashIpAdmin(
        ip,
        env.ADMIN_SESSION_SECRET
      );


    const ahora =
      Math.floor(
        Date.now() / 1000
      );


    // ========================================================
    // COMPROBAR BLOQUEO EXISTENTE
    // ========================================================

    const seguridad =
      await env.DB
        .prepare(`
          SELECT
            fase,
            fallos,
            bloqueado_hasta,
            actualizado_en
          FROM admin_login_guard
          WHERE ip_hash = ?
        `)
        .bind(
          ipHash
        )
        .first();


    if (
      seguridad &&
      Number(
        seguridad.bloqueado_hasta || 0
      ) > ahora
    ) {

      const segundosRestantes =
        Math.max(
          1,
          Number(
            seguridad.bloqueado_hasta
          ) - ahora
        );


      return respuestaLoginAdmin(
        {
          ok: false,

          error:
            mensajeBloqueoAdmin(
              segundosRestantes
            ),

          retryAfter:
            segundosRestantes
        },
        429,
        {
          "Retry-After":
            String(
              segundosRestantes
            )
        }
      );

    }


    // ========================================================
    // LEER CONTRASEÑA
    // ========================================================

    const body =
      await request.json();


    const password =
      String(
        body.password || ""
      );


    const correcto =
      await compararSeguro(
        password,
        env.ADMIN_PASSWORD
      );


    // ========================================================
    // LOGIN CORRECTO
    // ========================================================

    if (correcto) {

      // Un login correcto borra completamente
      // el contador y los bloqueos de esa IP.

      await env.DB
        .prepare(`
          DELETE FROM
            admin_login_guard
          WHERE
            ip_hash = ?
        `)
        .bind(
          ipHash
        )
        .run();


      const expira =
        Date.now() +
        (
          8 *
          60 *
          60 *
          1000
        );


      const payload =
        String(
          expira
        );


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


      return respuestaLoginAdmin(
        {
          ok: true
        },
        200,
        {
          "Set-Cookie":
            cookie
        }
      );

    }


    // ========================================================
    // CONTRASEÑA INCORRECTA
    // ========================================================

    const bloqueo1Minuto =
      ahora + 60;


    const bloqueo5Minutos =
      ahora + 300;


    /*
      Toda esta operación se realiza como batch:

      1. Crear registro si no existe.
      2. Incrementar fallo.
      3. Comprobar si corresponde bloqueo.
      4. Recuperar estado final.

      FASE 0:
        5 fallos -> bloqueo 60 segundos.

      FASE 1:
        3 fallos -> bloqueo 300 segundos.
    */

    const resultado =
      await env.DB.batch([

        env.DB
          .prepare(`
            INSERT OR IGNORE INTO
              admin_login_guard
            (
              ip_hash,
              fase,
              fallos,
              bloqueado_hasta,
              actualizado_en
            )
            VALUES (
              ?,
              0,
              0,
              0,
              ?
            )
          `)
          .bind(
            ipHash,
            ahora
          ),


        env.DB
          .prepare(`
            UPDATE
              admin_login_guard

            SET
              fallos =
                fallos + 1,

              actualizado_en =
                ?

            WHERE
              ip_hash = ?
          `)
          .bind(
            ahora,
            ipHash
          ),


        env.DB
          .prepare(`
            UPDATE
              admin_login_guard

            SET

              bloqueado_hasta =
                CASE

                  WHEN
                    fase = 0
                    AND
                    fallos >= 5

                  THEN
                    ?

                  WHEN
                    fase >= 1
                    AND
                    fallos >= 3

                  THEN
                    ?

                  ELSE
                    bloqueado_hasta

                END,


              fase =
                CASE

                  WHEN
                    fase = 0
                    AND
                    fallos >= 5

                  THEN
                    1

                  ELSE
                    fase

                END,


              fallos =
                CASE

                  WHEN
                    fase = 0
                    AND
                    fallos >= 5

                  THEN
                    0

                  WHEN
                    fase >= 1
                    AND
                    fallos >= 3

                  THEN
                    0

                  ELSE
                    fallos

                END,


              actualizado_en =
                ?

            WHERE
              ip_hash = ?
          `)
          .bind(
            bloqueo1Minuto,
            bloqueo5Minutos,
            ahora,
            ipHash
          ),


        env.DB
          .prepare(`
            SELECT
              fase,
              fallos,
              bloqueado_hasta,
              actualizado_en
            FROM
              admin_login_guard
            WHERE
              ip_hash = ?
          `)
          .bind(
            ipHash
          )

      ]);


    /*
      El SELECT es la cuarta operación
      del batch.
    */

    const estadoFinal =
      resultado?.[3]
        ?.results?.[0];


    // ========================================================
    // ACABA DE ACTIVARSE UN BLOQUEO
    // ========================================================

    if (
      estadoFinal &&
      Number(
        estadoFinal.bloqueado_hasta || 0
      ) > ahora
    ) {

      const segundosRestantes =
        Math.max(
          1,
          Number(
            estadoFinal.bloqueado_hasta
          ) - ahora
        );


      return respuestaLoginAdmin(
        {
          ok: false,

          error:
            mensajeBloqueoAdmin(
              segundosRestantes
            ),

          retryAfter:
            segundosRestantes
        },
        429,
        {
          "Retry-After":
            String(
              segundosRestantes
            )
        }
      );

    }


    // ========================================================
    // TODAVÍA QUEDAN INTENTOS
    // ========================================================

    return respuestaLoginAdmin(
      {
        ok: false,
        error:
          "Contraseña incorrecta"
      },
      401
    );


  } catch (error) {

    console.error(
      "Error login admin:",
      error
    );


    return respuestaLoginAdmin(
      {
        ok: false,
        error:
          "Error iniciando sesión"
      },
      500
    );

  }

}

// ============================================================
// ADMIN LOGIN - RESPUESTA SEGURA
// ============================================================

function respuestaLoginAdmin(
  body,
  status = 200,
  extraHeaders = {}
) {

  const headers =
    new Headers(
      extraHeaders
    );


  headers.set(
    "Cache-Control",
    "no-store"
  );


  headers.set(
    "Pragma",
    "no-cache"
  );


  return Response.json(
    body,
    {
      status,
      headers
    }
  );

}


// ============================================================
// ADMIN LOGIN - HASH DE IP
// ============================================================

async function hashIpAdmin(
  ip,
  secret
) {

  const encoder =
    new TextEncoder();


  const key =
    await crypto.subtle.importKey(
      "raw",

      encoder.encode(
        secret
      ),

      {
        name:
          "HMAC",

        hash:
          "SHA-256"
      },

      false,

      [
        "sign"
      ]
    );


  const signature =
    await crypto.subtle.sign(

      "HMAC",

      key,

      encoder.encode(
        String(ip)
      )

    );


  return Array
    .from(
      new Uint8Array(
        signature
      )
    )

    .map(
      byte =>
        byte
          .toString(16)
          .padStart(
            2,
            "0"
          )
    )

    .join("");

}


// ============================================================
// ADMIN LOGIN - MENSAJE DE BLOQUEO
// ============================================================

function mensajeBloqueoAdmin(
  segundos
) {

  if (
    segundos >= 60
  ) {

    const minutos =
      Math.ceil(
        segundos / 60
      );


    return (
      "Demasiados intentos fallidos. " +
      `Acceso bloqueado durante ${minutos} ` +
      (
        minutos === 1
          ? "minuto."
          : "minutos."
      )
    );

  }


  return (
    "Demasiados intentos fallidos. " +
    `Vuelve a intentarlo en ${segundos} segundos.`
  );

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
            v.fecha_disponible,
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

  if (
  datos.estado ===
    "En Preparación" &&
  !datos.fecha_disponible
) {

  return Response.json(
    {
      ok: false,
      error:
        "Debes indicar la fecha en la que el vehículo estará disponible"
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
              fecha_disponible,
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
              ?, ?, ?, ?, ?, ?, ?, ?, ?,
              CURRENT_TIMESTAMP
            )
          `)

          .bind(

            datos.vehiculo,

            datos.publicado,
            datos.estado,
            datos.fecha_disponible,
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
              fecha_disponible = ?,
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
            datos.fecha_disponible,
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
          v.fecha_disponible,
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
      "En Preparación",
      "Reservado",
      "Alquilado",
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

    fecha_disponible:
  estado === "En Preparación"
    ? normalizarFechaDisponible(
        body.fecha_disponible
      )
    : null,

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

// ============================================================
// ADMIN - LISTADO DE REPOSICIONES
// ============================================================

async function adminReposiciones(
  request,
  env
) {

  if (request.method !== "GET") {

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

            r.id,
            r.nombre,
            r.precio,
            r.publicado,
            r.orden,

            COUNT(f.id) AS fotos

          FROM reposiciones r

          LEFT JOIN
            fotos_reposiciones f

            ON
              f.reposicion_id =
              r.id

          GROUP BY
            r.id

          ORDER BY
            r.orden ASC,
            r.id ASC
        `)

        .all();


    const reposiciones =
      (
        resultado.results || []
      ).map(
        r => ({

          ...r,

          publicado:
            Boolean(
              r.publicado
            ),

          fotos:
            Number(
              r.fotos || 0
            )

        })
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
      "Admin reposiciones:",
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
// ADMIN - CREAR / EDITAR / ELIMINAR REPOSICIÓN
// ============================================================

async function adminReposicion(
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
        error:
          "No autorizado"
      },
      {
        status: 401
      }
    );

  }


  // ==========================================================
  // GET - LEER UNA REPOSICIÓN
  // ==========================================================

  if (
    request.method === "GET"
  ) {

    const url =
      new URL(
        request.url
      );


    const id =
      Number(
        url.searchParams.get(
          "id"
        )
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


    const reposicion =
      await obtenerReposicionAdmin(
        env,
        id
      );


    if (!reposicion) {

      return Response.json(
        {
          ok: false,
          error:
            "Reposición no encontrada"
        },
        {
          status: 404
        }
      );

    }


    return Response.json(
      {
        ok: true,
        reposicion
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
  // MÉTODOS DE ESCRITURA
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
  // DELETE - ELIMINAR
  // ==========================================================

  if (
    request.method ===
    "DELETE"
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

      const reposicion =
        await obtenerReposicionAdmin(
          env,
          id
        );


      if (!reposicion) {

        return Response.json(
          {
            ok: false,
            error:
              "Reposición no encontrada"
          },
          {
            status: 404
          }
        );

      }


      // Obtener fotografías antes de borrar
      const fotosResultado =
        await env.DB
          .prepare(`
            SELECT
              r2_key

            FROM
              fotos_reposiciones

            WHERE
              reposicion_id = ?
          `)

          .bind(id)

          .all();


      const fotos =
        fotosResultado.results ||
        [];


      // Borrar de D1
      await env.DB.batch([

        env.DB
          .prepare(`
            DELETE FROM
              fotos_reposiciones

            WHERE
              reposicion_id = ?
          `)

          .bind(id),

        env.DB
          .prepare(`
            DELETE FROM
              reposiciones

            WHERE
              id = ?
          `)

          .bind(id)

      ]);


      // Borrar ficheros físicos de R2
      for (
        const foto of fotos
      ) {

        try {

          await env.IMAGES.delete(
            foto.r2_key
          );

        } catch (error) {

          console.error(
            "Error borrando foto de reposición:",
            foto.r2_key,
            error
          );

        }

      }


      return Response.json({
        ok: true,
        accion:
          "eliminada",
        id
      });


    } catch (error) {

      console.error(
        "Eliminar reposición:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo eliminar la reposición"
        },
        {
          status: 500
        }
      );

    }

  }


  // ==========================================================
  // DATOS POST / PUT
  // ==========================================================

  const nombre =
    textoAdmin(
      body.nombre
    );


  const precio =
    numeroNullableAdmin(
      body.precio
    );


  const publicado =
    body.publicado
      ? 1
      : 0;


  const orden =
    numeroNullableAdmin(
      body.orden
    ) ?? 999;


  if (!nombre) {

    return Response.json(
      {
        ok: false,
        error:
          "El nombre del producto es obligatorio"
      },
      {
        status: 400
      }
    );

  }


  // ==========================================================
  // POST - CREAR
  // ==========================================================

  if (
    request.method === "POST"
  ) {

    try {

      const resultado =
        await env.DB
          .prepare(`
            INSERT INTO
              reposiciones
            (
              nombre,
              precio,
              publicado,
              orden,
              updated_at
            )

            VALUES (
              ?, ?, ?, ?,
              CURRENT_TIMESTAMP
            )
          `)

          .bind(
            nombre,
            precio,
            publicado,
            orden
          )

          .run();


      const id =
        Number(
          resultado.meta
            ?.last_row_id
        );


      if (!id) {

        throw new Error(
          "No se pudo obtener el ID"
        );

      }


      const reposicion =
        await obtenerReposicionAdmin(
          env,
          id
        );


      return Response.json({
        ok: true,
        accion:
          "creada",
        reposicion
      });


    } catch (error) {

      console.error(
        "Crear reposición:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo crear la reposición"
        },
        {
          status: 500
        }
      );

    }

  }


  // ==========================================================
  // PUT - ACTUALIZAR
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
            UPDATE
              reposiciones

            SET
              nombre = ?,
              precio = ?,
              publicado = ?,
              orden = ?,
              updated_at =
                CURRENT_TIMESTAMP

            WHERE
              id = ?
          `)

          .bind(
            nombre,
            precio,
            publicado,
            orden,
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
              "Reposición no encontrada"
          },
          {
            status: 404
          }
        );

      }


      const reposicion =
        await obtenerReposicionAdmin(
          env,
          id
        );


      return Response.json({
        ok: true,
        accion:
          "actualizada",
        reposicion
      });


    } catch (error) {

      console.error(
        "Actualizar reposición:",
        error
      );


      return Response.json(
        {
          ok: false,
          error:
            "No se pudo actualizar la reposición"
        },
        {
          status: 500
        }
      );

    }

  }

}


// ============================================================
// ADMIN - LEER REPOSICIÓN
// ============================================================

async function obtenerReposicionAdmin(
  env,
  id
) {

  const r =
    await env.DB
      .prepare(`
        SELECT

          r.id,
          r.nombre,
          r.precio,
          r.publicado,
          r.orden,

          (
            SELECT COUNT(*)

            FROM
              fotos_reposiciones f

            WHERE
              f.reposicion_id =
              r.id
          ) AS fotos

        FROM
          reposiciones r

        WHERE
          r.id = ?

        LIMIT 1
      `)

      .bind(id)

      .first();


  if (!r) {

    return null;

  }


  return {

    ...r,

    publicado:
      Boolean(
        r.publicado
      ),

    fotos:
      Number(
        r.fotos || 0
      )

  };

}


// ============================================================
// FICHA INDIVIDUAL DE VEHÍCULO
// ============================================================

async function servirFichaVehiculo(
  request,
  env,
  url
) {

  try {

    // ========================================================
    // OBTENER ID DESDE LA URL
    //
    // Ejemplo:
    // /vehiculo/7-audi-a4
    //            ↑
    //            ID
    // ========================================================

    const parte =
      decodeURIComponent(
        url.pathname.substring(
          "/vehiculo/".length
        )
      );


    const coincidencia =
      parte.match(
        /^(\d+)(?:-|$)/
      );


    if (!coincidencia) {

      return new Response(
        "Vehículo no encontrado",
        {
          status: 404
        }
      );

    }


    const id =
      Number(
        coincidencia[1]
      );


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return new Response(
        "Vehículo no encontrado",
        {
          status: 404
        }
      );

    }


    // ========================================================
    // LEER VEHÍCULO + FOTOS
    // ========================================================

    const resultado =
      await env.DB
        .prepare(`
          SELECT

            v.id,
            v.vehiculo,
            v.publicado,
            v.estado,
            v.fecha_disponible,
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
            v.id = ?

            AND
            v.publicado = 1

            AND (
              v.estado IS NULL
              OR v.estado <> 'Vendido'
            )

          ORDER BY
            f.orden ASC,
            f.id ASC
        `)

        .bind(id)

        .all();


    const filas =
      resultado.results || [];


    if (
      filas.length === 0
    ) {

      return new Response(
        "Vehículo no encontrado",
        {
          status: 404
        }
      );

    }


    const primera =
      filas[0];


    // ========================================================
    // VEHÍCULO
    // ========================================================

    const vehiculo = {

      id:
        primera.id,

      vehiculo:
        primera.vehiculo || "",

      estado:
        primera.estado ||
        "Disponible",

      marca:
        primera.marca || "",

      modelo:
        primera.modelo || "",

      version:
        primera.version || "",

      precio:
        primera.precio ?? null,

      ano:
        primera.ano ?? null,

      kilometros:
        primera.kilometros ?? null,

      combustible:
        primera.combustible || "",

      cambio:
        primera.cambio || "",

      potencia:
        primera.potencia ?? null,

      procedencia:
        primera.procedencia || "",

      descripcion:
        primera.descripcion || "",

      fotos: []

    };


    // ========================================================
    // FOTOS
    // ========================================================

    for (
      const fila
      of filas
    ) {

      if (!fila.r2_key) {

        continue;

      }


      vehiculo.fotos.push({

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


    // ========================================================
    // SLUG CANÓNICO
    // ========================================================

    const slug =
      crearSlugVehiculo(
        vehiculo.vehiculo
      );


    const rutaCanonica =
      `/vehiculo/${vehiculo.id}-${slug}`;


    // Si entran por:
    // /vehiculo/7
    // /vehiculo/7-lo-que-sea
    //
    // redirigimos a la URL correcta.

    if (
      url.pathname !==
      rutaCanonica
    ) {

      return Response.redirect(
        new URL(
          rutaCanonica,
          url.origin
        ).toString(),
        301
      );

    }


    // ========================================================
    // DATOS PARA LA PÁGINA
    // ========================================================

    const nombre =
      escaparHtmlFicha(
        vehiculo.vehiculo
      );


    const precio =
      vehiculo.precio !== null
        ? `${formatearNumeroFicha(
            vehiculo.precio
          )} €`
        : "Consultar precio";


    const fotoPrincipal =
      vehiculo.fotos.length
        ? vehiculo.fotos[0].url
        : "/assets/logo-utebo-motor-selection.jpeg";


    const fotoAbsoluta =
      `https://utebomotorsselection.com${fotoPrincipal}`;


    const canonical =
      `https://utebomotorsselection.com${rutaCanonica}`;


    // ========================================================
    // META DESCRIPTION
    // ========================================================

    const partesDescripcion =
      [];


    if (vehiculo.ano) {

      partesDescripcion.push(
        String(
          vehiculo.ano
        )
      );

    }


    if (vehiculo.kilometros) {

      partesDescripcion.push(
        `${formatearNumeroFicha(
          vehiculo.kilometros
        )} km`
      );

    }


    if (vehiculo.combustible) {

      partesDescripcion.push(
        vehiculo.combustible
      );

    }


    if (vehiculo.cambio) {

      partesDescripcion.push(
        vehiculo.cambio
      );

    }


    let metaDescription =
      `${vehiculo.vehiculo} de segunda mano en Utebo.`;


    if (
      partesDescripcion.length
    ) {

      metaDescription +=
        ` ${partesDescripcion.join(
          ", "
        )}.`;

    }


    metaDescription +=
      " Consulta fotos, características y precio en Utebo Motor Selection.";


    // ========================================================
    // CARACTERÍSTICAS
    // ========================================================

    const caracteristicas =
      [];


    if (vehiculo.ano) {

      caracteristicas.push({
        titulo:
          "Año",

        valor:
          vehiculo.ano
      });

    }


    if (
      vehiculo.kilometros !==
      null
    ) {

      caracteristicas.push({
        titulo:
          "Kilómetros",

        valor:
          `${formatearNumeroFicha(
            vehiculo.kilometros
          )} km`
      });

    }


    if (vehiculo.combustible) {

      caracteristicas.push({
        titulo:
          "Combustible",

        valor:
          vehiculo.combustible
      });

    }


    if (vehiculo.cambio) {

      caracteristicas.push({
        titulo:
          "Cambio",

        valor:
          vehiculo.cambio
      });

    }


    if (
      vehiculo.potencia !==
      null
    ) {

      caracteristicas.push({
        titulo:
          "Potencia",

        valor:
          `${vehiculo.potencia} CV`
      });

    }


    if (vehiculo.procedencia) {

      caracteristicas.push({
        titulo:
          "Procedencia",

        valor:
          vehiculo.procedencia
      });

    }


    const caracteristicasHtml =
      caracteristicas
        .map(
          item => `
            <div class="vehicle-detail-spec">

              <span>
                ${escaparHtmlFicha(
                  item.titulo
                )}
              </span>

              <strong>
                ${escaparHtmlFicha(
                  item.valor
                )}
              </strong>

            </div>
          `
        )
        .join("");


    // ========================================================
    // MINIATURAS
    // ========================================================

    const miniaturasHtml =
      vehiculo.fotos
        .map(
          (foto, index) => `

            <button
              class="
                vehicle-detail-thumb
                ${
                  index === 0
                    ? "is-active"
                    : ""
                }
              "
              type="button"
              data-gallery-src="${escaparAtributoFicha(
                foto.url
              )}"
              aria-label="Ver fotografía ${index + 1}"
            >

              <img
                src="${escaparAtributoFicha(
                  foto.url
                )}"
                alt="${escaparAtributoFicha(
                  vehiculo.vehiculo
                )}"
                loading="lazy"
              >

            </button>

          `
        )
        .join("");


    // ========================================================
    // WHATSAPP
    // ========================================================

    const mensajeWhatsApp =
      encodeURIComponent(
        `Hola, quiero información sobre el vehículo ${vehiculo.vehiculo} anunciado por ${precio}.`
      );


    // ========================================================
    // DATOS ESTRUCTURADOS PRODUCT
    // ========================================================

    const datosProducto = {

      "@context":
        "https://schema.org",

      "@type":
        "Product",

      name:
        vehiculo.vehiculo,

      description:
        vehiculo.descripcion ||
        metaDescription,

      image:
        vehiculo.fotos.map(
          foto =>
            `https://utebomotorsselection.com${foto.url}`
        ),

      url:
        canonical,

      brand:
        vehiculo.marca
          ? {
              "@type":
                "Brand",

              name:
                vehiculo.marca
            }
          : undefined

    };


    if (
      vehiculo.precio !==
      null
    ) {

      datosProducto.offers = {

        "@type":
          "Offer",

        priceCurrency:
          "EUR",

        price:
          vehiculo.precio,

        availability:
          vehiculo.estado ===
          "Reservado"

            ? "https://schema.org/LimitedAvailability"

            : "https://schema.org/InStock",

        url:
          canonical

      };

    }


    const jsonLd =
      JSON.stringify(
        datosProducto
      )
        .replace(
          /</g,
          "\\u003c"
        );


    // ========================================================
    // HTML
    // ========================================================

    const html = `<!doctype html>

<html lang="es">

<head>

  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

    <!-- GOOGLE CONSENT MODE V2 - ESTADO POR DEFECTO -->
  <script>

    window.dataLayer =
      window.dataLayer || [];


    function gtag() {

      dataLayer.push(
        arguments
      );

    }


    gtag(
      "consent",
      "default",
      {

        analytics_storage:
          "denied",

        ad_storage:
          "denied",

        ad_user_data:
          "denied",

        ad_personalization:
          "denied"

      }
    );

  </script>

  <title>
    ${nombre} de segunda mano en Utebo | Utebo Motor Selection
  </title>


  <meta
    name="description"
    content="${escaparAtributoFicha(
      metaDescription
    )}"
  >


  <link
    rel="canonical"
    href="${canonical}"
  >


  <meta
    property="og:type"
    content="product"
  >

  <meta
    property="og:title"
    content="${escaparAtributoFicha(
      vehiculo.vehiculo
    )} | Utebo Motor Selection"
  >

  <meta
    property="og:description"
    content="${escaparAtributoFicha(
      metaDescription
    )}"
  >

  <meta
    property="og:image"
    content="${fotoAbsoluta}"
  >

  <meta
    property="og:url"
    content="${canonical}"
  >


  <link
    rel="stylesheet"
    href="/styles.css"
  >


  <style>

    .vehicle-detail-page {
      padding:
        54px 0 80px;
    }


    .vehicle-detail-back {
      display:
        inline-flex;

      margin-bottom:
        24px;

      color:
        #666b70;

      text-decoration:
        none;

      font-size:
        13px;

      font-weight:
        800;
    }


    .vehicle-detail-back:hover {
      color:
        #d71920;
    }


    .vehicle-detail-grid {
      display:
        grid;

      grid-template-columns:
        minmax(0, 1.15fr)
        minmax(340px, .85fr);

      gap:
        48px;

      align-items:
        start;
    }


    .vehicle-detail-main-image {
      width:
        100%;

      aspect-ratio:
        4 / 3;

      background:
        #eceeef;

      overflow:
        hidden;
    }


    .vehicle-detail-main-image img {
      width:
        100%;

      height:
        100%;

      display:
        block;

      object-fit:
        cover;
    }


    .vehicle-detail-thumbs {
      display:
        grid;

      grid-template-columns:
        repeat(
          5,
          1fr
        );

      gap:
        8px;

      margin-top:
        10px;
    }


    .vehicle-detail-thumb {
      padding:
        0;

      border:
        2px solid
        transparent;

      background:
        #eeeeee;

      aspect-ratio:
        4 / 3;

      overflow:
        hidden;

      cursor:
        pointer;
    }


    .vehicle-detail-thumb.is-active {
      border-color:
        #d71920;
    }


    .vehicle-detail-thumb img {
      width:
        100%;

      height:
        100%;

      display:
        block;

      object-fit:
        cover;
    }


    .vehicle-detail-kicker {
      color:
        #d71920;

      font-size:
        11px;

      font-weight:
        900;

      letter-spacing:
        .16em;

      text-transform:
        uppercase;
    }


    .vehicle-detail-title {
      margin:
        10px 0 6px;

      color:
        #101113;

      font-size:
        clamp(
          38px,
          5vw,
          68px
        );

      line-height:
        .95;

      text-transform:
        uppercase;
    }


    .vehicle-detail-price {
      margin:
        18px 0 26px;

      color:
        #d71920;

      font-size:
        32px;

      font-weight:
        900;
    }


    .vehicle-detail-status {
      display:
        inline-flex;

      margin-bottom:
        24px;

      padding:
        7px 10px;

      background:
        #101113;

      color:
        #ffffff;

      font-size:
        10px;

      font-weight:
        900;

      letter-spacing:
        .09em;

      text-transform:
        uppercase;
    }


    .vehicle-detail-specs {
      display:
        grid;

      grid-template-columns:
        repeat(
          2,
          1fr
        );

      border-top:
        1px solid
        rgba(18,20,23,.12);

      border-left:
        1px solid
        rgba(18,20,23,.12);
    }


    .vehicle-detail-spec {
      padding:
        17px;

      border-right:
        1px solid
        rgba(18,20,23,.12);

      border-bottom:
        1px solid
        rgba(18,20,23,.12);

      background:
        rgba(255,255,255,.72);
    }


    .vehicle-detail-spec span {
      display:
        block;

      margin-bottom:
        5px;

      color:
        #767b80;

      font-size:
        10px;

      font-weight:
        800;

      letter-spacing:
        .08em;

      text-transform:
        uppercase;
    }


    .vehicle-detail-spec strong {
      color:
        #101113;

      font-size:
        14px;
    }


    .vehicle-detail-whatsapp {
      width:
        100%;

      margin-top:
        24px;

      justify-content:
        center;
    }


    .vehicle-description-section {
      padding:
        0 0 90px;
    }


    .vehicle-description-box {
      max-width:
        900px;

      padding:
        36px;

      background:
        rgba(255,255,255,.82);

      border:
        1px solid
        rgba(18,20,23,.12);
    }


    .vehicle-description-box h2 {
      margin:
        0 0 22px;

      color:
        #101113;

      font-size:
        30px;

      text-transform:
        uppercase;
    }


    .vehicle-description-text {
      margin:
        0;

      color:
        #50555a;

      font-size:
        15px;

      line-height:
        1.8;

      white-space:
        pre-line;
    }


    @media
    (max-width: 900px) {

      .vehicle-detail-grid {
        grid-template-columns:
          1fr;
      }


      .vehicle-detail-thumbs {
        grid-template-columns:
          repeat(
            4,
            1fr
          );
      }

    }


    @media
    (max-width: 560px) {

      .vehicle-detail-page {
        padding-top:
          28px;
      }


      .vehicle-detail-title {
        font-size:
          42px;
      }


      .vehicle-detail-specs {
        grid-template-columns:
          1fr 1fr;
      }


      .vehicle-description-box {
        padding:
          24px;
      }

    }

  </style>


  <script type="application/ld+json">
    ${jsonLd}
  </script>

</head>


<body>


<header class="site-header">

  <div class="container nav-wrap">

    <a
      class="brand"
      href="/"
    >

      <img
        src="/assets/logo-utebo-motor-selection.jpeg"
        alt="Utebo Motor Selection"
      >

    </a>


    <button
      class="menu-toggle"
      aria-label="Abrir menú"
    >
      ☰
    </button>


    <nav class="nav-links">

      <a href="/">
        Inicio
      </a>

      <a href="/catalogo.html">
        Catálogo
      </a>

      <a href="/servicios.html">
        Servicios
      </a>

      <a href="/reposiciones.html">
        Reposiciones
      </a>

      <a href="/nosotros.html">
        Nosotros
      </a>

      <a
        class="nav-cta"
        href="https://wa.me/34614601189"
        target="_blank"
        rel="noopener"
      >
        WhatsApp
      </a>

    </nav>

  </div>

</header>


<main>


  <section
    class="vehicle-detail-page"
  >

    <div class="container">


      <a
        class="vehicle-detail-back"
        href="/catalogo.html"
      >
        ← Volver al catálogo
      </a>


      <div
        class="vehicle-detail-grid"
      >


        <div>


          <div
            class="vehicle-detail-main-image"
          >

            <img
              id="vehicleDetailMainImage"
              src="${escaparAtributoFicha(
                fotoPrincipal
              )}"
              alt="${escaparAtributoFicha(
                vehiculo.vehiculo
              )}"
            >

          </div>


          ${
            vehiculo.fotos.length > 1

              ? `
                  <div
                    class="vehicle-detail-thumbs"
                  >
                    ${miniaturasHtml}
                  </div>
                `

              : ""
          }


        </div>


        <div>


          <div
            class="vehicle-detail-kicker"
          >
            Vehículo de ocasión
          </div>


          <h1
            class="vehicle-detail-title"
          >
            ${nombre}
          </h1>


          <div
            class="vehicle-detail-price"
          >
            ${escaparHtmlFicha(
              precio
            )}
          </div>


          <div
            class="vehicle-detail-status"
          >
            ${escaparHtmlFicha(
              vehiculo.estado
            )}
          </div>


          <div
            class="vehicle-detail-specs"
          >
            ${caracteristicasHtml}
          </div>


          <a
            class="
              btn
              btn-primary
              vehicle-detail-whatsapp
            "
            href="https://wa.me/34614601189?text=${mensajeWhatsApp}"
            target="_blank"
            rel="noopener"
          >
            Consultar por WhatsApp
          </a>


        </div>


      </div>

    </div>

  </section>


  ${
    vehiculo.descripcion

      ? `
          <section
            class="vehicle-description-section"
          >

            <div class="container">

              <div
                class="vehicle-description-box"
              >

                <div
                  class="section-kicker"
                >
                  Información del vehículo
                </div>

                <h2>
                  Descripción completa
                </h2>


                <p
                  class="vehicle-description-text"
                >${escaparHtmlFicha(
                  vehiculo.descripcion
                )}</p>

              </div>

            </div>

          </section>
        `

      : ""
  }


</main>


<footer class="site-footer">

  <div class="container">

    <div class="footer-grid">


      <div>

        <img
          class="footer-logo"
          src="/assets/logo-utebo-motor-selection.jpeg"
          alt="Utebo Motor Selection"
        >

        <div>
          Compra, venta y búsqueda personalizada
          de vehículos en Utebo.
        </div>

      </div>


      <div>

        <div class="footer-title">
          Navegación
        </div>

        <div class="footer-links">

          <a href="/catalogo.html">
            Catálogo
          </a>

          <a href="/servicios.html">
            Servicios
          </a>

          <a href="/reposiciones.html">
            Reposiciones
          </a>

          <a href="/nosotros.html">
            Nosotros
          </a>

        </div>

      </div>


      <div>

        <div class="footer-title">
          Contacto
        </div>

        <div class="footer-links">

          <a
            href="https://wa.me/34614601189"
            target="_blank"
            rel="noopener"
          >
            WhatsApp:
            +34 614 60 11 89
          </a>

          <span>
            Av. Zaragoza 22, Utebo
          </span>

        </div>

      </div>


    </div>


    <div class="footer-bottom">

      <span>
        © 2026 Utebo Motor Selection
      </span>

      <span>
        Vehículos · Alemania · Reposiciones
      </span>

    </div>

  </div>

</footer>


<div class="footer-legal">

  <span>
    © 2026 Utebo Motor Selection
  </span>

  <a href="/aviso-legal.html">
    Aviso legal
  </a>

  <a href="/privacidad.html">
    Política de privacidad
  </a>

  <a href="/cookies.html">
    Política de cookies
  </a>

</div>


<a
  class="whatsapp-float"
  href="https://wa.me/34614601189"
  target="_blank"
  rel="noopener"
  aria-label="Abrir WhatsApp"
>

  <svg
    viewBox="0 0 32 32"
    aria-hidden="true"
  >

    <path
      d="M16 4.2a11 11 0 0 0-9.5 16.5L5 27l6.5-1.4A11 11 0 1 0 16 4.2Z"
    />

    <path
      d="M11.6 10.3c.5 4.7 5.4 9.6 10.1 10.1l1.7-2.3-3.2-1.5-1.3 1.3c-2.2-.8-4-2.6-4.8-4.8l1.3-1.3-1.5-3.2-2.3 1.7Z"
    />

  </svg>

</a>


<script src="/script.js"></script>

<script>

  document
    .querySelectorAll(
      "[data-gallery-src]"
    )
    .forEach(
      boton => {

        boton.addEventListener(
          "click",
          () => {

            const imagen =
              document.getElementById(
                "vehicleDetailMainImage"
              );


            imagen.src =
              boton.dataset.gallerySrc;


            document
              .querySelectorAll(
                ".vehicle-detail-thumb"
              )
              .forEach(
                item =>
                  item.classList.remove(
                    "is-active"
                  )
              );


            boton.classList.add(
              "is-active"
            );

          }
        );

      }
    );

</script>


<script
  src="/cookie-consent.js"
  defer
></script>


</body>

</html>`;


    return new Response(
      html,
      {
        headers: {

          "Content-Type":
            "text/html; charset=UTF-8",

          "Cache-Control":
            "no-store"

        }
      }
    );


  } catch (error) {

    console.error(
      "Ficha vehículo:",
      error
    );


    return new Response(
      "No se pudo cargar el vehículo",
      {
        status: 500
      }
    );

  }

}


// ============================================================
// FICHA - CREAR SLUG
// ============================================================

function crearSlugVehiculo(
  texto
) {

  return String(
    texto || "vehiculo"
  )

    .normalize(
      "NFD"
    )

    .replace(
      /[\u0300-\u036f]/g,
      ""
    )

    .toLowerCase()

    .replace(
      /[^a-z0-9]+/g,
      "-"
    )

    .replace(
      /^-+|-+$/g,
      ""
    )

    ||
    "vehiculo";

}


// ============================================================
// FICHA - ESCAPAR HTML
// ============================================================

function escaparHtmlFicha(
  valor
) {

  return String(
    valor ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// ============================================================
// FICHA - ESCAPAR ATRIBUTO
// ============================================================

function escaparAtributoFicha(
  valor
) {

  return escaparHtmlFicha(
    valor
  );

}


// ============================================================
// FICHA - FORMATEAR NÚMERO
// ============================================================

function formatearNumeroFicha(
  valor
) {

  const numero =
    Number(
      valor
    );


  if (
    !Number.isFinite(
      numero
    )
  ) {

    return "";

  }


  return new Intl
    .NumberFormat(
      "es-ES"
    )
    .format(
      numero
    );

}

// ============================================================
// NORMALIZAR FECHA DISPONIBLE
// ============================================================

function normalizarFechaDisponible(
  valor
) {

  const fecha =
    String(
      valor || ""
    ).trim();


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      fecha
    )
  ) {

    return null;

  }


  return fecha;

}

// ============================================================
// SITEMAP - PÁGINAS GENERALES Y VEHÍCULOS PUBLICABLES
// ============================================================

async function servirSitemap(request, env) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" }
    });
  }

  try {
    const paginas = [
      "/",
      "/catalogo.html",
      "/alquiler.html",
      "/servicios.html",
      "/reposiciones.html",
      "/nosotros.html"
    ];

    const resultado = await env.DB.prepare(`
      SELECT id, vehiculo
      FROM vehiculos
      WHERE publicado = 1
        AND (estado IS NULL OR estado NOT IN ("Vendido", "Alquilado"))
      ORDER BY id ASC
    `).all();

    const urls = paginas.concat(
      (resultado.results || []).map(vehiculo =>
        `/vehiculo/${vehiculo.id}-${crearSlugVehiculo(vehiculo.vehiculo)}`
      )
    );

    const xmlUrls = urls.map(ruta =>
      `  <url><loc>https://utebomotorsselection.com${escaparHtmlFicha(ruta)}</loc></url>`
    ).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>
`;

    return new Response(request.method === "HEAD" ? null : xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Generar sitemap:", error);
    return new Response(request.method === "HEAD" ? null : "Sitemap temporalmente no disponible", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "300"
      }
    });
  }
}
