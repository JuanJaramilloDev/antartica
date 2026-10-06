// Crea src/environments/entorno.ts a partir de variables de entorno.
// Ese archivo no se sube a git, así que en Vercel se genera al compilar con
// SUPABASE_URL y SUPABASE_ANON_KEY. En tu PC, si ya existe, no se toca.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const destino = new URL('../src/environments/entorno.ts', import.meta.url);
// En Vercel la carpeta no existe: su único archivo (entorno.ts) no se sube a git.
mkdirSync(new URL('.', destino), { recursive: true });
const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_ANON_KEY;

if (url && clave) {
  writeFileSync(
    destino,
    `// Generado por scripts/crear-entorno.mjs. No editar a mano en Vercel.\n` +
      `export const entorno = {\n` +
      `  supabaseUrl: ${JSON.stringify(url.replace(/\/+$/, ''))},\n` +
      `  supabaseAnonKey: ${JSON.stringify(clave)},\n` +
      `};\n`,
  );
  console.log('entorno.ts creado desde las variables de entorno.');
} else if (existsSync(destino)) {
  console.log('entorno.ts ya existe; se usa el local.');
} else {
  console.error(
    'Falta src/environments/entorno.ts. Define SUPABASE_URL y SUPABASE_ANON_KEY ' +
      '(en Vercel: Settings → Environment Variables) o crea el archivo con esos datos.',
  );
  process.exit(1);
}
