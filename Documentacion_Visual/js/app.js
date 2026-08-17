/* ============================================================
   Restaurante Paccioli — Presentación 3D de arquitectura
   Escena Three.js: restaurante + figuras 3D + tour guiado
   ============================================================ */
(function () {
  'use strict';

  // ---------- Definición de sistemas ----------
  const SISTEMAS = [
    { clave: 'servidor', nombre: 'Servidor Windows Server 2022', sub: 'Cómputo principal · on-premises',
      icono: 'bi-windows', color: '#2b6cb0', tipo: 'servidor',
      x: 0.0, z: -3.2, y: 0.3,
      desc: 'Servidor donde corre todo el stack del restaurante (Windows Server 2022).',
      stack: 'Windows Server 2022', puerto: 'Local · red LAN',
      roles: ['Aloja backend', 'Aloja MySQL', 'Corre el túnel'] },
    { clave: 'backend', nombre: 'Backend Express', sub: 'API :3006 · Socket.IO',
      icono: 'bi-cpu', color: '#f59e0b', tipo: 'rack',
      x: -3.4, z: -1.7, y: 0.3,
      desc: 'API REST y Socket.IO que centraliza la lógica del restaurante.',
      stack: 'Express + TypeScript', puerto: ':3006',
      roles: ['Sirve catálogo', 'Crea pedidos', 'Emite eventos en vivo'] },
    { clave: 'mysql', nombre: 'MySQL', sub: 'Base de datos',
      icono: 'bi-database', color: '#22c55e', tipo: 'bd',
      x: 3.6, z: -1.7, y: 0.3,
      desc: 'Almacén de productos, pedidos e inventario.',
      stack: 'MySQL', puerto: '3306',
      roles: ['Guarda catálogo', 'Guarda pedidos', 'Lleva stock'] },
    { clave: 'admin', nombre: 'Sistema de Administración', sub: 'POS web · Frontend',
      icono: 'bi-display', color: '#0ea5e9', tipo: 'monitor',
      x: -3.8, z: 2.2, y: 0.3,
      desc: 'Panel web de gestión del restaurante (productos, inventario, pedidos, usuarios).',
      stack: 'React + Vite', puerto: 'Navegador',
      roles: ['Gestiona catálogo', 'Ve reportes', 'Administra usuarios'] },
    { clave: 'caja', nombre: 'Caja / POS venta física', sub: 'Venta en sala · rol empleado',
      icono: 'bi-cash-coin', color: '#f97316', tipo: 'caja',
      x: -3.0, z: 4.4, y: 0.3,
      desc: 'Puesto físico de venta junto a la entrada: el mismo Sistema Admin pero con rol empleado para vender productos y cobrar en sala.',
      stack: 'POS Admin (rol empleado)', puerto: 'Frontend del restaurante',
      roles: ['Vende productos', 'Cobra en sala', 'Genera pedido a cocina'] },
    { clave: 'kiosco', nombre: 'Kiosco de Pedidos Gourmet', sub: 'Tablet en sala',
      icono: 'bi-tablet', color: '#7dd3fc', tipo: 'tablet',
      x: -1.4, z: 3.1, y: 0.3,
      desc: 'Kiosco para que el cliente arme su pedido en la tablet.',
      stack: 'React + Vite', puerto: 'Público kiosco',
      roles: ['Arma pedido en sala', 'Envía a cocina'] },
    { clave: 'cocina', nombre: 'App Cocina', sub: 'Pantalla + fogón',
      icono: 'bi-egg-fried', color: '#ef4444', tipo: 'cocina',
      x: 1.6, z: 2.2, y: 0.3,
      desc: 'Pantalla de cocina que muestra pedidos/puestos en tiempo real.',
      stack: 'React + Vite', puerto: 'Público cocina',
      roles: ['Ve pedidos en vivo', 'Marca platillos listos'] },
    { clave: 'display', nombre: 'Display Clientes', sub: 'TV en sala',
      icono: 'bi-tv', color: '#16a34a', tipo: 'tv',
      x: 3.6, z: 3.1, y: 0.3,
      desc: 'Pantalla para el cliente que muestra el avance del pedido.',
      stack: 'React + Tailwind', puerto: 'Público display',
      roles: ['Muestra número/estado en vivo'] },
    { clave: 'supabase', nombre: 'Supabase Cloud', sub: 'auth · pedidos · realtime',
      icono: 'bi-cloud-fill', color: '#f43f5e', tipo: 'nube',
      x: 5.8, z: -0.6, y: 0.3,
      desc: 'Backend en la nube de la Delivery_app (PostgreSQL + auth + realtime).',
      stack: 'Supabase (PostgreSQL)', puerto: 'Cloud · HTTPS',
      roles: ['Auth de clientes', 'Realtime repartidor', 'Historial'] },
    { clave: 'delivery', nombre: 'Delivery_app', sub: 'Flutter móvil',
      icono: 'bi-phone', color: '#818cf8', tipo: 'phone',
      x: 4.1, z: 1.2, y: 1.3,
      desc: 'App móvil para pedir a domicilio, con seguimiento del repartidor.',
      stack: 'Flutter · Dart', puerto: 'Móvil',
      roles: ['Cliente: pide delivery', 'Repartidor: entrega'] },
    { clave: 'tunel', nombre: 'Túnel Cloudflare', sub: 'Acceso público',
      icono: 'bi-globe2', color: '#a855f7', tipo: 'globe',
      x: -5.6, z: -0.2, y: 1.2,
      desc: 'Exposición segura del backend a Internet para la Delivery_app fuera de LAN.',
      stack: 'cloudflared', puerto: 'HTTPS público',
      roles: ['Acceso remoto', 'Puente app ↔ backend'] },
  ];

  // Enlaces entre sistemas (cables 3D)
  const CABLES = [
    ['servidor', 'backend'],
    ['servidor', 'mysql'],
    ['backend', 'mysql'],
    ['backend', 'admin'],
    ['backend', 'kiosco'],
    ['backend', 'cocina'],
    ['backend', 'display'],
    ['caja', 'backend'],
    ['caja', 'cocina'],
    ['kiosco', 'cocina'],
    ['delivery', 'supabase'],
    ['delivery', 'tunel'],
    ['tunel', 'servidor'],
  ];

  const COLOR_IDLE = 0x54618f;
  const COLOR_ACTIVO = 0x22d3ee;
  let SPEED = 1;

  // ---------- Escena, cámara, renderer ----------
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0e1a);
  scene.fog = new THREE.Fog(0x0b0e1a, 16, 28);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 8, 13);

  // ---------- Iluminación ----------
  scene.add(new THREE.HemisphereLight(0x94c5ff, 0x1a1a2e, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(6, 12, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -13; sun.shadow.camera.right = 13;
  sun.shadow.camera.top = 13; sun.shadow.camera.bottom = -13;
  sun.shadow.camera.far = 30;
  scene.add(sun);
  const sun2 = new THREE.DirectionalLight(0x94a3ff, 0.35);
  sun2.position.set(-4, 6, -6);
  scene.add(sun2);

  // ============ SUELO y paredes ============
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 12),
    new THREE.MeshStandardMaterial({ color: 0x1c2340, roughness: 0.9, metalness: 0.05 })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  scene.add(suelo);

  const grid = new THREE.GridHelper(16, 16, 0x33406b, 0x232c4d);
  grid.position.y = 0.01;
  scene.add(grid);

  const paredMat = new THREE.MeshStandardMaterial({ color: 0x161b2e, roughness: 0.95, transparent: true, opacity: 0.5 });
  function pared(w, h, d, x, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paredMat);
    m.position.set(x, h / 2, z);
    scene.add(m);
  }
  pared(16, 2.6, 0.2, 0, -6.05);
  pared(6.8, 2.6, 0.2, -4.6, 6.05);
  pared(6.8, 2.6, 0.2, 4.6, 6.05);
  pared(0.2, 2.6, 12.3, -8.05, 0);
  pared(0.2, 2.6, 12.3, 8.05, 0);

  // ============ Puerta doble (abierta de par en par) ============
  const marcoMat = new THREE.MeshStandardMaterial({ color: 0x2a3350, roughness: 0.8, metalness: 0.1 });
  const marcoL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.24), marcoMat);
  marcoL.position.set(-1.2, 1.3, 6.05); scene.add(marcoL);
  const marcoR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.24), marcoMat);
  marcoR.position.set(1.2, 1.3, 6.05); scene.add(marcoR);
  const dintel = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.2, 0.24), marcoMat);
  dintel.position.set(0, 2.5, 6.05); scene.add(dintel);

  const hojaMat = new THREE.MeshStandardMaterial({ color: 0x3a4a76, roughness: 0.7, metalness: 0.12 });
  const hojaL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.08), hojaMat);
  hojaL.position.set(-1.25, 1.2, 6.6); scene.add(hojaL);
  const hojaR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.08), hojaMat);
  hojaR.position.set(1.25, 1.2, 6.6); scene.add(hojaR);

  const tiraMat = new THREE.MeshStandardMaterial({ color: 0xd9c27a, roughness: 0.35, metalness: 0.7 });
  const tira1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), tiraMat);
  tira1.position.set(-0.72, 1.1, 6.15); scene.add(tira1);
  const tira2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), tiraMat);
  tira2.position.set(0.72, 1.1, 6.15); scene.add(tira2);

  // felpudo de entrada dentro de la sala
  const felpudo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x12351d, roughness: 1 })
  );
  felpudo.rotation.x = -Math.PI / 2;
  felpudo.position.set(0, 0.015, 5.5);
  felpudo.receiveShadow = true;
  scene.add(felpudo);

  // ============ Utilidades mesh sólidas ============
  function meshBox(w, h, d, color, opts) {
    return new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.55, metalness: 0.15 }, opts || {}))
    );
  }
  function meshCyl(r, h, color) {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 24),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.2 })
    );
  }

  // ============ Mesas y sillas ============
  function mesa(x, z) {
    const g = new THREE.Group();
    const top = meshBox(1.4, 0.1, 0.9, 0x3a4a76);
    top.position.y = 0.75; top.castShadow = true; g.add(top);
    const patas = [[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]];
    for (const [px, pz] of patas) {
      const leg = meshBox(0.09, 0.72, 0.09, 0x232a45);
      leg.position.set(px, 0.36, pz); g.add(leg);
    }
    g.position.set(x, 0, z);
    scene.add(g);
  }
  function silla(x, z, rY) {
    const g = new THREE.Group();
    const as = meshBox(0.42, 0.06, 0.42, 0x3a4a76);
    as.position.y = 0.42; g.add(as);
    const back = meshBox(0.42, 0.5, 0.05, 0x3a4a76);
    back.position.set(0, 0.7, -0.2); g.add(back);
    for (const sx of [-0.18, 0.18]) {
      const leg = meshBox(0.05, 0.42, 0.05, 0x232a45);
      leg.position.set(sx, 0.2, 0.15); g.add(leg);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rY || 0;
    scene.add(g);
  }

  const posMesas = [[-2, 1.3], [-0.4, 1.3], [1.4, 1.3], [-1.2, 2.5], [0.2, 2.5], [1.8, 2.5]];
  posMesas.forEach(([x, z]) => {
    mesa(x, z);
    silla(x - 0.9, z, 0); silla(x + 0.9, z, Math.PI);
    silla(x, z - 0.9, 0); silla(x, z + 0.9, Math.PI);
  });

  // ============ Figuras 3D de cada sistema ============
  const hexColor = (c) => new THREE.Color(c);

  function mat(color, glow) {
    return new THREE.MeshStandardMaterial({
      color: hexColor(color),
      roughness: 0.45, metalness: 0.25,
      emissive: glow ? 0x0a0a22 : 0,
      emissiveIntensity: glow ? 0.5 : 0,
    });
  }

  function pantalla(tamX, tamY, alto, color, esc) {
    const g = new THREE.Group();
    const marco = new THREE.Mesh(new THREE.BoxGeometry(tamX, tamY, 0.06), mat(color, false));
    marco.position.y = alto; g.add(marco);
    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(tamX * 0.82, tamY * 0.78),
      new THREE.MeshStandardMaterial({ color: 0x0a1230, emissive: 0x22d3ee, emissiveIntensity: 0.55, roughness: 0.3 })
    );
    pane.position.set(0, alto, 0.035); g.add(pane);
    const base = new THREE.Mesh(new THREE.BoxGeometry(tamX * 0.7, 0.14, 0.3), mat(0x11172c, false));
    base.position.y = 0.07; g.add(base);
    const pie = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), mat(0x11172c, false));
    pie.position.set(0, 0.24, 0); g.add(pie);
    g.scale.setScalar(esc || 1);
    return g;
  }

  function nube() {
    const g = new THREE.Group();
    const n = (r, x, y) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(0xe8ecff, true)); s.position.set(x, y, 0); g.add(s); };
    n(0.5, 0, 0.15); n(0.35, -0.4, 0.02); n(0.38, 0.42, 0.0); n(0.3, -0.15, -0.28); n(0.28, 0.18, -0.32);
    return g;
  }

  function hacerFigura(s) {
    const g = new THREE.Group();
    const tipo = s.tipo;
    const mats = [];

    function add(mesh, glow) {
      mesh.castShadow = true;
      g.add(mesh);
      mats.push(mesh.material);
      return mesh;
    }

    if (tipo === 'servidor' || tipo === 'rack') {
      // gabinete vertical
      const cuerpo = add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 0.9), mat(s.color, false)), false);
      cuerpo.position.y = 0.8;
      for (let i = 0; i < 3; i++) {
        const ran = add(new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.16, 0.1), mat(0x0a1230, true)), false);
        ran.position.set(0, 0.45 + i * 0.34, 0.46);
      }
    } else if (tipo === 'bd') {
      const base = add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.5, 24), mat(s.color, false)), false);
      base.position.y = 0.25;
      const mid = add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.4, 24), mat(s.color, true)), false);
      mid.position.y = 0.68;
      const tap = add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.45, 0.22, 24), mat(0x0d1420, true)), false);
      tap.position.y = 0.98;
    } else if (tipo === 'monitor' || tipo === 'tv') {
      const lut = pantalla(1.6, 1.0, tipo === 'tv' ? 0.9 : 0.75, s.color, tipo === 'tv' ? 1.3 : 1.0);
      g.add(lut);
    } else if (tipo === 'tablet') {
      const g2 = pantalla(0.9, 0.7, 1.0, s.color, 0.65);
      g2.rotation.x = -0.12; g2.rotation.z = 0.05;
      g.add(g2);
    } else if (tipo === 'cocina') {
      const cuerpo = add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.8), mat(s.color, false)), false);
      cuerpo.position.y = 0.35;
      for (const [ix, iz] of [[-0.3,0.12],[0.3,0.12],[0,0.12],[0,-0.18]]) {
        const q = add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20), mat(0x0a0f1e, true)), false);
        q.position.set(ix, 0.74, iz);
      }
      const humo = [];
      for (let i = 0; i < 6; i++) {
        const ms = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), mat(0x93a6c8, true));
        ms.position.set(-0.4 + i * 0.16, 1.15 + Math.random() * 0.3, (Math.random() - 0.5) * 0.2);
        g.add(ms);
      }
    } else if (tipo === 'phone') {
      const g2 = pantalla(0.7, 1.0, 0.9, s.color, 0.9);
      g2.rotation.y = 0.3; g.add(g2);
    } else if (tipo === 'caja') {
      // mostrador de caja (base + sobre) orientado hacia dentro de la sala
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 0.85), mat(0x1b2340, false));
      base.position.y = 0.42; g.add(base);
      const sobre = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.1, 1.0), mat(s.color, false));
      sobre.position.y = 0.9; sobre.castShadow = true; g.add(sobre);
      // pantalla del operador (monitor apoyado en el mostrador)
      const moni = pantalla(0.7, 0.5, 1.15, s.color, 0.75);
      moni.position.set(0.3, -0.05, 0.05); g.add(moni);
      // teclado inclinado sobre el mostrador
      const tecladoGrp = new THREE.Group();
      const tecBase = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.18), mat(0x0d1326, false));
      tecladoGrp.add(tecBase);
      for (let f = 0; f < 9; f++) {
        const tecla = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.03, 0.038), mat(0x39425f, true));
        tecla.position.set(-0.17 + f * 0.042, 0.045, 0.0);
        tecladoGrp.add(tecla);
      }
      tecladoGrp.position.set(-0.05, 0.93, 0.28);
      tecladoGrp.rotation.x = -0.35;
      g.add(tecladoGrp);
      // mouse junto al teclado
      const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.13), mat(0x0d1326, false));
      mouse.position.set(0.0, 0.95, 0.12);
      mouse.rotation.x = -0.2; g.add(mouse);

    } else if (tipo === 'nube') {
      g.add(nube());
    } else if (tipo === 'globe') {
      const esf = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 24), mat(0x0a0f26, true));
      esf.position.y = 0.6; g.add(esf);
      const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true }));
      wire.position.y = 0.6; g.add(wire);
      const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.03, 10, 30), mat(s.color, true));
      anillo.position.y = 0.6; anillo.rotation.x = 1.2; g.add(anillo);
    }

    // base circular de apoyo
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.05, 32), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.02; g.add(halo);

    // recolectar todos los materiales estándar (para resaltado/tour)
    const coleccion = [];
    g.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) coleccion.push(o.material); });
    g.userData.materiales = coleccion;
    g.userData.sistema = s;
    g.position.set(s.x, s.y, s.z);
    return g;
  }

  // ============ Construcción de nodos + etiquetas ============
  function crearEtiqueta(s) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 96;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.font = '30px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(s.nombre, cv.width / 2, 42);
    ctx.shadowBlur = 0;
    ctx.font = '22px Segoe UI, Arial, sans-serif';
    ctx.fillStyle = hexColor(s.color).getStyle();
    ctx.fillText(s.sub, cv.width / 2, 74);
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
    const ancho = Math.max(0.9, s.nombre.length * 0.16);
    sp.scale.set(ancho * 2.5, 0.9, 1);
    sp.position.y = 2.5;
    sp.userData.sistema = s;
    return sp;
  }

  const sistemaGrupos = {};       // clave -> group (figura)  [para interactuar]
  const sistemaSprites = {};      // clave -> sprite etiqueta
  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();

  SISTEMAS.forEach((s) => {
    const g = hacerFigura(s);
    const lbl = crearEtiqueta(s);
    g.add(lbl);
    scene.add(g);
    sistemaGrupos[s.clave] = g;
  });

  // ============ Cables ============
  const cableGrp = new THREE.Group();
  scene.add(cableGrp);
  const cableMat = new THREE.LineBasicMaterial({ color: COLOR_ACTIVO, transparent: true, opacity: 0.8 });
  const cablePuntMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

  function crearCable(a, b) {
    const A = sistemaGrupos[a].position;
    const B = sistemaGrupos[b].position;
    const start = new THREE.Vector3(A.x, 1.6, A.z);
    const end = new THREE.Vector3(B.x, 1.6, B.z);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.y = 1.6 + Math.abs(start.x - end.x) * 0.12 + 0.35;
    const curva = new THREE.CatmullRomCurve3([start, mid, end]);
    const geo = new THREE.BufferGeometry().setFromPoints(curva.getPoints(40));
    cableGrp.add(new THREE.Line(geo, cableMat));
    const pa = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), cablePuntMat);
    pa.position.copy(start); cableGrp.add(pa);
    const pb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), cablePuntMat);
    pb.position.copy(end); cableGrp.add(pb);
  }

  CABLES.forEach(([a, b]) => crearCable(a, b));
  let cablesActivos = true;

  function setCablesActivos(activo) {
    cablesActivos = activo;
    cableGrp.visible = activo;
  }

  // ============ Estado de cámara (órbita) ============
  let camTheta = 0, camPhi = 0.95, camDist = 12;
  const camTarget = new THREE.Vector3(0, 0, 0);
  const dragging = { on: false, x: 0, y: 0 };
  let autoOrbit = true;

  function actualizarCamara() {
    const sa = Math.sin(camTheta), ca = Math.cos(camTheta);
    const sp = Math.sin(camPhi), cp = Math.cos(camPhi);
    camera.position.x = camTarget.x + camDist * cp * sa;
    camera.position.y = camTarget.y + camDist * sp;
    camera.position.z = camTarget.z + camDist * cp * ca;
    camera.lookAt(camTarget);
  }

  // ============ Tour guiado ============
  const elTourIndex = document.getElementById('tour-index');
  const elTourNombre = document.getElementById('tour-name');
  const elTourSub = document.getElementById('tour-sub');
  const elProgreso = document.getElementById('progress-bar-inner');
  const elFicha = document.getElementById('node-ficha');
  const fichaTitulo = document.getElementById('ficha-titulo');
  const fichaCuerpo = document.getElementById('ficha-cuerpo');

  let idx = 0;

  function limpiarResaltado() {
    Object.keys(sistemaGrupos).forEach((k) => {
      const g = sistemaGrupos[k];
      const s = g.userData.sistema;
      (g.userData.materiales || []).forEach((m) => {
        m.emissive.set(0x000000);
        m.emissiveIntensity = 0;
      });
      g.scale.set(1, 1, 1);
    });
  }

  function resaltar(clave) {
    const g = sistemaGrupos[clave];
    if (!g) return;
    (g.userData.materiales || []).forEach((m) => {
      m.emissive.copy(hexColor(COLOR_ACTIVO));
      m.emissiveIntensity = 0.55;
    });
    g.scale.set(1.12, 1.12, 1.12);
  }

  function irA(clave) {
    const s = SISTEMAS.find((x) => x.clave === clave);
    if (!s) return;
    limpiarResaltado();
    resaltar(clave);
    camTarget.set(s.x, 0.4, s.z);
    camDist = 5.2;
    camPhi = Math.max(0.5, Math.min(1.1, camPhi));
    elFicha.classList.add('abierta');
    fichaTitulo.textContent = s.nombre;
    let html = '<div class="f-desc">' + s.desc + '</div>';
    html += '<div class="f-fila"><span>Stack</span><b>' + s.stack + '</b></div>';
    html += '<div class="f-fila"><span>Puerto</span><b>' + s.puerto + '</b></div>';
    html += '<div class="f-roles">';
    (s.roles || []).forEach((r) => { html += '<span>' + r + '</span>'; });
    html += '</div>';
    fichaCuerpo.innerHTML = html;
    const pct = Math.round(((idx) / (SISTEMAS.length - 1)) * 100);
    elProgreso.style.width = pct + '%';
    actualizarIndicador();
  }

  function currentClave() { return SISTEMAS[idx].clave; }
  function visA(delta) {
    idx = Math.min(SISTEMAS.length - 1, Math.max(0, idx + delta));
    irA(currentClave());
  }
  function actualizarIndicador() {
    elTourIndex.textContent = (idx + 1) + ' / ' + SISTEMAS.length;
    const s = SISTEMAS[idx];
    elTourNombre.textContent = s.nombre;
    elTourSub.textContent = s.sub;
  }

  document.getElementById('btn-prev').addEventListener('click', () => visA(-1));
  document.getElementById('btn-next').addEventListener('click', () => visA(1));

  // chips / acceso rápido
  const leyendaEl = document.getElementById('leyenda-mini');
  SISTEMAS.forEach((s) => {
    const chip = document.createElement('button');
    chip.className = 'chip-sistema';
    chip.dataset.clave = s.clave;
    chip.style.setProperty('--c', hexColor(s.color).getStyle());
    chip.textContent = s.nombre;
    chip.addEventListener('click', () => {
      idx = SISTEMAS.findIndex((x) => x.clave === s.clave);
      irA(currentClave());
    });
    leyendaEl.appendChild(chip);
  });

  // ============ Modo automático ============
  let modoAuto = false;
  let autoTimer = null;
  function setAuto(activo) {
    modoAuto = activo;
    clearInterval(autoTimer);
    if (activo) autoTimer = setInterval(() => { irA((idx + 1) % SISTEMAS.length); }, 8500);
  }
  document.getElementById('btn-auto').addEventListener('click', () => {
    setAuto(!modoAuto);
    document.getElementById('btn-auto').classList.toggle('activo', modoAuto);
  });

  // ============ Órbita automática ============
  document.getElementById('btn-orbitar').addEventListener('click', () => {
    autoOrbit = !autoOrbit;
    document.getElementById('btn-orbitar').classList.toggle('activo', autoOrbit);
  });

  // ============ Cables ============
  document.getElementById('btn-cables').addEventListener('click', () => {
    setCablesActivos(!cablesActivos);
    document.getElementById('btn-cables').classList.toggle('activo', cablesActivos);
  });

  // ============ Clic en figuras (raycast) ============
  const selectables = [];
  Object.keys(sistemaGrupos).forEach((k) => {
    sistemaGrupos[k].traverse((obj) => { if (obj.isMesh) selectables.push(obj); });
  });

  canvas.addEventListener('pointerdown', (e) => {
    dragging.on = true; dragging.x = e.clientX; dragging.y = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging.on) return;
    const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y;
    dragging.x = e.clientX; dragging.y = e.clientY;
    camTheta -= dx * 0.005;
    camPhi = Math.max(0.25, Math.min(1.35, camPhi + dy * 0.005));
  });
  window.addEventListener('pointerup', (e) => {
    if (dragging.on && Math.abs(e.clientX - dragging.x) + Math.abs(e.clientY - dragging.y) < 6) {
      const r = canvas.getBoundingClientRect();
      puntero.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      puntero.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(puntero, camera);
      const hits = raycaster.intersectObjects(selectables, true);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj && !obj.userData || (obj.userData && !obj.userData.sistema)) obj = obj.parent;
        if (obj && obj.userData.sistema) {
          const cl = obj.userData.sistema.clave;
          idx = SISTEMAS.findIndex((s) => s.clave === cl);
          irA(cl);
        }
      }
    }
    dragging.on = false;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camDist = Math.max(2.5, Math.min(20, camDist + e.deltaY * 0.01));
  }, { passive: false });

  // ============ Teclado ============
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); visA(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); visA(-1); }
    else if (e.key === ' ') { e.preventDefault(); setAuto(!modoAuto);
      document.getElementById('btn-auto').classList.toggle('activo', modoAuto); }
    else if (e.key.toLowerCase() === 'c') { setCablesActivos(!cablesActivos);
      document.getElementById('btn-cables').classList.toggle('activo', cablesActivos); }
    else if (e.key.toLowerCase() === 'o') { autoOrbit = !autoOrbit;
      document.getElementById('btn-orbitar').classList.toggle('activo', autoOrbit); }
  });

  // ============ Resize ============
  function reajustar() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', reajustar);

  // ============ Bucle ============
  const clock = new THREE.Clock();

  function animar() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (autoOrbit) camTheta += dt * 0.08;
    actualizarCamara();

    // dar vida: rotar anchas nubes/globos y cabecera
    Object.keys(sistemaGrupos).forEach((k) => {
      const g = sistemaGrupos[k];
      const s = g.userData.sistema;
      if (s.tipo === 'nube') g.rotation.y += dt * 0.15;
      if (s.tipo === 'globe') g.rotation.y += dt * 0.25;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animar);
  }

  // ============ Inicio ============
  irA(currentClave());
  actualizarIndicador();
  setCablesActivos(true);
  animar();

})();