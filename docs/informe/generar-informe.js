// Genera docs/Informe-Taller-Spring-Cloud-Config.docx a partir de lo que hay en el repo:
// código real, logs y respuestas de docs/evidencias, y capturas de Postman en docs/evidencias/postman.
// Uso (una vez): npm install   |   Generar: npm run generar
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, AlignmentType, ImageRun, Footer, PageNumber, LevelFormat,
  TableOfContents, PageBreak, VerticalAlign,
} = require('docx');

const RAIZ = path.resolve(__dirname, '..', '..');
const EVID = path.join(RAIZ, 'docs', 'evidencias');
const POSTMAN = path.join(EVID, 'postman');
const SALIDA = path.join(RAIZ, 'docs', 'Informe-Taller-Spring-Cloud-Config.docx');

const AUTOR = 'Sebastian Montes Olivera';
const FECHA = '19 de septiembre de 2026';
const REPO_URL = process.env.REPO_URL || 'https://github.com/SebastianMontes-Dev/spring-cloud-config-taller';

const AZUL = '1F3864';
const GRIS_BORDE = 'BFBFBF';
const GRIS_CODIGO = 'F2F2F2';
const ANCHO = 9026; // A4 con márgenes de 1"

// ---------- lectura de evidencias ----------
const leer = (...p) => fs.readFileSync(path.join(...p), 'utf8').replace(/\r/g, '');
const codigo = (rel) => leer(RAIZ, rel).replace(/\n+$/, '').split('\n');
const evid = (f) => leer(EVID, f);
const lineasLog = (f, patrones) =>
  evid(f).split('\n').filter((l) => patrones.some((r) => r.test(l)));
const puertoTomcat = (f) => {
  const m = evid(f).match(/Tomcat started on port[^\d]*(\d+)/);
  return m ? m[1] : '—';
};
const cuerpoCurl = (f) => {
  const partes = evid(f).trim().split('\n');
  return partes[partes.length - 1];
};
const estadoCurl = (f) => {
  const m = evid(f).match(/HTTP\/1\.1 (\d+)/);
  return m ? m[1] : '—';
};
const versionMaven = () => {
  const m = leer(RAIZ, 'config-server/.mvn/wrapper/maven-wrapper.properties').match(/apache-maven-([\d.]+)-bin/);
  return m ? m[1] : '—';
};

// ---------- imágenes ----------
function dimensiones(buf) {
  if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), tipo: 'png' };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), tipo: 'jpg' };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}
