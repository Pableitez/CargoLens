# Styles

Entry point: `global.css` (imports only). **Do not add rules to `global.css`.**

## Layout

| Path          | Purpose                                     |
| ------------- | ------------------------------------------- |
| `tokens/`     | Fonts, `:root`, light theme                 |
| `base/`       | Focus, selection, shared keyframes          |
| `components/` | Buttons, forms, alerts                      |
| `layout/`     | Legacy header, `.layout`, `.main`           |
| `shell/`      | Sidebar, topbar, flyouts                    |
| `dashboard/`  | Orders, trade setup, modules, messages      |
| `marketing/`  | Home, how-it-works, landing                 |
| `ux/`         | Toasts, command palette, notifications, hub |

## Adding styles

1. **New product module** → `dashboard/<module>.css`, then `@import` in `global.css`.
2. **Shell / nav** → `shell/nav.css` or `shell/app-shell.css`.
3. **Shared UI** → `components/`.
4. **Design tokens** → `tokens/theme.css` only.

Import order matters: tokens → base → components → layout → shell → dashboard → marketing → ux.
