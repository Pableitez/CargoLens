import core from "./en/core.js";
import tracking from "./en/tracking.js";
import ui from "./en/ui.js";
import pages from "./en/pages.js";

// Agregador EN (core + tracking + ui + pages).
export default {
  ...core,
  ...tracking,
  ...ui,
  ...pages,
};