function buscarImagen(base) {
  for (const ext of ['png', 'jpg', 'jpeg']) {
    const f = path.join(POSTMAN, `${base}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

// ---------- bloques de documento ----------
const t = (text, o = {}) => new TextRun({ text, ...o });
const parrafo = (children, o = {}) =>
  new Paragraph({ spacing: { after: 120, line: 276 }, ...o, children: typeof children === 'string' ? [t(children)] : children });
const h1 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s)] });
const h2 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(s)] });
const punto = (children) =>
  new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 60 }, children: typeof children === 'string' ? [t(children)] : children });
const numerado = (children) =>
  new Paragraph({ numbering: { reference: 'numeros', level: 0 }, spacing: { after: 80 }, children: typeof children === 'string' ? [t(children)] : children });
const mono = (s) => t(s, { font: 'Consolas', size: 20 });

function bloqueCodigo(lineas, titulo) {
  const out = [];
  if (titulo) out.push(new Paragraph({ keepNext: true, spacing: { before: 120, after: 40 }, children: [t(titulo, { italics: true, size: 20, color: '595959' })] }));
  lineas.forEach((l, i) => {
    out.push(new Paragraph({
      keepLines: true,
      keepNext: lineas.length <= 25 && i < lineas.length - 1, // bloques cortos no se parten entre páginas
      spacing: { before: 0, after: 0, line: 252 },
      indent: { left: 200 },
      shading: { type: ShadingType.CLEAR, fill: GRIS_CODIGO, color: 'auto' },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: AZUL, space: 6 } },
      children: [t(l === '' ? ' ' : l, { font: 'Consolas', size: 17 })],
    }));
  });
  out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  return out;
}

const borde = { style: BorderStyle.SINGLE, size: 4, color: GRIS_BORDE };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };
function celda(contenido, ancho, { cabecera = false, mono: esMono = false } = {}) {
  const runs = typeof contenido === 'string'
    ? [t(contenido, { bold: cabecera, color: cabecera ? 'FFFFFF' : undefined, font: esMono ? 'Consolas' : undefined, size: esMono ? 19 : 21 })]
    : contenido;
  return new TableCell({
    width: { size: ancho, type: WidthType.DXA },
    borders: bordes,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    shading: cabecera ? { type: ShadingType.CLEAR, fill: AZUL, color: 'auto' } : undefined,
    children: [new Paragraph({ spacing: { after: 0 }, children: runs })],
  });
}
function tabla(cabeceras, filas, anchos, opciones = {}) {
  const suma = anchos.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: suma, type: WidthType.DXA },
    columnWidths: anchos,
    rows: [
      new TableRow({ tableHeader: true, children: cabeceras.map((c, i) => celda(c, anchos[i], { cabecera: true })) }),
      ...filas.map((f) => new TableRow({
        cantSplit: true,
        children: f.map((c, i) => celda(c, anchos[i], { mono: (opciones.mono || []).includes(i) })),
      })),
    ],
  });
}
const espacio = () => new Paragraph({ spacing: { after: 160 }, children: [] });

// Recuadro visible cuando falta una captura: nunca se inventa evidencia.
function recuadroFalta(archivo, descripcion) {
  const b = { style: BorderStyle.DASHED, size: 8, color: 'C00000' };
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA },
    columnWidths: [ANCHO],
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: ANCHO, type: WidthType.DXA },
        borders: { top: b, bottom: b, left: b, right: b },
        margins: { top: 240, bottom: 240, left: 200, right: 200 },
        shading: { type: ShadingType.CLEAR, fill: 'FDF2F2', color: 'auto' },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [t(`[Insertar captura de Postman: ${archivo}]`, { bold: true, color: 'C00000' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [t(descripcion, { italics: true, size: 20, color: '7F7F7F' })] }),
        ],
      })],
    })],
  });
}

const faltantes = [];
function capturaPostman(base, descripcion, { opcional = false } = {}) {
  const f = buscarImagen(base);
  const pie = new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 }, children: [t(descripcion, { italics: true, size: 19, color: '595959' })] });
  if (!f) {
    if (opcional) return [];
    faltantes.push(base);
    return [recuadroFalta(`${base}.png`, descripcion), pie];
  }
  const buf = fs.readFileSync(f);
  const d = dimensiones(buf);
  if (!d) throw new Error(`No se pudo leer el tamaño de ${f}`);
  const maxW = 600; // px a 96 dpi ≈ 6.25"
  const esc = Math.min(1, maxW / d.w);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 0 },
      children: [new ImageRun({ type: d.tipo, data: buf, transformation: { width: Math.round(d.w * esc), height: Math.round(d.h * esc) }, altText: { title: descripcion, description: descripcion, name: base } })],
    }),
    pie,
  ];
}

// ---------- contenido ----------
const perfiles = [
  { id: 'default', puerto: '8081', logCliente: '05-consola-loan-service-default.txt', curl: '06-curl-cliente-default.txt', srv: '02-server-default.json' },
  { id: 'dev', puerto: '8082', logCliente: '03-consola-loan-service-dev.txt', curl: '06-curl-cliente-dev.txt', srv: '02-server-dev.json' },
  { id: 'uat', puerto: '8083', logCliente: '04-consola-loan-service-uat.txt', curl: '06-curl-cliente-uat.txt', srv: '02-server-uat.json' },
];
const nombreCaptura = { default: '04-cliente-default-8081', dev: '05-cliente-dev-8082', uat: '06-cliente-uat-8083' };
const nombreCapturaSrv = { default: '01-server-default', dev: '02-server-dev', uat: '03-server-uat' };

const hijos = [];
const add = (...x) => x.flat().forEach((e) => hijos.push(e));

// Portada
add(
  new Paragraph({ spacing: { before: 2200, after: 200 }, children: [t('INFORME DE TALLER', { size: 26, bold: true, color: '7F7F7F', characterSpacing: 60 })] }),
  new Paragraph({ spacing: { after: 160 }, children: [t('Spring Boot: Servidor de configuración en la nube y cliente de configuración', { size: 52, bold: true, color: AZUL })] }),
  new Paragraph({
    spacing: { after: 700 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: AZUL, space: 12 } },
    children: [t('Spring Cloud Config Server y Config Client sobre un servicio de préstamos', { size: 28, color: '595959' })],
  }),
  tabla(['Dato', 'Detalle'], [
    ['Autor', AUTOR],
    ['Fecha', FECHA],
    ['Tecnologías', 'Java 17+, Spring Boot 4.1.1, Spring Cloud 2025.1.3 (Oakwood), Maven'],
    ['Repositorio', REPO_URL || 'Se entrega junto con este informe'],
  ], [2200, ANCHO - 2200]),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ spacing: { after: 200 }, children: [t('Contenido', { size: 36, bold: true, color: AZUL })] }),
  new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' }),
  new Paragraph({ children: [new PageBreak()] }),
);

// 1. Introducción
add(
  h1('1. Introducción y objetivo'),
  parrafo('Spring Cloud Config ofrece un enfoque centralizado para gestionar las propiedades de configuración externas de aplicaciones distribuidas. Sigue una arquitectura cliente-servidor: el servidor almacena los archivos de configuración y los clientes los recuperan de forma dinámica durante el arranque de la aplicación.'),
  punto('Centraliza la gestión de la configuración de múltiples aplicaciones Spring Boot.'),
  punto('Admite perfiles específicos para cada entorno, como desarrollo, pruebas y producción.'),
  punto('Simplifica las actualizaciones de configuración y el mantenimiento en arquitecturas de microservicios.'),
  espacio(),
  parrafo([t('Objetivo. ', { bold: true }), t('Implementar un Config Server que guarde la configuración de un servicio de préstamos (loan-service) en tres perfiles (default, dev y uat) y un Config Client que la recupere al iniciar, y comprobar con pruebas HTTP que cada perfil aplica su propio puerto y mensaje.')]),
  tabla(['Componente', 'Rol', 'Puerto'], [
    ['config-server', 'Almacena y sirve las propiedades de configuración', '8888'],
    ['loan-service', 'Cliente: obtiene su configuración del servidor al arrancar', '8081 / 8082 / 8083 según el perfil'],
  ], [2400, 4326, 2300]),
);

// 2. Entorno
add(
  h1('2. Entorno utilizado'),
  tabla(['Elemento', 'Versión / detalle'], [
    ['Sistema operativo', 'Windows 11 Pro'],
    ['JDK', 'Eclipse Temurin 21.0.11 (el proyecto declara java.version = 17, el mínimo que pide el taller)'],
    ['Maven', `Maven Wrapper (mvnw) con Apache Maven ${versionMaven()}`],
    ['Spring Boot', '4.1.1'],
    ['Spring Cloud', '2025.1.3 (Oakwood), compatible con Spring Boot 4.0.x y 4.1.x'],
    ['Generación de proyectos', 'Spring Initializr (start.spring.io), empaquetado Jar'],
    ['Pruebas HTTP', 'Postman y curl'],
    ['Control de versiones', 'Git'],
  ], [2600, ANCHO - 2600]),
  espacio(),
  parrafo('Los proyectos se compilaron y ejecutaron desde la terminal con Maven Wrapper, por lo que no requieren una instalación de Maven. Son proyectos Maven estándar y se pueden importar sin cambios en Eclipse con Spring Tool Suite, el IDE que menciona el enunciado.'),
);

// 3. Config Server
add(
  h1('3. Paso 1: Creación del Config Server'),
  parrafo('El servidor de configuración actúa como repositorio centralizado de las propiedades y las entrega a las aplicaciones cliente.'),
  h2('3.1 Creación del proyecto Spring Boot'),
  parrafo('El proyecto se generó con Spring Initializr con los siguientes datos:'),
  tabla(['Campo', 'Valor'], [
    ['Project / Language', 'Maven / Java'],
    ['Spring Boot', '4.1.1'],
    ['Group / Artifact', 'com.example / config-server'],
    ['Package name', 'com.example.configserver'],
    ['Packaging / Java', 'Jar / 17'],
    ['Dependencias', 'Spring Web, Spring Boot DevTools, Config Server'],
  ], [3000, ANCHO - 3000]),
  capturaPostman('initializr-config-server', 'Spring Initializr: configuración del proyecto config-server', { opcional: true }),
  h2('3.2 Dependencia en el pom.xml'),
  parrafo('El pom.xml generado contiene la dependencia del servidor de configuración, y el BOM spring-cloud-dependencies 2025.1.3 administra su versión.'),
  bloqueCodigo([
    '<dependency>',
    '    <groupId>org.springframework.cloud</groupId>',
    '    <artifactId>spring-cloud-config-server</artifactId>',
    '</dependency>',
  ], 'config-server/pom.xml'),
  h2('3.3 Habilitar la funcionalidad del servidor'),
  parrafo([t('La anotación '), mono('@EnableConfigServer'), t(' activa las funciones de servidor de configuración en la aplicación Spring Boot.')]),
  bloqueCodigo(codigo('config-server/src/main/java/com/example/configserver/ConfigServerApplication.java'), 'ConfigServerApplication.java'),
  h2('3.4 Configuración del servidor'),
  bloqueCodigo(codigo('config-server/src/main/resources/application.properties'), 'config-server/src/main/resources/application.properties'),
  tabla(['Propiedad', 'Función'], [
    ['spring.application.name', 'Nombre de la aplicación del servidor de configuración'],
    ['server.port', 'Puerto del servidor de configuración (8888)'],
    ['spring.profiles.active=native', 'Habilita el respaldo basado en archivos locales'],
    ['spring.cloud.config.server.native.search-locations', 'Ubicación de los archivos de configuración (classpath:/config)'],
  ], [4300, ANCHO - 4300], { mono: [0] }),
  espacio(),
  parrafo([t('Nota sobre el puerto. ', { bold: true }), t('El enunciado se contradice: el texto indica el puerto 8888, su application.properties muestra 8080 y el cliente importa la configuración desde http://localhost:8888. Se usó 8888, que es el que el cliente consulta; con 8080 el cliente no encontraría el servidor. Es la única diferencia respecto del código del enunciado.')]),
  h2('3.5 Archivos de configuración por perfil'),
  parrafo([t('Dentro de '), mono('src/main/resources/config/'), t(' se crearon tres archivos, uno por perfil. El nombre sigue la convención '), mono('{aplicación}-{perfil}.properties'), t(', donde {aplicación} es el spring.application.name del cliente.')]),
  bloqueCodigo(codigo('config-server/src/main/resources/config/loan-service.properties'), 'loan-service.properties (perfil default)'),
  bloqueCodigo(codigo('config-server/src/main/resources/config/loan-service-dev.properties'), 'loan-service-dev.properties (perfil dev)'),
  bloqueCodigo(codigo('config-server/src/main/resources/config/loan-service-uat.properties'), 'loan-service-uat.properties (perfil uat)'),
  h2('3.6 Ejecución del servidor'),
  parrafo([t('Se ejecutó con '), mono('./mvnw spring-boot:run'), t('. El log confirma el perfil native y el puerto 8888:')]),
  bloqueCodigo(lineasLog('01-consola-config-server.txt', [/profile is active/, /Tomcat started/, /Started ConfigServerApplication/]), 'Consola del Config Server'),
  ...capturaPostman('consola-config-server', 'Captura de la consola del Config Server: perfil native, puerto 8888 y las consultas atendidas', { opcional: true }),
  h2('3.7 Consulta directa al servidor'),
  parrafo([t('El servidor expone la configuración en '), mono('/{aplicación}/{perfil}'), t('. Para el perfil dev devuelve dos fuentes: primero loan-service-dev.properties y luego loan-service.properties. La primera tiene precedencia, por eso el puerto resultante es 8082 y no 8081.')]),
  bloqueCodigo([`$ curl http://localhost:8888/loan-service/dev`, ...evid('02-server-dev.json').trim().split('\n')], 'Respuesta del servidor (HTTP 200)'),
  tabla(['Solicitud', 'Fuente con precedencia', 'server.port', 'application.message'],
    perfiles.map((p) => {
      const j = JSON.parse(evid(p.srv));
      const s = j.propertySources[0];
      return [`GET /loan-service/${p.id}`, s.name.replace('classpath:', ''), s.source['server.port'], s.source['application.message']];
    }), [2000, 2926, 1300, 2800], { mono: [0, 1] }),
  espacio(),
  parrafo('Las mismas consultas, ejecutadas en Postman:'),
  ...perfiles.flatMap((p) => capturaPostman(nombreCapturaSrv[p.id], `Postman: GET http://localhost:8888/loan-service/${p.id}`)),
);

// 4. Config Client
add(
  h1('4. Paso 2: Creación del Config Client'),
  parrafo('El cliente recupera las propiedades del servidor de configuración durante el arranque de la aplicación.'),
  h2('4.1 Creación del proyecto'),
  tabla(['Campo', 'Valor'], [
    ['Project / Language', 'Maven / Java'],
    ['Spring Boot', '4.1.1'],
    ['Group / Artifact', 'com.example / loan-service'],
    ['Package name', 'com.example.loanservice'],
    ['Packaging / Java', 'Jar / 17'],
    ['Dependencias', 'Spring Web, Spring Boot DevTools, Config Client'],
  ], [3000, ANCHO - 3000]),
  capturaPostman('initializr-loan-service', 'Spring Initializr: configuración del proyecto loan-service', { opcional: true }),
  h2('4.2 Dependencia en el pom.xml'),
  bloqueCodigo([
    '<dependency>',
    '    <groupId>org.springframework.cloud</groupId>',
    '    <artifactId>spring-cloud-starter-config</artifactId>',
    '</dependency>',
  ], 'loan-service/pom.xml'),
  h2('4.3 Configuración del cliente'),
  bloqueCodigo(codigo('loan-service/src/main/resources/application.properties'), 'loan-service/src/main/resources/application.properties'),
  tabla(['Propiedad', 'Función'], [
    ['spring.application.name', 'Se usa para localizar los archivos de configuración en el servidor'],
    ['spring.config.import', 'URL del servidor de configuración; optional: permite arrancar aunque el servidor no responda'],
    ['spring.profiles.active', 'Perfil activo (dev)'],
  ], [3300, ANCHO - 3300], { mono: [0] }),
  h2('4.4 Clase principal'),
  bloqueCodigo(codigo('loan-service/src/main/java/com/example/loanservice/LoanServiceApplication.java'), 'LoanServiceApplication.java'),
  h2('4.5 Controlador REST'),
  parrafo([t('El endpoint '), mono('/message'), t(' devuelve el valor de application.message, que viene del servidor de configuración, y permite verificar que las propiedades se cargaron.')]),
  bloqueCodigo(codigo('loan-service/src/main/java/com/example/loanservice/LoanController.java'), 'LoanController.java'),
  h2('4.6 Ejecución del cliente'),
  parrafo([t('Con el perfil dev, el log muestra que el cliente consulta al servidor y que Tomcat arranca en el puerto 8082, definido en loan-service-dev.properties y no en el application.properties local:')]),
  bloqueCodigo(lineasLog('03-consola-loan-service-dev.txt', [/profile is active/, /Fetching config from server/, /Located environment/, /Tomcat started/, /Started LoanServiceApplication/]), 'Consola del Config Client (perfil dev)'),
);

// 5. Pruebas por perfil
add(
  h1('5. Pruebas por perfil'),
  parrafo('El perfil se seleccionó con spring.profiles.active. Con dev se usó el valor del application.properties tal como está en el taller. Para uat y default se pasó como argumento (--spring.profiles.active=...), lo que equivale a editar el archivo y evita modificar el código. En cada caso el cliente pide al servidor /loan-service/{perfil}, y el servidor combina loan-service-{perfil}.properties sobre loan-service.properties.'),
  tabla(['Perfil', 'Puerto esperado', 'Puerto observado (log)', 'GET /message', 'HTTP'],
    perfiles.map((p) => [p.id, p.puerto, puertoTomcat(p.logCliente), cuerpoCurl(p.curl), estadoCurl(p.curl)]),
    [1100, 1400, 1900, 3826, 800]),
  espacio(),
  ...perfiles.flatMap((p, i) => [
    h2(`5.${i + 1} Perfil ${p.id}`),
    parrafo([t(`Solicitud a `), mono(`http://localhost:${p.puerto}/message`), t(':')]),
    bloqueCodigo(evid(p.curl).trim().split('\n'), `curl, perfil ${p.id}`),
    ...capturaPostman(nombreCaptura[p.id], `Postman: GET http://localhost:${p.puerto}/message (perfil ${p.id})`),
    ...capturaPostman(`consola-${p.id}`, `Consola del cliente con el perfil ${p.id}`, { opcional: true }),
    ...capturaPostman(`consola-${p.id}-juntos`, `Config Server (derecha) y loan-service (izquierda) ejecutándose a la vez, perfil ${p.id}`, { opcional: true }),
  ]),
);

// 6. Pruebas automatizadas
add(
  h1('6. Pruebas automatizadas'),
  parrafo([t('Cada módulo incluye el test de arranque '), mono('contextLoads'), t(' que genera Spring Initializr. Ambos pasan con '), mono('./mvnw test'), t('.')]),
  parrafo([t('En loan-service el test se ajustó con '), mono('@SpringBootTest(properties = {"application.message=test", "spring.cloud.config.enabled=false"})'), t('. El controlador exige application.message y, durante los tests, no hay un Config Server disponible. Este cambio afecta solo a la clase de test; el código de la aplicación no se modificó.')]),
  bloqueCodigo(codigo('loan-service/src/test/java/com/example/loanservice/LoanServiceApplicationTests.java'), 'LoanServiceApplicationTests.java'),
);

// 7. Extras (opcionales)
// Salida de mysql (columnas con tabulador): la primera línea es el comando, el resto la tabla.
function alinearColumnas(lineas) {
  const [comando, ...filas] = lineas;
  const celdas = filas.map((l) => l.split('\t'));
  const anchos = celdas[0].map((_, i) => Math.max(...celdas.map((r) => r[i].length)));
  return [comando, ...celdas.map((r) => r.map((c, i) => c.padEnd(anchos[i])).join('  ').trimEnd())];
}
const bloques = (f) => leer(EVID, 'extras', f).trim().split(/\n\s*\n/);
const git = bloques('05-git-backend.txt');
const api = bloques('02-api-loans.txt');
add(
  h1('7. Extras opcionales'),
  parrafo([t('Fuera del alcance del enunciado, el repositorio incluye extras en la carpeta '), mono('extras/'), t('. '), t('No modifican ningún archivo de config-server ni de loan-service', { bold: true }), t(': se activan con variables de entorno y carpetas adicionales.')]),
  h2('7.1 Perfil git del Config Server'),
  parrafo([t('En lugar de leer '), mono('classpath:/config'), t(', el servidor puede servir la configuración desde un repositorio Git. Se activa con '), mono('SPRING_PROFILES_ACTIVE=git'), t(', que tiene precedencia sobre el '), mono('native'), t(' del application.properties. Los archivos de ejemplo terminan en "(Git)" para distinguir el origen de cada respuesta.')]),
  bloqueCodigo(codigo('extras/git-backend/application-git.properties').filter((l) => !l.startsWith('#')), 'extras/git-backend/application-git.properties'),
  parrafo([t('El campo '), mono('version'), t(' de la respuesta es el hash del commit del que se leyó la configuración. El loan-service del taller, sin ningún cambio, recibe el mensaje del repositorio Git:')]),
  bloqueCodigo(git[1].split('\n'), 'Servidor con perfil git: GET /loan-service/dev'),
  // git[3] = comando y cabeceras del cliente; git[4] = cuerpo (los separa la línea en blanco de HTTP)
  bloqueCodigo([...git[3].split('\n').filter((l) => !/^(Content-|Date)/.test(l)), '', git[4]], 'loan-service (perfil dev, sin cambios) contra ese servidor'),
  h2('7.2 Docker Compose y MySQL'),
  parrafo([t('Un '), mono('docker-compose.yml'), t(' levanta tres servicios: MySQL, el Config Server del taller y '), mono('loan-service-mysql'), t(', una variante separada del cliente que guarda préstamos en MySQL con las capas controller, service y repository, DTOs con validación y transacciones.')]),
  tabla(['Servicio', 'Puerto', 'Función'], [
    ['mysql (mysql:8)', '3308', 'Base loans_db; el esquema se crea con db/schema.sql'],
    ['config-server', '8888', 'El del taller, más la carpeta extras/config con la configuración del nuevo servicio'],
    ['loan-service-mysql', '8084', 'API /loans; su configuración y la URL de MySQL vienen del Config Server'],
  ], [2500, 1100, ANCHO - 3600], { mono: [0] }),
  espacio(),
  bloqueCodigo(codigo('extras/config/loan-service-mysql.properties').filter((l) => !l.startsWith('#')), 'extras/config/loan-service-mysql.properties (servido por el Config Server)'),
  parrafo([t('La contraseña no pasa por el Config Server. ', { bold: true }), t('El servidor no tiene definida MYSQL_PASSWORD, por lo que entrega el texto ${MYSQL_PASSWORD} sin resolver y el cliente lo completa con su propia variable de entorno. Las credenciales viven en un archivo .env fuera de git; el repositorio solo incluye .env.example.')]),
  parrafo([t('Estado de los contenedores, extraído de la salida de '), mono('docker compose ps'), t(':')]),
  tabla(['Contenedor', 'Estado', 'Puertos'],
    evid('extras/01-compose-ps.txt').trim().split('\n').slice(2).map((l) => {
      const c = l.trim().split(/\s{2,}/); // NAME, IMAGE, STATUS, PORTS
      return [c[0], c[2], c[3].split(',')[0]];
    }), [3000, 2900, ANCHO - 5900], { mono: [0, 2] }),
  espacio(),
  parrafo('Prueba de la API. Los préstamos se crean con POST y se consultan con GET; los datos inválidos responden 400 y los inexistentes 404:'),
  bloqueCodigo(api.slice(1).join('\n\n').split('\n'), 'Respuestas de la API'),
  parrafo('Las filas quedaron guardadas en MySQL, con los mismos valores que devolvió la API:'),
  bloqueCodigo(alinearColumnas(evid('extras/03-mysql-filas.txt').trim().split('\n')), 'Consulta directa a la base'),
  bloqueCodigo(evid('extras/04-consola-loan-service-mysql.txt').trim().split('\n'), 'Consola de loan-service-mysql (perfil docker)'),
  h2('7.3 Pruebas del extra'),
  parrafo([t('El módulo incluye 4 tests unitarios del servicio, con JUnit 5 y Mockito, que pasan con '), mono('./mvnw test'), t(': creación, listado, búsqueda por id y error cuando el préstamo no existe.')]),
);

// 8. Observaciones
add(
  h1('8. Observaciones sobre el enunciado'),
  numerado([t('Puerto del servidor. ', { bold: true }), t('El texto dice 8888, el application.properties dice 8080 y el cliente importa desde 8888. Se usó 8888.')]),
  numerado([t('Nombres y claves traducidos. ', { bold: true }), t('La versión en español del taller traduce nombres técnicos: préstamo-servicio.propiedades, servidor.puerto, aplicación.mensaje y la etiqueta <dependencia>. Se usaron los nombres reales: loan-service.properties, server.port, application.message y <dependency>.')]),
  numerado([t('Mensajes en inglés. ', { bold: true }), t('En las capturas de Postman del ejercicio los mensajes salen en inglés ("Welcome From Development Profile", "Welcome From UAT Profile"). Se usaron esos textos y, por el mismo patrón, "Welcome From Default Profile" para el perfil predeterminado.')]),
  numerado([t('MySQL. ', { bold: true }), t('El enunciado lista MySQL con Workbench como requisito, pero ni el servidor ni el cliente lo utilizan. El taller queda completo sin base de datos. El extra de la sección 7 sí incorpora MySQL.')]),
  numerado([t('Versiones. ', { bold: true }), t('El taller no fija versiones. Se usaron las vigentes: Spring Boot 4.1.1 con Spring Cloud 2025.1.3. Con Spring Boot 4, Spring Initializr genera spring-boot-starter-webmvc en lugar de spring-boot-starter-web; funcionalmente es el mismo starter de Spring MVC.')]),
  numerado([t('IDE. ', { bold: true }), t('El enunciado menciona Eclipse con Spring Tool Suite. Aquí los proyectos se ejecutaron desde la terminal; son proyectos Maven estándar importables en ese IDE.')]),
);

// 8. Conclusiones
add(
  h1('9. Conclusiones'),
  punto('La configuración de loan-service vive únicamente en el Config Server; el cliente solo conserva su nombre, la URL del servidor y el perfil activo.'),
  punto('Cambiar el perfil cambia el puerto y el mensaje sin recompilar ni tocar el código del cliente: default usa 8081, dev usa 8082 y uat usa 8083.'),
  punto('El orden de precedencia funciona como se esperaba: el archivo específico del perfil se impone sobre loan-service.properties.'),
  punto('El cliente y el servidor se ejecutaron y se probaron con curl, con resultado HTTP 200 en los tres perfiles. Las pruebas equivalentes en Postman se documentan en las secciones 3.7 y 5.'),
);

const doc = new Document({
  creator: AUTOR,
  title: 'Informe de taller: Spring Cloud Config Server y Client',
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: AZUL, font: 'Calibri' }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '2F5496', font: 'Calibri' }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [t('Taller Spring Cloud Config  |  Página ', { size: 18, color: '7F7F7F' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '7F7F7F' })],
        })],
      }),
    },
    children: hijos,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(SALIDA, buf);
  console.log(`Informe generado: ${SALIDA} (${(buf.length / 1024).toFixed(0)} KB)`);
  if (faltantes.length) console.log(`Capturas de Postman pendientes (${faltantes.length}): ${faltantes.join(', ')}`);
});
