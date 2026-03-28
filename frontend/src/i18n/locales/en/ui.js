// Textos EN — ui
export default {
  "components": {
    "backLink": {
      "label": "Back",
      "aria": "Back to home"
    },
    "pageBreadcrumb": {
      "aria": "Breadcrumb"
    },
    "themeToggle": {
      "ariaDark": "Switch to dark mode",
      "ariaLight": "Switch to light mode",
      "titleDark": "Dark mode",
      "titleLight": "Light mode"
    },
    "searchBar": {
      "label": "Container number",
      "searching": "Searching…",
      "track": "Track",
      "hintMin": "At least 4 characters"
    },
    "loadingSkeleton": {
      "aria": "Loading shipment",
      "label": "Loading tracking data…"
    },
    "shipmentHeader": {
      "demoBanner": "Demo data — position and milestones are simulated unless the server uses a live API.",
      "container": "Container",
      "copyAria": "Copy container number",
      "copied": "Copied",
      "copy": "Copy",
      "refreshed": "Data retrieved:",
      "etaDest": "ETA · destination",
      "etaWhen": "Estimated arrival",
      "carrier": "Carrier"
    },
    "containerMeta": {
      "title": "Container and shipment",
      "isoType": "ISO type",
      "sizeType": "Size / type",
      "containerStatus": "Container status",
      "shipmentType": "Shipment type",
      "scacPrefix": "SCAC / prefix"
    },
    "dataSource": {
      "simulation": "Source: simulation",
      "mockTitle": "No SAFECUBE_API_KEY on server",
      "apiSafecubeTitle": "Sinay / Safecube API",
      "apiSafecube": "Source: API (Safecube)"
    },
    "mapPanel": {
      "title": "Live map",
      "latLongTitle": "Latitude · Longitude",
      "aisUpdate": "AIS update ·",
      "captionHasRouteAis": "AIS position · ocean route (Sinay segments)",
      "captionHasRouteOperator": "Position · operator route segments",
      "captionHasRouteDemo": "Simulated position · demo route",
      "captionNoRouteAis": "Last AIS position",
      "captionNoRouteOperator": "Latest known coordinates (event / port)",
      "captionNoRouteDemo": "Simulated position"
    },
    "savedPicker": {
      "label": "From saved containers",
      "placeholderLoading": "Loading saved containers…",
      "placeholderSearch": "Search {{count}} saved… (number, client, notes)",
      "placeholderEmpty": "No saved containers yet",
      "loading": "Loading…",
      "emptyHintBefore": "None yet — save them from the",
      "workspaceList": "workspace list",
      "emptyHintAfter": ".",
      "typeHint": "Type to filter — avoids loading a long dropdown.",
      "noMatch": "No saved containers match “{{query}}”.",
      "capHint": "Showing first {{max}} matches — narrow your search.",
      "listAria": "Matching saved containers",
      "clearAria": "Clear search",
      "clearButton": "Clear"
    }
  },
  "overviewSnapshot": {
    "title": "Containers",
    "sectionActive": "Active (operator API)",
    "sectionNonActive": "Non-active (completed, no operator API)",
    "sectionCompleted": "Completed (operator API)",
    "sectionCompletedNonApi": "Completed (no operator API)",
    "groupsRegionAria": "Grouped containers, scrollable",
    "groupsRegionAriaCompleted": "Completed shipments by client",
    "groupsRegionAriaNonApiActive": "Non-API active shipments by client (seed, manual, import)",
    "groupsRegionAriaCompletedNonApi": "Completed shipments without operator API, by client",
    "subtitleHeavy": "Grouped by client — expand a section or use “Expand all”.",
    "demoBadge": "Demo data",
    "wordClient": "client",
    "wordClients": "clients",
    "wordShipment": "shipment",
    "wordShipments": "shipments",
    "clientLabel": "Client",
    "allClients": "All clients",
    "unassigned": "Unassigned",
    "searchLabel": "Search",
    "searchPlaceholder": "Number, client, port, vessel, notes…",
    "clientSearchLabel": "Filter by client name",
    "clientSearchPlaceholder": "Type to filter clients…",
    "emptyClientNameSearch": "No client names match that filter.",
    "expandAll": "Expand all",
    "collapseAll": "Collapse all",
    "emptyClientFilter": "No shipments for this client. Choose “All clients” or another client.",
    "emptySearch": "No containers match your search.",
    "inThisClient": "In this client",
    "groupFilterPlaceholder": "Filter this client’s containers…",
    "groupFilterAria": "Filter containers for {{name}}",
    "emptyGroupFilter": "No containers match the filter for this client.",
    "seeLess": "See less",
    "seeAllInGroup": "See all {{count}} in this group",
    "yourContainersAria": "Your containers",
    "yourContainers": "Your containers",
    "groupAria": "{{name}}",
    "nextEta": "Next ETA",
    "fullList": "Full list",
    "noData": "No data",
    "originPol": "Origin (POL)",
    "destinationPod": "Destination (POD)",
    "vessel": "Vessel",
    "etd": "ETD",
    "eta": "ETA",
    "trackingLive": "Live",
    "trackingDemo": "Demo",
    "trackingIllustrative": "Illustrative",
    "badgeOperatorApi": "Operator API",
    "badgeDemoSeed": "Demo seed",
    "badgeImportSnapshot": "Import",
    "trackingNone": "No data",
    "removeFromSaved": "Remove from saved",
    "retryTrackingTitle": "Open tracking — requests operator data again",
    "historyTitle": "Completed (history)",
    "nonActiveNote":
      "Marked completed in your workspace; not tied to operator API rows. Open Tracking to load operator data if you need live routes.",
    "completedNonApiNote": "Completed without operator API — not shown on the fleet map.",
    "tabsAria": "Choose which container list to show",
    "tabApi": "Active (API)",
    "tabNonApi": "Non-active (seed & other)",
    "tabCompleted": "Completed",
    "tabNonApiHint": "No operator API — not shown on the fleet map below.",
    "emptyTabApi": "No active operator-API shipments in this view.",
    "emptyTabNonApi": "No non-API active rows (seed / manual / import) in this view.",
    "emptyTabCompleted": "No completed shipments in this view.",
    "statusCompleted": "Completed",
    "statusNoApiActive": "Non-API (not on map)",
    "historyNote": "Illustrative snapshot — open Tracking and load operator data for live details.",
    "noActive": "No active shipments in this view — see completed below or the saved list."
  },
  "overviewMap": {
    "loadingFleet": "Loading fleet positions…",
    "empty": "Nothing to show yet",
    "apiOnlyEmpty": "No operator API shipments on the map yet. Open Tracking for a container, load operator data, then it can appear here. Other saved rows may still show in the cards above.",
    "loadingMap": "Loading map…",
    "clickTooltip": "Click to track",
    "partialHint": "Some containers have no map position (no operator data). Use the summary above or Tracking."
  }
};
