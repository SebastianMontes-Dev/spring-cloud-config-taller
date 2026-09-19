# Guía para tomar las evidencias en Postman

Sigue estos pasos en orden. Al terminar tendrás 6 capturas de Postman que el informe usa por nombre de archivo.

## 0. Importar la colección

1. Abre Postman → **Import** → elige `docs/postman/Taller-Spring-Cloud-Config.postman_collection.json`.
2. Aparece la colección **Taller Spring Cloud Config** con dos carpetas y 6 requests.

## 1. Levantar el Config Server

En una terminal (PowerShell) desde la raíz del repo:

```powershell
cd config-server
.\mvnw spring-boot:run
```

Espera la línea `Started ConfigServerApplication`. Déjala abierta.

### Capturas contra el servidor (puerto 8888)

En Postman, ejecuta cada request con **Send** y captura la ventana completa. Debe verse: el método y la URL, `Status: 200 OK`, el cuerpo JSON y la pestaña **Test Results** en verde.

| Request | Guardar como (en `docs/evidencias/postman/`) |
|---|---|
| Server - loan-service/default | `01-server-default.png` |
| Server - loan-service/dev | `02-server-dev.png` |
| Server - loan-service/uat | `03-server-uat.png` |

## 2. Levantar el Config Client (`loan-service`) según el perfil

Usa **una terminal nueva** para cada perfil. Detén el anterior con `Ctrl + C` antes de arrancar el siguiente.

### Perfil dev (el que trae `application.properties`)

```powershell
cd loan-service
.\mvnw spring-boot:run
```

Debe aparecer `Tomcat started on port 8082`. En Postman ejecuta **Cliente dev - :8082/message**. Debe responder `Welcome From Development Profile`.

Guardar como: `05-cliente-dev-8082.png`

### Perfil uat

```powershell
cd loan-service
.\mvnw spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=uat"
```

Debe aparecer `Tomcat started on port 8083`. Ejecuta **Cliente uat - :8083/message**. Debe responder `Welcome From UAT Profile`.

Guardar como: `06-cliente-uat-8083.png`

### Perfil default

```powershell
cd loan-service
.\mvnw spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=default"
```

Debe aparecer `Tomcat started on port 8081`. Ejecuta **Cliente default - :8081/message**. Debe responder `Welcome From Default Profile`.

Guardar como: `04-cliente-default-8081.png`

## 3. Capturas de la consola (opcional pero recomendado)

Además de Postman, toma una foto de cada terminal cuando el servicio arranca. En el cliente se ven estas líneas, que demuestran que la configuración vino del servidor:

- `Fetching config from server at : http://localhost:8888`
- `Located environment: name=loan-service, profiles=[dev]`
- `Tomcat started on port 8082`

Guárdalas en `docs/evidencias/postman/` con estos nombres; el informe las incluye si existen:

| Archivo | Qué muestra |
|---|---|
| `consola-config-server.png` | Consola del Config Server (perfil native, puerto 8888) |
| `consola-default.png`, `consola-dev.png`, `consola-uat.png` | Consola del cliente con cada perfil |
| `consola-<perfil>-juntos.png` | Servidor y cliente corriendo a la vez (por ejemplo `consola-dev-juntos.png`) |

## 4. Cambiar de perfil editando el archivo, como en el taller

El taller cambia el perfil editando `loan-service/src/main/resources/application.properties`:

```properties
spring.profiles.active=uat
```

Es equivalente a la opción por argumento de arriba. Si prefieres seguirlo al pie de la letra para la captura, reinicia el cliente y **devuelve el valor a `dev`** al terminar, para que el repo quede como el taller.

## 5. Capturas de Spring Initializr (opcional)

Si quieres una captura propia del paso "Crear proyecto", entra a <https://start.spring.io> con estos valores:

| Campo | config-server | loan-service |
|---|---|---|
| Project | Maven | Maven |
| Language | Java | Java |
| Spring Boot | 4.1.1 | 4.1.1 |
| Group | `com.example` | `com.example` |
| Artifact | `config-server` | `loan-service` |
| Package name | `com.example.configserver` | `com.example.loanservice` |
| Packaging | Jar | Jar |
| Java | 17 | 17 |
| Dependencias | Spring Web, Spring Boot DevTools, Config Server | Spring Web, Spring Boot DevTools, Config Client |

Guarda las capturas como `initializr-config-server.png` e `initializr-loan-service.png` en `docs/evidencias/postman/`.

## 6. Regenerar el informe

Cuando las capturas estén en `docs/evidencias/postman/`, se regenera el informe `.docx` con ellas. Mientras falten, el informe muestra un recuadro `[Insertar captura de Postman: …]` en su lugar; no se inventan capturas.

Para regenerarlo tú mismo (requiere Node y Microsoft Word):

```powershell
cd docs\informe
npm install          # solo la primera vez
npm run generar      # crea docs\Informe-Taller-Spring-Cloud-Config.docx
.\actualizar-indice.ps1   # Word actualiza el índice con los números de página
```

También puedes insertar las capturas a mano en Word, reemplazando cada recuadro rojo.
