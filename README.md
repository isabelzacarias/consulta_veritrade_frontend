# Consulta Veritrade · Frontend

Panel web (React + TypeScript + Vite + Tailwind) para consultar la API del backend
[`Procesar_veritrade-backend`](../Procesar_veritrade-backend). Consume los endpoints
de reportes, metadatos, importaciones, exportación y procesamiento de Excel.

## Vistas

`src/features/panel/PanelPage.tsx` organiza el análisis en pestañas:

- **Resumen:** KPIs, evolución mensual, tipo de importación (agrupado o detalle),
  países de origen y top de importadores.
- **Importadores:** ranking por valor o volumen, alcance México/Cancún, Pareto de
  concentración, costo unitario y peso por producto.
- **Proveedores:** ranking con % del total, concentración, costos y detalle
  exportador × país.
- **Productos y costos:** ranking de fracciones arancelarias, costo USD/kg y
  distribución de peso entre importadores para la partida seleccionada.
- **Operaciones:** búsqueda por descripción comercial, paginación, detalle en modal
  y exportación a XLSX/CSV.
- **Preguntas:** preguntas frecuentes precargadas en el backend (`/preguntas`) que
  se ejecutan contra `/consulta` y muestran un resumen con datos. Sin entrada de
  texto libre.

Transversal a todas las pestañas:

- **Filtros globales:** rango de fechas, aduana, país de origen, partida,
  importador y exportador.
- **Indicadores (KPIs):** valor total USD, volumen, operaciones, costo unitario,
  importadores, exportadores, partidas y países.
- **Importación de Excel:** sube el archivo, ejecuta el pipeline del backend y
  carga los datos a MySQL (`/procesamiento/upload` + `/procesamiento/cargar`).
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
├── features/panel/       # layout, filtros, KPIs, gráficas, modales
│   └── tabs/             # Resumen, Importadores, Proveedores, Productos, Operaciones, Preguntas
├── lib/format.ts         # formato de moneda, fechas y porcentajes
├── services/api.ts       # cliente tipado de la API
├── types/                # tipos del contrato del backend
├── App.tsx
└── main.tsx              # QueryClientProvider
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
| `GET /importaciones` y `/importaciones/buscar` | Tabla paginada |
| `GET /preguntas` y `POST /consulta` | Preguntas frecuentes y respuestas |
| `GET /exportar/importaciones` | Descarga XLSX/CSV |
| `POST /procesamiento/upload` y `/procesamiento/cargar` | Carga del Excel |
