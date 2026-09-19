# spring-cloud-config-taller

Taller académico de Spring Cloud Config (GeeksforGeeks), entregable con dos partes: código funcional e informe con evidencias. Monorepo con dos módulos Maven independientes (no hay POM padre ni agregador) más extras y documentación.

## Regla principal: el código del taller queda idéntico al tutorial

`config-server/` y `loan-service/` reproducen el ejercicio tal cual; es lo que el usuario debe entregar. **No refactorizar ni "mejorar"** esos módulos (ni sus `.properties`). Las únicas desviaciones del enunciado, ya documentadas en el informe:

- Puerto del Config Server = **8888** (el tutorial se contradice: 8080 en su `application.properties`, 8888 en el texto y en el cliente).
- Mensajes de los `.properties` en **inglés** (`Welcome From Default/Development/UAT Profile`), como en las capturas del ejercicio; la traducción automática de la página los había pasado a español.
- `LoanServiceApplicationTests` declara `application.message` y desactiva el Config Client, porque en el test no hay servidor. Solo cambia el test, no la app.

Cualquier mejora va en `extras/`, que no toca los módulos del taller (se activa por variables de entorno y carpetas adicionales).

## Stack

Java 17 (compila con JDK 21), Spring Boot **4.1.1**, Spring Cloud **2025.1.3** (Oakwood), Maven Wrapper por módulo. Con Boot 4, Initializr genera `spring-boot-starter-webmvc` en lugar de `spring-boot-starter-web`.

## Comandos verificados

Cada módulo trae su `mvnw`; no hay Maven global en la máquina.

```bash
# 1) Servidor (siempre primero)
cd config-server && ./mvnw spring-boot:run          # :8888

# 2) Cliente, perfil dev por defecto (application.properties)
cd loan-service && ./mvnw spring-boot:run           # :8082
./mvnw spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=uat       # :8083
./mvnw spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=default   # :8081

./mvnw test        # en cada módulo
```

Perfil → puerto → `GET /message`: `default` 8081, `dev` 8082, `uat` 8083. El servidor también responde `GET :8888/loan-service/{perfil}`.

Detalles que morden:
- `spring.config.import=optional:` deja arrancar el cliente sin servidor, pero entonces `@Value("${application.message}")` falla al iniciar. Levantar el servidor antes.
- `spring-boot:run` lanza un JVM hijo; para liberar un puerto en Windows hay que matar el proceso que escucha (`Get-NetTCPConnection -LocalPort <p>`), no solo el `mvnw`.
- Los `.properties` del servidor viven en `config-server/src/main/resources/config/`; cambiarlos requiere reiniciar el servidor (van en el classpath).

## Documentación e informe

- `docs/Informe-Taller-Spring-Cloud-Config.docx` se **genera**, no se edita a mano: `docs/informe/generar-informe.js` lee el código real, los logs de `docs/evidencias/` y las capturas de `docs/evidencias/postman/` (por nombre de archivo; si falta una, deja un recuadro rojo visible, nunca inventa evidencia).
  ```powershell
  cd docs\informe
  npm install          # primera vez
  npm run generar
  .\actualizar-indice.ps1 [-Paginas <carpeta>]   # Word actualiza el TOC; -Paginas exporta PNG por página
  ```
  Requiere Node y Microsoft Word (automatización COM). Tras regenerar, revisar las páginas exportadas.
- `docs/GUIA-EVIDENCIAS.md` explica qué capturas de Postman toma el usuario y con qué nombre; `docs/postman/` tiene la colección importable.
- Las capturas de Postman son evidencia **del usuario**: no fabricarlas ni sustituirlas por otras.
- Al agregar evidencia nueva (logs, curl), regrabarla desde una ejecución real; no editar a mano los `.txt`/`.json` de `docs/evidencias/`.

## Extras (`extras/`)

Ver `extras/README.md`. Resumen: Docker Compose (MySQL + Config Server + `loan-service-mysql`), perfil `git` del Config Server y el módulo `loan-service-mysql` (capas controller/service/repository, DTOs `record`, tests con Mockito). MySQL usa el puerto **3308** en el host (el 3306 está ocupado). Credenciales solo en `extras/.env` (ignorado por git); el repo incluye `.env.example`. La contraseña de MySQL nunca pasa por el Config Server.

Los contenedores de este repo se llaman `taller-cfg-*`; la máquina tiene otros contenedores de otros proyectos, no tocarlos.

## Convenciones

Commits en Conventional Commits con descripción en español (`feat(config-server): ...`), sin `Co-Authored-By`. Ramas `tipo/slug-en-kebab-case`.
