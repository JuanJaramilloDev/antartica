// Ping a Supabase para que el proyecto gratis no se pause por inactividad (7 días).
// Vercel Cron lo llama cada 5 días (ver vercel.json). También se puede abrir a mano
// pasando el secreto: /api/ping con el encabezado "Authorization: Bearer <CRON_SECRET>".
//
// Variables de entorno en Vercel: SUPABASE_URL, SUPABASE_ANON_KEY y CRON_SECRET.

export async function GET(request: Request): Promise<Response> {
  const secreto = process.env['CRON_SECRET'];
  // Vercel Cron manda "Authorization: Bearer <CRON_SECRET>" automáticamente.
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const url = process.env['SUPABASE_URL'];
  const clave = process.env['SUPABASE_ANON_KEY'];
  if (!url || !clave) {
    return Response.json(
      { ok: false, error: 'Faltan SUPABASE_URL o SUPABASE_ANON_KEY en Vercel' },
      { status: 500 },
    );
  }

  const respuesta = await fetch(`${url}/rest/v1/rpc/ping`, {
    method: 'POST',
    headers: { apikey: clave, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const cuerpo = await respuesta.text();

  if (!respuesta.ok) {
    console.error('Ping a Supabase falló', respuesta.status, cuerpo);
    return Response.json({ ok: false, estado: respuesta.status, detalle: cuerpo }, { status: 502 });
  }

  console.log('Ping a Supabase OK', cuerpo);
  return Response.json({ ok: true, supabase: JSON.parse(cuerpo) });
}
