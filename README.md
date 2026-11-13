# Consulta Veritrade · Frontend

Panel web (React + TypeScript + Vite + Tailwind) para consultar la API del backend
[`Procesar_veritrade-backend`](../Procesar_veritrade-backend). Consume los endpoints
de reportes, metadatos, importaciones, compras por artículo, exportación y procesamiento de Excel.

## Vistas

El header compartido (`src/components/layout/AppHeader.tsx`) navega entre
**Importaciones** (`/compras/importaciones`) y **Compras**
(`/compras/compras`). La SPA se publica bajo `/compras/` en el mismo origen que
la suite PHP.

`src/features/importaciones/ImportacionesPage.tsx` organiza el análisis de
importaciones en pestañas:

- **Resumen:** KPIs, evolución mensual, tipo de importación (agrupado o detalle),
  países de origen y top de importadores.
- **Aduanas:** ranking por valor o volumen, concentración, ficha de la aduana
  seleccionada, evolución mensual y detalle de países, importadores y partidas.
- **Importadores:** ranking por valor o volumen, alcance México/Cancún, Pareto de
  concentración, costo unitario y peso por producto.
- **Proveedores:** ranking con % del total, concentración, costos y detalle
  exportador × país.
- **Productos y costos:** ranking de fracciones arancelarias, costo USD/kg y
  distribución de peso entre importadores para la partida seleccionada.
- **Comparativo:** dos meses calendario, variación de valor/volumen, cambio de
  participación en puntos porcentuales, estados nuevo/desaparece y detalle por
  partida, país, importador o proveedor.
- **Matriz:** mapa de calor de partidas × país/proveedor, con top N, “Otros”,
  participación dentro de cada producto y marca de muestra baja.
- **Operaciones:** búsqueda por descripción comercial, paginación, detalle en modal
  y exportación a XLSX/CSV.
- **Preguntas:** preguntas frecuentes precargadas en el backend (`/preguntas`) que
  se ejecutan contra `/consulta` y muestran un resumen con datos. Sin entrada de
  texto libre.

`src/features/compras/ComprasPage.tsx` es el módulo independiente de compras por
artículo (HORBIS INNOTRADE). Filtros y KPIs son comunes; el detalle se separa en
cinco pestañas:

- **KPIs:** importe total MXN, compras, proveedores, participación internacional,
  compras nacionales/internacionales, categorías y fracciones válidas.
- **Gráficas:** evolución mensual, nacional vs internacional, top categorías y top
  proveedores; las gráficas descargables permiten exportar su imagen PNG. Desde
  cada proveedor se puede abrir su análisis detallado.
- **Proveedores:** análisis basado en los filtros generales aplicados: KPIs,
  evolución mensual por ámbito, comparación de importe entre proveedores y
  comparación anual de compras por mes. La comparación anual marca los festivos
  oficiales de México y Semana Santa en sus fechas correspondientes por año; se
  pueden seleccionar las fechas a señalar y agregar fechas personalizadas que se
  repiten en cada año comparado. También muestra categorías, principales
  artículos y acceso a la tabla de compras individuales; sus gráficas también
  pueden descargarse como PNG, incluyendo títulos, totales y leyendas asociados.
- **Precios:** precio promedio anual por producto ponderado por cantidad, con tabla
  top 100 y evolución mensual del producto seleccionado, descargable como PNG.
- **Comparativo:** comparación entre dos meses calendario por descripción, categoría
  o proveedor; métrica de importe, cantidad o precio promedio; diferencia absoluta,
  variación y participación. La gráfica de diferencias se puede descargar como PNG.
- **Tabla:** artículos paginados con fecha, categoría, fracción, cantidad, importe,
  proveedor y ámbito; exportación XLSX/CSV.
- **Filtros:** fecha, categoría, ámbito, proveedor, artículo exacto, fracción y búsqueda.
- **Importación CSV:** carga desde la interfaz (`POST /compras/importar`) con modo
  reemplazar/agregar.

### Panel unificado de filtros

