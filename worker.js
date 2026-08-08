export default {
  async fetch(request, env) {
    const url = new URL(request.url);

// ---------------------------------------------------------
// TEST D1 + R2
// ---------------------------------------------------------

if (url.pathname === "/api/storage-test") {
  try {

    // Comprobar D1
    const dbTest = await env.DB
      .prepare("SELECT COUNT(*) AS total FROM vehiculos")
      .first();

    // Comprobar R2 sin escribir nada
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
    
    // ---------------------------------------------------------
    // TEST
    // ---------------------------------------------------------
    if (url.pathname === "/api/test") {
      return Response.json({
        ok: true,
        proyecto: "Utebo Motor Selection"
      });
    }

    // ---------------------------------------------------------
    // VEHÍCULOS
    // ---------------------------------------------------------
    if (url.pathname === "/api/vehiculos") {
      try {
        if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE_ID) {
          return Response.json(
            {
              ok: false,
              error: "Configuración de Airtable incompleta"
            },
            { status: 500 }
          );
        }

        const table = encodeURIComponent("Vehículos");
        const view = encodeURIComponent("WEB - Publicados");

        const airtableUrl =
          `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${table}` +
          `?view=${view}&pageSize=100`;

        const response = await fetch(airtableUrl, {
          headers: {
            Authorization: `Bearer ${env.AIRTABLE_TOKEN}`
          }
        });

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
            { status: 502 }
          );
        }

        const data = await response.json();

        const vehiculos = data.records
          .map((record) => {
            const f = record.fields;

            return {
              id: record.id,

              vehiculo: f["Vehículo"] || "",
              estado: f["Estado"] || "Disponible",
              destacado: Boolean(f["Destacado"]),

              marca: f["Marca"] || "",
              modelo: f["Modelo"] || "",
              version: f["Versión"] || "",

              precio: f["Precio"] ?? null,
              ano: f["Año"] ?? null,
              kilometros: f["Kilómetros"] ?? null,

              combustible: f["Combustible"] || "",
              cambio: f["Cambio"] || "",
              potencia: f["Potencia"] ?? null,
              procedencia: f["Procedencia"] || "",

              descripcion: f["Descripción"] || "",

              fotos: Array.isArray(f["Fotos"])
                ? f["Fotos"].map((foto) => ({
                    url:
                      foto.thumbnails?.large?.url ||
                      foto.thumbnails?.full?.url ||
                      foto.url,
                    nombre: foto.filename || ""
                  }))
                : [],

              orden: f["Orden"] ?? 999
            };
          })
          .sort((a, b) => a.orden - b.orden);

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
        console.error("Error API vehículos:", error);

        return Response.json(
          {
            ok: false,
            error: "Error interno cargando vehículos"
          },
          { status: 500 }
        );
      }
    }

    // ---------------------------------------------------------
    // WEB
    // ---------------------------------------------------------
    return env.ASSETS.fetch(request);
  }
};
