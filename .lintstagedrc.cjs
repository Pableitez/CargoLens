module.exports = {
  "*.{js,jsx,ts,tsx,json,css,md}": "prettier --write",
  "frontend/**/*.{js,jsx,ts,tsx}":
    "npm exec --prefix frontend -- eslint --fix --config frontend/eslint.config.js",
  "frontend/**/*.{ts,tsx}": () => "npm run typecheck --prefix frontend",
  "backend/**/*.js": "npm test --prefix backend -- --passWithNoTests --bail --findRelatedTests",
};
