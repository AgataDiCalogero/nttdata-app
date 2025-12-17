# Style Layers & Baseline

1. **Layer definition (the only ones that remain valid)**
   - **Tokens**: `src/styles/_variables.scss` + `src/styles/_tokens.scss` hold *only* CSS custom properties (`:root` and `.light-theme/.dark-theme`). No selectors or MDC overrides. Tokens = variables, period; `tokens.scss` must never contain `.mat-mdc-*`, `.mdc-*`, `.cdk-*`, or `!important` rules that target components.
   - **Material overrides**: all `.mat-mdc-*`, `.mdc-*`, `.cdk-*` specificity belongs in `src/styles/_material-overrides.scss` (and `src/styles/_dialog.scss` for overlay/container skins). These files are now the single source of truth for any MDC adjustment.
   - **Foundations / layout utilities**: `src/styles/_foundations.scss`, `_mixins.scss`, `_appearance.scss`, `_buttons.scss`, `_forms.scss`, `_states.scss`, `_pagination.scss`, `_search.scss`, `_skeleton.scss` etc. define layout primitives, flex helpers, typography, and general UI utilities. They should not reach into MDC selectors either.
   - **Component styles**: per-component `.scss` files (e.g., `users.component.scss`, `post-form.component.scss`) scoping selectors to `app-*` markup for feature-specific layout and skinning.

2. **Baseline metrics (measured via `rg` for reference before any cleanup)**  
   | Metric | Scope | Count | Command |
   | --- | --- | --- | --- |
   | `!important` tokens | `src/styles/_material-overrides.scss` | 74 | `rg -o "!important" src/styles/_material-overrides.scss \| wc -l` |
   | `!important` tokens | `src/styles/_tokens.scss` | 98 | `rg -o "!important" src/styles/_tokens.scss \| wc -l` |
   | `.mat-mdc-` selectors | `src/styles/_material-overrides.scss` | 27 | `rg -o "\.mat-mdc-" src/styles/_material-overrides.scss \| wc -l` |
   | `.mat-mdc-` selectors | `src/styles/_tokens.scss` | 74 | `rg -o "\.mat-mdc-" src/styles/_tokens.scss \| wc -l` |
   | `.mat-mdc-` selectors | `src/styles/_forms.scss` | 13 | `rg -o "\.mat-mdc-" src/styles/_forms.scss \| wc -l` |
   | `.mat-mdc-` selectors | `src/styles/_search.scss` | 2 | `rg -o "\.mat-mdc-" src/styles/_search.scss \| wc -l` |
   | `.cdk-overlay-` selectors | `src/styles/_dialog.scss` | 21 | `rg -o "\.cdk-overlay" src/styles/_dialog.scss \| wc -l` |

   > These counts are the current “stop-the-bleeding” baseline numbers. Every PR targeting the style system should include before/after counts for the same metrics.

3. **Milestone checklist (per request)**
   - **Milestone 0**: Freeze the layer definitions above; capture the baseline metrics above and commit this document as the record of “safe” layers.
   - **Milestone 1**: Move every `.mat-mdc-*`, `.mdc-*`, `.cdk-*` rule out of `_tokens.scss` into `_material-overrides.scss` (or `_dialog.scss` for overlays). After the move, `tokens.scss` must declare only variables again.
   - **Milestone 2**: Centralize commonly shared classes (e.g., `.app-results-summary`, `.form-dialog`) into a single foundation partial instead of redefining them in multiple feature SCSS files.
   - **Milestone 3**: Rework `ResponsiveDialogService` / `_dialog.scss` so panel classes become semantic variants (`app-dialog--sm`, `app-dialog--sheet`, etc.), and ensure dialog skeletons (e.g., comments dialog) have clear header/body/composer regions with a scrollable list and a compact composer.
   - **Milestone 4**: Standardize the filters bar in Users + Posts via the same mobile-first flex pattern (column then wrapped row, `flex: 1 1 auto`, `min-width: 0`).
   - **Milestone 5**: Choose one path for selects/search/dialogs and stick to it (either every form uses `app-select`/`app-search-bar`/`ResponsiveDialogService`, or drop the wrapper entirely and document it).
   - **Milestone 6**: Guardrail automation: prevent tokens files from reintroducing selectors/MDC overrides (`rg` check) and ensure any `.mat-mdc-*` update touches only `_material-overrides.scss`.

4. **Governance reminders**
   - Tokens = variables only; if you need a new color/shadow/breakpoint, add it to `:root` (and `.light-theme/.dark-theme` when necessary). Do not add selectors or `!important` in `_tokens.scss`.
   - MDC overrides must live in `_material-overrides.scss` (`.mat-mdc-*`, `.mdc-*`, `.cdk-*`). For overlay sizing/skins, extend `_dialog.scss` with semantic panel variants—never add the same selectors elsewhere.
   - Component-level styles may reference CSS custom properties from tokens/mixins, but they should avoid `!important` unless absolutely necessary and scoped inside the component.

5. **Next steps**
   - Link to this document from the main README so every contributor knows the governance model (see README addition below).
   - Start Milestone 1 by auditing `_tokens.scss` and relocating selectors into `_material-overrides.scss`.
   - Track the `rg` counts listed above in future commits so progress is measurable.
