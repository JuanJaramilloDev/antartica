export async function GET(request: Request): Promise<Response> {
  const secreto = process.env['CRON_SECRET'];
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

  let respuesta: Response;
  try {
    respuesta = await fetch(`${url}/rest/v1/rpc/ping`, {
      method: 'POST',
      headers: { apikey: clave, 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch (error) {
    console.error('No se pudo conectar con Supabase', error);
    return Response.json(
      { ok: false, error: 'No se pudo conectar con Supabase', detalle: String(error) },
      { status: 502 },
    );
  }
  const cuerpo = await respuesta.text();

  if (!respuesta.ok) {
    console.error('Ping a Supabase falló', respuesta.status, cuerpo);
    return Response.json({ ok: false, estado: respuesta.status, detalle: cuerpo }, { status: 502 });
  }

  console.log('Ping a Supabase OK', cuerpo);
  return Response.json({ ok: true, supabase: JSON.parse(cuerpo) });
}
