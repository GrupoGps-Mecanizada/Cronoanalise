/**
 * Publica a Cronoanálise no Cloudflare Pages (projeto `sge-cronoanalise`, conta sistemagestaoempresa), em /cronoanalise/,
 * para abrir dentro do Portal SGE (o portal repassa sge-portal.pages.dev/cronoanalise/ para cá). Igual ao SST.
 *
 * 1. Copia só o site (index.html, css, js, assets) para ../dist-cloudflare/cronoanalise/ (fora do GitHub).
 * 2. Gera _headers (segurança; frame-ancestors 'self' para o portal mostrar na moldura) e _redirects (raiz → /cronoanalise/).
 * 3. `wrangler pages deploy` (pede `npx wrangler login` uma vez, com a conta sistemagestaoempresa).
 *
 * Uso (na pasta cronoanalise): `node scripts/publicar-cloudflare.mjs`  ·  `--sem-enviar` faz só os passos 1 e 2.
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJETO = 'sge-cronoanalise';
const BASE = 'cronoanalise';
const WRANGLER = 'wrangler@4.138.0';
const SUPABASE = 'https://mfsyrsegkvjmefcdaegh.supabase.co';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, '..', 'dist-cloudflare');

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline': tema aplicado antes de desenhar (evita piscar) e um botão "Tentar de novo" do painel.
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob:",
  `connect-src ${SUPABASE} ${SUPABASE.replace('https', 'wss')}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(join(DESTINO, BASE), { recursive: true });
for (const item of ['index.html', 'css', 'js', 'assets']) cpSync(join(RAIZ, item), join(DESTINO, BASE, item), { recursive: true });

writeFileSync(join(DESTINO, '_headers'), [
  '/*',
  `  Content-Security-Policy: ${CSP}`,
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '',
  `/${BASE}/index.html`,
  '  Cache-Control: no-cache',
  ''
].join('\n'));
writeFileSync(join(DESTINO, '_redirects'), `/ /${BASE}/ 302\n`);
console.log('Pasta pronta:', DESTINO);

if (!process.argv.includes('--sem-enviar')) {
  execSync(`npx --yes ${WRANGLER} pages deploy "${DESTINO}" --project-name ${PROJETO} --branch main --commit-dirty=true`, { stdio: 'inherit' });
}
