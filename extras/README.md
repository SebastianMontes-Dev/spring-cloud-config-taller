# Extras (opcionales)

Mejoras que **no forman parte del taller** y no modifican ningún archivo de `config-server/` ni de `loan-service/`. Todo se activa desde aquí, por variables de entorno o por carpetas adicionales.

| Extra | Qué agrega |
|---|---|
| [`docker-compose.yml`](docker-compose.yml) | Levanta MySQL, el Config Server del taller y `loan-service-mysql` |
| [`loan-service-mysql/`](loan-service-mysql) | Variante del cliente que guarda préstamos en MySQL; su configuración viene del Config Server |
| [`config/`](config) | Archivos `loan-service-mysql*.properties` que el Config Server sirve además de los del taller |
| [`git-backend/`](git-backend) | Perfil `git` para el Config Server: lee la configuración de un repositorio Git en vez de `classpath:/config` |

## 1. Docker Compose + MySQL

Requiere Docker. Desde esta carpeta:

```bash
cp .env.example .env      # completar MYSQL_ROOT_PASSWORD y MYSQL_PASSWORD
docker compose up -d --build
```

| Servicio | Puerto en el host |
|---|---|
| `config-server` | 8888 |
| `loan-service-mysql` | 8084 |
| `mysql` | 3308 (el 3306 suele estar ocupado por un MySQL local) |

Probar:

```bash
curl http://localhost:8084/message
curl -X POST http://localhost:8084/loans -H 'Content-Type: application/json' \
     -d '{"applicantName":"Ana Torres","amount":15000.50,"termMonths":24}'
curl http://localhost:8084/loans
```

Detener y borrar datos: `docker compose down -v`.

### Cómo llega la configuración

- `SPRING_CLOUD_CONFIG_SERVER_NATIVE_SEARCH_LOCATIONS=classpath:/config,file:/extras-config/` suma la carpeta [`config/`](config) a la del taller. Es una variable de entorno, así que el `application.properties` del taller no se toca.
- `loan-service-mysql-docker.properties` (perfil `docker`) cambia la URL de MySQL a `mysql:3306`, el nombre del servicio dentro de la red de Compose.
- **La contraseña no pasa por el Config Server.** `loan-service-mysql.properties` contiene `spring.datasource.password=${MYSQL_PASSWORD}`. El servidor no tiene esa variable y deja el texto literal; el cliente lo resuelve con su propia variable de entorno. En producción conviene además proteger el servidor con autenticación y cifrar valores sensibles (`{cipher}`).
- El esquema lo crea [`db/schema.sql`](db/schema.sql) al inicializar el volumen de MySQL; Hibernate solo valida (`ddl-auto=validate`).

### Ejecutar sin Docker para el cliente

Con solo MySQL en Docker (`docker compose up -d mysql`) y el Config Server del taller arrancado con la carpeta extra:

```bash
cd config-server
SPRING_CLOUD_CONFIG_SERVER_NATIVE_SEARCH_LOCATIONS=classpath:/config,file:../extras/config/ ./mvnw spring-boot:run
# otra terminal
cd extras/loan-service-mysql
MYSQL_PASSWORD=<el de .env> ./mvnw spring-boot:run
```

## 2. Perfil `git` del Config Server

Sirve la configuración desde un repositorio Git. Los archivos de ejemplo están en [`git-backend/config-repo/`](git-backend/config-repo), con un mensaje distinto ("... (Git)") para distinguir de dónde viene cada respuesta.

```bash
cd config-server
SPRING_PROFILES_ACTIVE=git \
SPRING_CONFIG_ADDITIONAL_LOCATION=file:../extras/git-backend/ \
CONFIG_GIT_URI=https://github.com/<usuario>/spring-cloud-config-taller \
./mvnw spring-boot:run
```

`CONFIG_GIT_URI` también acepta una ruta local, por ejemplo `file:///C:/ruta/spring-cloud-config-taller`. El servidor lee solo la carpeta indicada en `search-paths` y solo lo que está **commiteado** en la rama `main`.

`GET http://localhost:8888/loan-service/dev` devuelve entonces `Welcome From Development Profile (Git)`.

## Tests

```bash
cd loan-service-mysql && ./mvnw test
```
