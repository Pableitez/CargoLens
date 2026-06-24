import core from "./es/core.js";
import tracking from "./es/tracking.js";
import ui from "./es/ui.js";
import pages from "./es/pages.js";
import modules from "./es/modules.js";

// Agregador ES (core + tracking + ui + pages + modules).
export default {
  ...core,
  ...tracking,
  ...ui,
  ...pages,
  ...modules,
};
