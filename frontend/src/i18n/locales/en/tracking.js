// Textos EN — tracking
export default {
  "overview": {
    "aria": "Workspace overview",
    "trackTitle": "Tracking",
    "fullSummary": "Full overview",
    "srTrack": "Container search and results on the same overview page.",
    "summaryTitle": "Summary",
    "fleetMap": "Fleet map",
    "mapFilterHint": "Same filter as the list above.",
    "mapShowsApiOnly": "The map only shows shipments with operator API data (same as the “Active (API)” tab)."
  },
  "track": {
    "homeTitle": "Container visibility — from search to fleet map",
    "homeSubtitle": "Search any ISO below at no cost. When you need saved lists, client invites, Excel import, and fleet monitoring, create a workspace — free to start.",
    "mainTitle": "Tracking",
    "placeholder": "e.g. MAEU1234567",
    "placeholderDash": "e.g. MSKU1234567",
    "searching": "Searching…",
    "trackBtn": "Track",
    "hintChars": "4+ characters",
    "workspaceLifecycleAria": "Workspace lifecycle",
    "workspaceLifecycleHint":
      "This container is on your saved list — mark it completed when you consider the move finished for your records (independent of operator API data).",
    "embedHint": "Enter a container number (min. 4 characters). Operator data is not loaded automatically — use Track or “Load operator data” when you want live Safecube details.",
    "loadOperatorLead": "Container {{cn}} — load live data from the operator when you need it.",
    "loadOperatorBtn": "Load operator data",
    "loadOperatorAria": "Load live tracking from the operator",
    "route": "Route",
    "timeline": "Timeline",
    "homeLanding": {
      "aria": "Product overview",
      "valueTitle": "What you get",
      "valueLead": "Public tracking costs nothing. The workspace adds what operators use every day — lists, map, clients, and imports.",
      "card1Title": "Instant search",
      "card1Body": "Type a container number and see milestones, vessel, map, and timeline when operator data is available.",
      "card1ImageAlt": "Aerial view of a busy port with two container ships, tugboats, and green gantry cranes",
      "card2Title": "Workspace & fleet map",
      "card2Body": "Saved containers, overview, Excel import, and activity — one place for your team.",
      "card2ImageAlt": "Ship’s bridge in port with container cranes and vessels in the background",
      "card3Title": "Clients & invites",
      "card3Body": "Company codes for staff and per-client invites. Everyone sees only the shipments you share.",
      "card3ImageAlt": "Tugboat moving through open water, seen from above",
      "bottomTitle": "Go further",
      "bottomBody": "Try vessel lookup on the map, or read the three-step guide.",
      "linkVessels": "Vessel search",
      "linkHow": "How it works"
    },
    "homeWhatsNew": {
      "badge": "New",
      "aria": "Recent product updates",
      "title": "What’s new",
      "lead": "Recent improvements to CargoLens — see the full list on the changelog page.",
      "b1": "Command palette (Ctrl+K / ⌘K) for quick navigation and jumping to saved containers.",
      "b2": "Overview KPIs, fleet map, and activity for workspace teams.",
      "b3": "Installable PWA, print-friendly exports, and a clear banner when the API is unreachable.",
      "cta": "Read the changelog"
    },
    "guestPromo": {
      "title": "Lists, map, clients — in one workspace",
      "lead": "Search any ISO container to see milestones, vessel, route, and timeline when operator data is available. Create an account for saved lists, fleet map, clients, and imports.",
      "f1": "Public search with your container number — no account required",
      "f2": "Route, map, and event timeline in one place",
      "f3": "Workspace tools: saved containers, overview, Excel import, and activity",
      "ctaRegister": "Create free account",
      "ctaLogin": "Log in",
      "howItWorks": "How it works",
      "imageAlt": "Aerial view of a loaded container ship at sea"
    },
    "errors": {
      "minChars": "Enter at least 4 characters (ISO owner prefix).",
      "loadFailed": "Could not load tracking data."
    }
  },
  "vesselsPage": {
    "thSavedList": "On your list",
    "thSavedListHint": "Workspace status for saved containers on this vessel: active (still in progress) or completed (marked done).",
    "savedListLegend":
      "“On your list” comes from your saved shipments — not the vessel’s AIS or voyage phase. Active vs completed is how you marked each container in the workspace.",
    "savedStatusActive": "Active",
    "savedStatusCompleted": "Completed",
    "savedLineActive": "{{count}} active",
    "savedLineCompleted": "{{count}} completed",
    "paginationAria": "Results pages",
    "paginationPrev": "Previous",
    "paginationNext": "Next",
    "paginationSummary": "Showing {{start}}–{{end}} of {{total}}",
    "guestPromo": {
      "title": "Vessel search and map positions",
      "lead": "Look up ships by name, MMSI, or IMO and see them on the map when AIS data is available. With an account, load vessels linked to your saved containers — the same tracking as your workspace fleet map.",
      "f1": "Public search: no sign-in required (Ports & Vessels data)",
      "f2": "Results table + map: click a row to highlight the vessel",
      "f3": "After you register: “From saved containers” ties ships to your tracked cargo",
      "ctaRegister": "Create free account",
      "ctaLogin": "Log in",
      "howItWorks": "How it works",
      "imageAlt": "Container terminal with ships, cranes, and stacked containers at a commercial port"
    }
  },
  "dashboard": {
    "loadContainersFailed": "Could not load containers.",
    "containerSaved": "Container saved.",
    "saveFailed": "Could not save.",
    "containerRemoved": "Removed from list.",
    "deleteFailed": "Could not remove.",
    "clientCreated": "Client created.",
    "clientCreateFailed": "Could not create client.",
    "clientDeleted": "Client removed.",
    "clientDeleteFailed": "Could not remove client.",
    "clientUpdated": "Client updated.",
    "clientUpdateFailed": "Could not update client.",
    "changesSaved": "Changes saved.",
    "containerUpdateFailed": "Could not update container.",
    "importDone": "Import completed.",
    "importDoneDetail": "Imported {{created}} row(s), skipped {{skipped}}.",
    "importing": "Importing spreadsheet…",
    "importFailed": "Import failed.",
    "confirmRemoveContainer": "Remove this container from your list?",
    "confirmDeleteClient": "Delete this client? Reassign containers first.",
    "importSummary": "Imported {{created}} row(s). Skipped: {{skipped}}."
  }
};