Importaciones y Compras comparten `src/components/ui/UnifiedFilterPanel.tsx`:
un único botón **Filtros** abre un popover anclado con las secciones de filtros
en tabs laterales, incluyendo fechas, búsqueda y controles multi-selección
(aduana, país y partida en Importaciones; categoría, proveedor, artículo,
fracción y ámbito en Compras). Cada valor se envía como
parámetro repetido y el backend los combina con OR. Los chips permiten quitar
filtros activos; los campos multi-selección también permiten seleccionar o
desmarcar todas las opciones, o los resultados visibles cuando hay una búsqueda
activa. Los cambios se aplican manualmente con el botón principal.

### Filtros en la URL

Los filtros aplicados y la pestaña activa se guardan en query params, por lo que
sobreviven a recargas, se pueden compartir y permiten navegar con atrás/adelante.

- Importaciones: `/compras/importaciones?aduana=CANCUN-%20QUINTANA%20ROO&partida=306179100&tab=productos`
- Compras: `/compras/compras?categoria=AVES&ambito=internacional&tab=graficas`
- `tab` controla la pestaña y no se envía a la API.
- `src/lib/viewRoutes.ts` centraliza el parseo y los builders de URL.

Transversal a todas las pestañas de importaciones:

- **Filtros globales:** rango de fechas, aduana, país de origen, partida,
  importador y exportador.
- **Indicadores (KPIs):** valor total USD, volumen, operaciones, costo unitario,
  importadores, exportadores, partidas y países.
- **Importación de Excel:** sube uno o varios archivos, ejecuta el pipeline del
  backend y carga los datos a MySQL (`/procesamiento/upload-lote` +
  `/procesamiento/cargar`). Cada carga guarda una copia en `salida/historial/`.
- **Estado de conexión:** verifica `/health` (API + MySQL) cada 30 segundos.

### Chatbot

El asistente está disponible en ambos módulos, **Importaciones** y **Compras**,
desde `src/App.tsx`. La conversación se conserva al cambiar de módulo y al
recargar la página mediante `localStorage`; se envían los últimos mensajes al
backend para mantener el contexto. El botón de limpiar conversación también
elimina el historial guardado.

Cuando el backend devuelve `filtros_sugeridos`, el chat navega automáticamente a
la vista correspondiente y aplica los filtros canónicos y la pestaña sugerida. Por
ejemplo, una consulta de compras de Aves abre
`/compras/compras?categoria=AVES&tab=graficas`, y una consulta de productos en Cancún abre
`/compras/importaciones?aduana=CANCUN-%20QUINTANA%20ROO&tab=productos`. Los filtros del chat reemplazan los
que estuvieran activos.

## Puesta en marcha

### 1. Backend

Sigue las instrucciones de `../Procesar_veritrade-backend/README.md` y deja la API
corriendo en `http://localhost:8001`.

### 2. Frontend

```bash
npm install
cp .env.example .env   # opcional en desarrollo
npm run dev
```

La SPA se sirve bajo `/compras/`. Para el flujo integrado local se usa Nginx en
`8000`, el PHP de la suite en `8002` y Vite en `5173`:

```bash
docker run -d --name veritrade_nginx_local --restart unless-stopped \
  --network host \
  -v "$PWD/deploy/nginx/local.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine
```

Abre `http://localhost:8000/compras/`. La suite queda en
`http://localhost:8000/`. Para depurar directo contra Vite:
`http://localhost:5173/compras/`.

### Configuración de la API

La SPA consume la API en `/compras/api`; Vite y Nginx eliminan ese prefijo antes
de llegar a FastAPI:

```env
VITE_API_URL=/compras/api
VITE_PROXY_TARGET=http://127.0.0.1:8001
```

Si usas un dominio separado para la API:

```env
VITE_API_URL=https://api.midominio.com
```

### Autenticación SSO con la suite PHP

En local la autenticación del frontend está desactivada por defecto. Para probar el
flujo real contra la suite:

```env
VITE_AUTH_ENABLED=true
VITE_AUTH_APP=compras
VITE_API_URL=/compras/api
VITE_AUTH_CONTEXT_URL=/api/auth/context.php
VITE_AUTH_LOGIN_URL=/login.php
VITE_AUTH_LOGOUT_URL=/logout.php
VITE_SUITE_URL=/
```

