export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------------------------------------------------------
    // API DE PRUEBA
    // ---------------------------------------------------------
    if (url.pathname === "/api/test") {
      return Response.json({
        ok: true,
        proyecto: "Utebo Motor Selection",
        mensaje: "API funcionando correctamente"
      });
    }

    // ---------------------------------------------------------
    // VEHÍCULOS DESDE AIRTABLE
    // ---------------------------------------------------------
    if (url.pathname === "/api/vehiculos") {
      try {
        if (
          !env.AIRTABLE_TOKEN ||
          !env.AIRTABLE_BASE_ID ||
          !env.AIRTABLE_TABLE_VEHICULOS ||
          !env.AIRTABLE_VIEW_VEHICULOS
        ) {
          return Response.json(
            {
              ok: false,
              error: "Faltan variables de configuración de Airtable"
            },
            { status: 500 }
          );
        }

        const airtableUrl =
          `https://api.airtable.com/v0/` +
          `${env.AIRTABLE_BASE_ID}/` +
          `${env.AIRTABLE_TABLE_VEHICULOS}` +
          `?view=${encodeURIComponent(env.AIRTABLE_VIEW_VEHICULOS)}` +
          `&pageSize=100`;

        const airtableResponse = await fetch(airtableUrl, {
          headers: {
            Authorization: `Bearer ${env.AIRTABLE_TOKEN}`
          }
        });

if (!airtableResponse.ok) {
  const errorText = await airtableResponse.text();

  return Response.json(
    {
      ok: false,
      error: "No se pudieron obtener los vehículos de Airtable",
      status: airtableResponse.status,
      detalle: errorText
    },
    { status: 502 }
  );
}

        const data = await airtableResponse.json();

        const vehiculos = data.records.map((record) => {
          const f = record.fields;

          return {
            id: record.id,

            vehiculo: f["Vehículo"] || "",
            estado: f["Estado"] || "",
            destacado: f["Destacado"] || false,

            marca: f["Marca"] || "",
            modelo: f["Modelo"] || "",
            version: f["Versión"] || "",

            precio: f["Precio"] || null,
            ano: f["Año"] || null,
            kilometros: f["Kilómetros"] || null,

            combustible: f["Combustible"] || "",
            cambio: f["Cambio"] || "",
            potencia: f["Potencia"] || null,
            procedencia: f["Procedencia"] || "",

            descripcion: f["Descripción"] || "",

            fotos: Array.isArray(f["Fotos"])
              ? f["Fotos"].map((foto) => ({
                  url: foto.url,
                  nombre: foto.filename || "",
                  tipo: foto.type || ""
                }))
              : [],

            orden: f["Orden"] || 999
          };
        });

        vehiculos.sort((a, b) => a.orden - b.orden);

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
        console.error(error);

        return Response.json(
          {
            ok: false,
            error: "Error interno obteniendo vehículos"
          },
          { status: 500 }
        );
      }
    }

    // ---------------------------------------------------------
    // RESTO DE LA WEB ESTÁTICA
    // ---------------------------------------------------------
    return env.ASSETS.fetch(request);
  }
};
