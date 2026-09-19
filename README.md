# Taller: Spring Cloud Config (Config Server + Config Client)

Implementación del taller *Spring Boot – Servidor de configuración en la nube y cliente de configuración*. Un **Config Server** guarda la configuración de un servicio de préstamos (`loan-service`) en tres perfiles (default, dev y uat), y un **Config Client** la recupera al arrancar.

| Módulo | Puerto | Rol |
|---|---|---|
| [`config-server`](config-server) | 8888 | Sirve los archivos de `src/main/resources/config/` (perfil `native`) |
| [`loan-service`](loan-service) | 8081 / 8082 / 8083 | Cliente. El puerto y el mensaje dependen del perfil activo |

## Requisitos

- Java 17 o superior (probado con Temurin 21)
- No hace falta Maven instalado: cada módulo trae Maven Wrapper (`mvnw`)

## Ejecutar

1. Levantar el servidor de configuración:

   ```bash
   cd config-server
   ./mvnw spring-boot:run
   ```

2. En otra terminal, levantar el cliente. Por defecto arranca con el perfil `dev`:

   ```bash
   cd loan-service
   ./mvnw spring-boot:run
   ```

3. Probar: `GET http://localhost:8082/message` → `Welcome From Development Profile`.

## Perfiles

| Perfil | Puerto | `GET /message` |
|---|---|---|
| `default` | 8081 | `Welcome From Default Profile` |
| `dev` | 8082 | `Welcome From Development Profile` |
| `uat` | 8083 | `Welcome From UAT Profile` |

Para probar otro perfil, cambia `spring.profiles.active` en `loan-service/src/main/resources/application.properties`, o pásalo por argumento:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=uat
```

El servidor también se puede consultar directamente: `GET http://localhost:8888/loan-service/{perfil}`.

## Tests

```bash
cd config-server && ./mvnw test
cd loan-service && ./mvnw test
```

## Extras opcionales

La carpeta [`extras/`](extras) agrega, sin modificar el taller: Docker Compose con MySQL, una variante del cliente que guarda préstamos en MySQL y un perfil `git` para el Config Server. Ver [`extras/README.md`](extras/README.md).

## Documentación

- [`docs/Informe-Taller-Spring-Cloud-Config.docx`](docs/Informe-Taller-Spring-Cloud-Config.docx): informe con evidencias
- [`docs/GUIA-EVIDENCIAS.md`](docs/GUIA-EVIDENCIAS.md): cómo tomar las capturas en Postman
- [`docs/postman/`](docs/postman): colección de Postman importable
- [`docs/evidencias/`](docs/evidencias): logs de consola y respuestas JSON

## Diferencias respecto al enunciado

- **Puerto del Config Server: 8888.** El enunciado indica 8080 en su `application.properties`, pero el texto y el cliente usan 8888 (`spring.config.import=optional:configserver:http://localhost:8888`). Con 8080 el cliente no encontraría el servidor.
- El código y los archivos de configuración son los del enunciado, con los nombres restaurados (`loan-service.properties`, `server.port`, `application.message`), que la traducción automática de la página había alterado.
- Versiones: Spring Boot 4.1.1 y Spring Cloud 2025.1.3 (Oakwood).
- `LoanServiceApplicationTests` declara `application.message` y desactiva el Config Client, porque el test de arranque no tiene un servidor de configuración disponible.
