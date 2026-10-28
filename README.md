# Consulta Veritrade · Frontend

Panel web (React + TypeScript + Vite + Tailwind) para consultar la API del backend
[`Procesar_veritrade-backend`](../Procesar_veritrade-backend). Consume los endpoints
de reportes, metadatos, importaciones, compras por artículo, exportación y procesamiento de Excel.

## Vistas

El header compartido (`src/components/AppHeader.tsx`) navega entre **Importaciones**
(`/`) y **Compras** (`/compras`).

`src/features/panel/PanelPage.tsx` organiza el análisis de importaciones en pestañas:

- **Resumen:** KPIs, evolución mensual, tipo de importación (agrupado o detalle),
  países de origen y top de importadores.
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
artículo (HORBIS INNOTRADE). Filtros y KPIs son comunes; el detalle se separa en dos
pestañas:

- **KPIs:** importe total MXN, compras, proveedores, participación internacional,
  compras nacionales/internacionales, categorías y fracciones válidas.
- **Gráficas:** evolución mensual, nacional vs internacional, top categorías y top
  proveedores.
- **Tabla:** artículos paginados con fecha, categoría, fracción, cantidad, importe,
  proveedor y ámbito; exportación XLSX/CSV.
- **Filtros:** fecha, categoría, ámbito, proveedor, fracción y búsqueda.
- **Importación CSV:** carga desde la interfaz (`POST /compras/importar`) con modo
  reemplazar/agregar.

Transversal a todas las pestañas de importaciones:

- **Filtros globales:** rango de fechas, aduana, país de origen, partida,
  importador y exportador.
- **Indicadores (KPIs):** valor total USD, volumen, operaciones, costo unitario,
  importadores, exportadores, partidas y países.
- **Importación de Excel:** sube uno o varios archivos, ejecuta el pipeline del
  backend y carga los datos a MySQL (`/procesamiento/upload-lote` +
  `/procesamiento/cargar`). Cada carga guarda una copia en `salida/historial/`.
- **Estado de conexión:** verifica `/health` (API + MySQL) cada 30 segundos.

## Puesta en marcha

### 1. Backend

Sigue las instrucciones de `../Procesar_veritrade-backend/README.md` y deja la API
corriendo en `http://localhost:8000`.

### 2. Frontend

```bash
npm install
cp .env.example .env   # opcional en desarrollo
npm run dev
```

Abre http://localhost:5173.

### Configuración de la API

En desarrollo, Vite reenvía `/api/*` a `http://localhost:8000/*` (ver
`vite.config.ts`). Por eso el cliente usa `/api` como base y no hay problemas de
CORS.

Para apuntar a otro backend, define en `.env`:

```env
VITE_API_URL=https://api.midominio.com
```

Si solo quieres cambiar el destino del proxy de desarrollo (sin tocar el cliente):

```env
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

### Docker

`docker compose up` levanta Vite en http://localhost:5173. El contenedor usa
`network_mode: host` y `VITE_PROXY_TARGET=http://127.0.0.1:8000` para alcanzar el
backend FastAPI que corre en el host (escuchando en loopback).

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
├── components/ui/        # SectionCard, RankingTable, BarList, Segmented, estados
├── components/
│   ├── AppHeader.tsx     # navegación Importaciones / Compras
│   └── ui/               # SectionCard, RankingTable, BarList, Segmented, estados
├── features/panel/       # layout, filtros, KPIs, gráficas, modales
│   └── tabs/             # Resumen, Importadores, Proveedores, Productos, Comparativo, Matriz, Operaciones, Preguntas
├── features/compras/     # página, filtros, KPIs, gráficas, tabla e importación CSV
├── lib/format.ts         # formato de moneda MXN/USD, fechas y porcentajes
├── services/api.ts       # cliente tipado de la API
├── types/                # tipos del contrato del backend (importaciones y compras)
├── App.tsx               # rutas / y /compras
└── main.tsx              # QueryClientProvider + BrowserRouter
```

## Endpoints consumidos

| Endpoint | Uso |
| --- | --- |
| `GET /health` | Estado de la API y MySQL |
| `GET /meta/{aduanas,paises,partidas}` | Opciones de los filtros |
| `GET /reportes/kpis` | Tarjetas de indicadores |
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
| `GET /compras/exportar` | Descarga de compras XLSX/CSV |
| `POST /compras/importar` | Carga del CSV de compras |
| `POST /procesamiento/upload-lote` y `/procesamiento/cargar` | Carga de uno o varios Excel |