`VITE_SUITE_URL` alimenta el enlace **Suite** del header y la ruta `/suite`, que
redirige al proyecto PHP. Si se omite, se usa el origen de
`VITE_AUTH_CONTEXT_URL`.

El `AuthProvider` consulta el contexto con `credentials: "include"`, guarda el JWT
solo en memoria, lo inyecta como `Bearer` en las llamadas a la API y lo renueva
antes de que expire. Si la API responde 401, vuelve a pedir el contexto. Sin sesión
redirige al login de la suite; sin el permiso `compras.ver` muestra la pantalla de
acceso denegado.

La suite debe permitir el origen exacto de la SPA en CORS con credenciales. Si la
suite y la SPA no comparten un dominio registrable, la cookie de sesión no viaja y
el SSO por cookie no funciona.

La interfaz también respeta los permisos:

- Sin `compras.importar` no se muestran los botones de importar ni los diálogos de carga.
- Sin `compras.exportar` no se muestran los botones XLSX/CSV.
- Las exportaciones y la subida de Excel viajan con `Authorization: Bearer`; no se
  usan enlaces planos que pierdan el token.
- `compras.ver` habilita Importaciones y Compras para cualquier perfil, no solo
  para `admin`. La SPA usa ese permiso para mostrar el enlace y permitir la ruta.
- Para un perfil que solo deba ver Compras hace falta un permiso nuevo tipo
  `compras.importaciones.ver`; no se puede separar con los permisos actuales.

El contexto SSO devuelve `roles`, `legacy_role` y `permissions`; el header usa
`compras.ver` para la navegación. El backend sigue siendo la autoridad de permisos.

### Docker de desarrollo

`docker compose up` levanta Vite en http://localhost:5173. El contenedor usa
`network_mode: host` y `VITE_PROXY_TARGET=http://127.0.0.1:8001` para alcanzar el
backend FastAPI que corre en el host (escuchando en loopback).

El acceso integrado es `http://localhost:8000/compras/` a través del Nginx local.
Vite sigue disponible en `http://localhost:5173/compras/` para depurar con HMR.
El contenedor Nginx se levanta aparte con `deploy/nginx/local.conf`.

Este compose es solo para desarrollo: monta el código y usa HMR. No genera una
imagen de producción.

## Despliegue en producción

El repositorio no incluye un Dockerfile de producción del frontend. El
despliegue actual es un build estático servido por Nginx, que además hace de proxy
hacia la API.

### 1. Generar el build

```bash
npm ci
npm run build
```

El resultado queda en `dist/`. La SPA se sirve bajo `/compras/`; copia el build a
`/var/www/veritrade/compras`. Si defines `VITE_API_URL`, `VITE_AUTH_ENABLED` o las
URLs de SSO, hazlo antes del build: Vite las incorpora en tiempo de compilación,
no en tiempo de ejecución.

### 2. Servir con Nginx

Copia `dist/` al VPS en `/var/www/veritrade/compras`. Hay un ejemplo listo en
`deploy/nginx/production.conf.example`; ajústalo con tu dominio, PHP-FPM y ruta de
la API. La configuración equivalente es esta, junto con tu bloque PHP-FPM para la
suite:

```nginx
server {
    listen 443 ssl http2;
    server_name suite.tu-dominio.com;

    ssl_certificate     /etc/letsencrypt/live/suite.tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/suite.tu-dominio.com/privkey.pem;

    root /var/www/veritrade/suite;
    index index.php;

    client_max_body_size 50m;

    location = /compras {
        return 308 /compras/;
    }

    location /compras/api/ {
        proxy_pass http://veritrade_api:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
    }

    location /compras/ {
        alias /var/www/veritrade/compras/;
        try_files $uri $uri/ /compras/index.html;
    }

    location / {
        # Tu configuración PHP-FPM para la suite.
        # /api/auth/context.php debe seguir llegando a PHP.
    }
}
```

- `try_files ... /compras/index.html` es necesario para las rutas de React Router.
- El slash final de `proxy_pass` elimina `/compras/api/` antes de FastAPI.
- Si Nginx corre en el host, usa `http://127.0.0.1:8001/` para la API.
- Si Nginx corre en Docker, únelo a la red `veritrade_net` y usa
  `http://veritrade_api:8000/`.
