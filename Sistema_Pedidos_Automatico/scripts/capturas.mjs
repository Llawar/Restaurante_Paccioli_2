/**
 * Script de capturas de pantalla del Kiosco Paccioli
 * ---------------------------------------------------
 * Recorre el flujo completo del cliente y guarda cada pantalla
 * como imagen en la carpeta ./screenshots/
 *
 * Uso:  node scripts/capturas.mjs
 * Requisitos: dev server corriendo (npm run dev) + backend activo (puerto 3006)
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';

const URL = 'http://localhost:5174';
const OUT = 'screenshots';
const VP = { width: 1280, height: 800, deviceScaleFactor: 2 }; // Tablet landscape

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Hace clic en un elemento cuyo texto visible coincida (exacto o parcial). */
async function clickTexto(page, texto, { exacto = true, tag = 'button' } = {}) {
  const ok = await page.evaluate(
    ({ texto, exacto, tag }) => {
      const els = [...document.querySelectorAll(tag)];
      const el = els.find((e) => {
        const t = e.textContent.trim().toLowerCase();
        return exacto ? t === texto.toLowerCase() : t.includes(texto.toLowerCase());
      });
      if (el) { el.click(); return true; }
      return false;
    },
    { texto, exacto, tag }
  );
  if (!ok) throw new Error(`No se encontró <${tag}> con texto "${texto}"`);
}

async function disparar(page, nombre) {
  const ruta = `${OUT}/${nombre}.png`;
  await page.screenshot({ path: ruta });
  console.log(`📸 ${ruta}`);
}

// ---------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--disable-gpu'],
  defaultViewport: VP,
});

const page = await browser.newPage();

console.log('🌐 Abriendo el kiosco...');
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
await esperar(1500); // animaciones de la pantalla de inicio

// 1) Pantalla de inicio
await disparar(page, '01-inicio');

// 2) Menú (categoría platos)
await page.mouse.click(VP.width / 2, VP.height / 2); // tocar la pantalla de inicio
await esperar(1000);
await page.waitForFunction(
  () => document.querySelector('.grid') || document.body.innerText.includes('Cargando'),
  { timeout: 15000 }
);
// Esperar a que termine la carga de productos (que no diga "Cargando productos")
await page.waitForFunction(
  () => !document.body.innerText.includes('Cargando productos'),
  { timeout: 20000 }
).catch(() => console.warn('⚠️ La carga de productos tardó demasiado. ¿Está el backend activo?'));
await esperar(1200);
await disparar(page, '02-menu-platos');

// Verificar que haya productos
const hayProductos = await page.evaluate(() => !!document.querySelector('.grid > div'));
if (!hayProductos) {
  console.error('❌ No hay productos en el menú. Verifica el backend e intenta de nuevo.');
  await browser.close();
  process.exit(1);
}

// Tomar el nombre del primer producto disponible para luego buscarlo
const primerProducto = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.grid > div')].find(
    (c) => !c.textContent.includes('Agotado')
  );
  return card ? card.querySelector('h3')?.textContent : null;
});

// 3) Menú (categoría bebidas)
await clickTexto(page, 'bebidas');
await esperar(900);
await disparar(page, '03-menu-bebidas');

// 4) Menú (categoría postres)
await clickTexto(page, 'postres');
await esperar(900);
await disparar(page, '04-menu-postres');

// 5) Búsqueda de producto (volvemos a platos y escribimos)
await clickTexto(page, 'platos');
await esperar(800);
await page.click('input[placeholder*="Buscar"]');
await page.type('input[placeholder*="Buscar"]', primerProducto ?? '', { delay: 60 });
await esperar(600);
await disparar(page, '05-busqueda-producto');
// Limpiar búsqueda
await page.evaluate(() => { document.querySelector('input').value = ''; });
await page.keyboard.press('Escape');
await page.evaluate(() => {
  const input = document.querySelector('input');
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
// Forzar limpieza real (React controla el input)
await page.click('input[placeholder*="Buscar"]', { clickCount: 3 });
await page.keyboard.press('Backspace');
await esperar(600);

// 6) Detalle del producto (abrir modal)
await page.evaluate(() => {
  const card = [...document.querySelectorAll('.grid > div')].find(
    (c) => !c.textContent.includes('Agotado')
  );
  card?.click();
});
await esperar(1000);
await disparar(page, '06-detalle-producto');

// Subir la cantidad a 2 (botón "+" del modal: el que precede al botón AÑADIR)
await page.evaluate(() => {
  const botones = [...document.querySelectorAll('button')];
  const anadir = botones.find((b) => b.textContent.includes('AÑADIR AL PEDIDO'));
  if (anadir) {
    const idx = botones.indexOf(anadir);
    botones[idx - 1]?.click(); // botón "+" de cantidad
  }
});
await esperar(400);

// 7) Agregar al carrito
await clickTexto(page, 'AÑADIR AL PEDIDO', { exacto: false });
await esperar(900);
await disparar(page, '07-carrito');

// 8) Checkout / resumen
await clickTexto(page, 'PAGAR AHORA', { exacto: false });
await esperar(1000);
await disparar(page, '08-checkout');

// 9) Pantalla de pago QR
await clickTexto(page, 'CONFIRMAR Y PAGAR', { exacto: false });
await esperar(1000);
await disparar(page, '09-pago-qr');

// 10) Confirmación (¡rápido, vuelve al inicio en 5s!)
await clickTexto(page, 'SIMULAR PAGO EXITOSO', { exacto: false });
await esperar(1800);
await disparar(page, '10-confirmacion');

await browser.close();
console.log('\n✅ ¡Listo! Capturas guardadas en ./screenshots/');
