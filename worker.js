export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API de prueba
    if (url.pathname === "/api/test") {
      return Response.json({
        ok: true,
        proyecto: "Utebo Motor Selection",
        mensaje: "API funcionando correctamente"
      });
    }

    // Para cualquier otra petición, servir la web normal
    return env.ASSETS.fetch(request);
  }
};