- La configuración completa con redirección HTTP→HTTPS y TLS está en el README
  del backend: `../Procesar_veritrade-backend/README.md`.

### 3. Elegir cómo resolver la API

- **Mismo dominio con `/compras/api` (recomendado):** define
  `VITE_API_URL=/compras/api`; Nginx lo reenvía al backend.
- **Dominio separado:** define `VITE_API_URL=https://api.tu-dominio.com` antes del
  build y agrega ese dominio a `CORS_ORIGINS` en el backend.

### 4. Backend y datos

La API, MySQL, variables de entorno, actualización y respaldos se documentan en
`../Procesar_veritrade-backend/README.md`.

## Scripts

```bash
npm run dev      # servidor de desarrollo con HMR
npm run build    # type-check + build de producción
npm run preview  # sirve el build
npm run lint     # ESLint
```

## Estructura

```
src/
├── components/
│   ├── layout/           # AppHeader y elementos de estructura
│   └── ui/               # SectionCard, RankingTable, BarList, Segmented, Combobox2, estados
├── features/
│   ├── importaciones/
│   │   ├── ImportacionesPage.tsx
│   │   ├── components/   # filtros, KPIs, gráficas y secciones
│   │   ├── dialogs/      # carga de Excel y detalle de operaciones
│   │   └── tabs/         # Resumen, Importadores, Proveedores, Productos, Comparativo, Matriz, Operaciones, Preguntas
│   ├── compras/
│   │   ├── ComprasPage.tsx
│   │   ├── components/   # filtros, KPIs, gráficas y tabla
│   │   ├── dialogs/      # importación CSV
│   │   └── tabs/         # Precios y Comparativo
│   └── chatbot/          # widget del asistente
├── lib/format.ts         # formato de moneda MXN/USD, fechas y porcentajes
├── lib/viewRoutes.ts     # filtros y pestañas en query params
├── services/api/         # cliente HTTP y endpoints separados por dominio
├── types/                # contratos del backend y tipos compartidos
├── App.tsx               # rutas /importaciones, /compras y /suite
└── main.tsx              # QueryClientProvider + BrowserRouter con basename
```

Los imports internos usan el alias `@/`, configurado en `tsconfig.app.json` y
`vite.config.ts`. Por ejemplo:

```ts
import { api } from '@/services/api'
import type { Page } from '@/types/common'
```

## Endpoints consumidos

| Endpoint | Uso |
| --- | --- |
| `GET /health` | Estado de la API y MySQL |
| `GET /meta/{aduanas,paises,partidas}` | Opciones de los filtros |
| `GET /reportes/kpis` | Tarjetas de indicadores |
| `GET /reportes/aduanas` | Ranking y detalle de aduanas |
| `GET /reportes/mensual` | Serie mensual |
| `GET /reportes/tipo-importacion` | Dona de regímenes (`solo_principales`) |
| `GET /reportes/paises-origen` | Ranking de países |
| `GET /reportes/importadores` e `/importadores-cancun` | Rankings de importadores |
| `GET /reportes/proveedores` y `/proveedores-por-pais` | Proveedores y detalle por país |
| `GET /reportes/partidas` | Fracciones, costos y participación |
| `GET /reportes/comparativo` | Comparativo mensual y cambio de participación |
| `GET /reportes/matriz` | Matriz partida × país/proveedor |
| `GET /importaciones` y `/importaciones/buscar` | Tabla paginada |
| `GET /preguntas` y `POST /consulta` | Preguntas frecuentes y respuestas |
| `GET /exportar/importaciones` | Descarga XLSX/CSV |
| `GET /compras/{kpis,mensual,categorias,proveedores,meta,articulos}` | Dashboard, gráficas y tabla de compras |
| `GET /compras/precios` y `/precios/mensual` | Precio promedio ponderado anual y serie mensual |
| `GET /compras/comparativo` | Comparativo mensual de compras |
| `GET /compras/exportar` | Descarga de compras XLSX/CSV |
| `POST /compras/importar` | Carga del CSV de compras |
| `POST /procesamiento/upload-lote` y `/procesamiento/cargar` | Carga de uno o varios Excel |
