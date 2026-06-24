# Styles

Entry point: `global.css` (imports only). **Do not add rules to `global.css`.**

## Layout

| Path          | Purpose                                                 |
| ------------- | ------------------------------------------------------- |
| `tokens/`     | Fonts, `:root`, light theme                             |
| `base/`       | Focus, selection, shared keyframes                      |
| `components/` | Buttons, forms, alerts                                  |
| `layout/`     | Legacy header, `.layout`, `.main`, public pages shell   |
| `shell/`      | Sidebar, topbar, flyouts, `shell-nav-*`                 |
| `dashboard/`  | Stats, overview, workspace nav pills                    |
| `marketing/`  | Home, how-it-works, landing promos                      |
| `tracking/`   | Container track results, map, timeline                  |
| `ux/`         | Toasts, 404, command palette, notifications, module hub |

## Adding styles

1. **New product module** → `features/<module>.css`, then `@import` in `global.css` after `dashboard/`.
2. **Shell / nav** → `shell/nav.css` or `shell/app-shell.css`.
3. **Shared UI** → `components/`.
4. **Design tokens** → `tokens/theme.css` only.

Import order matters: tokens → base → components → layout → shell → features → ux.

## Regenerate (optional)

If you need to re-split from a monolith backup:

```bash
node scripts/split-global-css.mjs
```
