// Textos ES — ui
export default {
  "components": {
    "backLink": {
      "label": "Volver",
      "aria": "Volver al inicio"
    },
    "pageBreadcrumb": {
      "aria": "Migas de pan"
    },
    "themeToggle": {
      "ariaDark": "Cambiar a modo oscuro",
      "ariaLight": "Cambiar a modo claro",
      "titleDark": "Modo oscuro",
      "titleLight": "Modo claro"
    },
    "searchBar": {
      "label": "Número de contenedor",
      "searching": "Buscando…",
      "track": "Seguir",
      "hintMin": "Mínimo 4 caracteres"
    },
    "loadingSkeleton": {
      "aria": "Cargando envío",
      "label": "Cargando datos de seguimiento…"
    },
    "shipmentHeader": {
      "demoBanner": "Datos de demostración — la posición y hitos son simulados salvo que el servidor use API real.",
      "container": "Contenedor",
      "copyAria": "Copiar número de contenedor",
      "copied": "Copiado",
      "copy": "Copiar",
      "refreshed": "Datos consultados:",
      "etaDest": "ETA · destino",
      "etaWhen": "Llegada prevista",
      "carrier": "Naviera"
    },
    "containerMeta": {
      "title": "Contenedor y envío",
      "isoType": "Tipo ISO",
      "sizeType": "Tamaño / tipo",
      "containerStatus": "Estado del contenedor",
      "shipmentType": "Tipo de envío",
      "scacPrefix": "SCAC / prefijo"
    },
    "dataSource": {
      "simulation": "Origen: simulación",
      "mockTitle": "Sin SAFECUBE_API_KEY en el servidor",
      "apiSafecubeTitle": "API Sinay / Safecube",
      "apiSafecube": "Origen: API (Safecube)"
    },
    "mapPanel": {
      "title": "Mapa en vivo",
      "latLongTitle": "Latitud · Longitud",
      "aisUpdate": "Actualización AIS ·",
      "captionHasRouteAis": "Posición AIS · ruta oceánica (segmentos Sinay)",
      "captionHasRouteOperator": "Posición · segmentos de ruta del operador",
      "captionHasRouteDemo": "Posición simulada · ruta demo",
      "captionNoRouteAis": "Última posición AIS",
      "captionNoRouteOperator": "Últimas coordenadas conocidas (evento / puerto)",
      "captionNoRouteDemo": "Posición simulada"
    },
    "savedPicker": {
      "label": "Desde contenedores guardados",
      "placeholderLoading": "Cargando contenedores guardados…",
      "placeholderSearch": "Buscar entre {{count}} guardados… (número, cliente, notas)",
      "placeholderEmpty": "Aún no hay contenedores guardados",
      "loading": "Cargando…",
      "emptyHintBefore": "Aún no hay — guárdalos desde la",
      "workspaceList": "lista del espacio",
      "emptyHintAfter": ".",
      "typeHint": "Escribe para filtrar — evita un desplegable largo.",
      "noMatch": "Ningún contenedor guardado coincide con «{{query}}».",
      "capHint": "Mostrando las primeras {{max}} coincidencias — acota la búsqueda.",
      "listAria": "Contenedores guardados coincidentes",
      "clearAria": "Borrar búsqueda",
      "clearButton": "Borrar"
    }
  },
  "overviewSnapshot": {
    "title": "Contenedores",
    "sectionActive": "Activos (API operador)",
    "sectionNonActive": "No activos (completados, sin API operador)",
    "sectionCompleted": "Completados (API operador)",
    "sectionCompletedNonApi": "Completados (sin API operador)",
    "groupsRegionAria": "Contenedores agrupados, desplazable",
    "groupsRegionAriaCompleted": "Envíos completados por cliente",
    "groupsRegionAriaNonApiActive": "Envíos activos sin API por cliente (seed, manual, importación)",
    "groupsRegionAriaCompletedNonApi": "Envíos completados sin API del operador, por cliente",
    "subtitleHeavy": "Agrupado por cliente — despliega una sección o usa «Expandir todo».",
    "demoBadge": "Datos demo",
    "wordClient": "cliente",
    "wordClients": "clientes",
    "wordShipment": "envío",
    "wordShipments": "envíos",
    "clientLabel": "Cliente",
    "allClients": "Todos los clientes",
    "unassigned": "Sin asignar",
    "searchLabel": "Buscar",
    "searchPlaceholder": "Número, cliente, puerto, buque, notas…",
    "clientSearchLabel": "Filtrar por nombre de cliente",
    "clientSearchPlaceholder": "Escribe para filtrar clientes…",
    "emptyClientNameSearch": "Ningún cliente coincide con ese filtro.",
    "expandAll": "Expandir todo",
    "collapseAll": "Plegar todo",
    "emptyClientFilter": "No hay envíos para este cliente. Elige «Todos los clientes» u otro cliente.",
    "emptySearch": "Ningún contenedor coincide con tu búsqueda.",
    "inThisClient": "En este cliente",
    "groupFilterPlaceholder": "Filtrar contenedores de este cliente…",
    "groupFilterAria": "Filtrar contenedores de {{name}}",
    "emptyGroupFilter": "Ningún contenedor coincide con el filtro para este cliente.",
    "seeLess": "Ver menos",
    "seeAllInGroup": "Ver las {{count}} de este grupo",
    "yourContainersAria": "Tus contenedores",
    "yourContainers": "Tus contenedores",
    "groupAria": "{{name}}",
    "nextEta": "Próx. ETA",
    "fullList": "Lista completa",
    "noData": "Sin datos",
    "originPol": "Origin (POL)",
    "destinationPod": "Destination (POD)",
    "vessel": "Vessel",
    "etd": "ETD",
    "eta": "ETA",
    "trackingLive": "En vivo",
    "trackingDemo": "Demo",
    "trackingIllustrative": "Ilustrativo",
    "badgeOperatorApi": "API operador",
    "badgeDemoSeed": "Demo (seed)",
    "badgeImportSnapshot": "Importación",
    "trackingNone": "Sin datos",
    "removeFromSaved": "Quitar de guardados",
    "retryTrackingTitle": "Abre el seguimiento y vuelve a pedir datos al operador",
    "historyTitle": "Completados (histórico)",
    "nonActiveNote":
      "Marcados como completados en tu espacio; no provienen de filas con API de operador. Abre Seguimiento para cargar datos del operador si necesitas rutas en vivo.",
    "completedNonApiNote": "Completados sin API del operador — no aparecen en el mapa de flota.",
    "tabsAria": "Elige qué lista de contenedores ver",
    "tabApi": "Activos (API)",
    "tabNonApi": "No activos (seed y otros)",
    "tabCompleted": "Completados",
    "tabNonApiHint": "Sin API del operador — no aparecen en el mapa de flota.",
    "emptyTabApi": "No hay envíos activos con API del operador en esta vista.",
    "emptyTabNonApi": "No hay filas activas sin API (seed / manual / importación) en esta vista.",
    "emptyTabCompleted": "No hay envíos completados en esta vista.",
    "statusCompleted": "Completado",
    "statusNoApiActive": "Sin API (no en mapa)",
    "historyNote": "Vista ilustrativa — abre Seguimiento y carga datos del operador para detalles en vivo.",
    "noActive": "No hay envíos activos en esta vista — mira los completados abajo o la lista guardada."
  },
  "overviewMap": {
    "loadingFleet": "Cargando posiciones de la flota…",
    "empty": "Aún no hay datos que mostrar",
    "apiOnlyEmpty": "Aún no hay envíos con API de operador en el mapa. Abre Seguimiento para un contenedor, carga datos del operador, y podrá aparecer aquí. Otras filas guardadas pueden seguir en las tarjetas de arriba.",
    "loadingMap": "Cargando mapa…",
    "clickTooltip": "Clic para seguir",
    "partialHint": "Algunos contenedores no tienen posición en mapa (sin datos del operador). Usa el resumen superior o Seguimiento."
  }
};
