# Style Layers & Baseline

1. **Layer definition (the only ones that remain valid)**
   - **Tokens**: `src/styles/_variables.scss` + `src/styles/_tokens.scss` hold _only_ CSS custom properties (`:root` and `.light-theme/.dark-theme`). No selectors or MDC overrides. Tokens = variables, period; `tokens.scss` must never contain `.mat-mdc-*`, `.mdc-*`, `.cdk-*`, or `!important` rules that target components.
   - **Material overrides**: all `.mat-mdc-*`, `.mdc-*`, `.cdk-*` specificity belongs in `src/styles/_material-overrides.scss` (and `src/styles/_dialog.scss` for overlay/container skins). These files are now the single source of truth for any MDC adjustment.
   - **Foundations / layout utilities**: `src/styles/_foundations.scss`, `_mixins.scss`, `_appearance.scss`, `_buttons.scss`, `_forms.scss`, `_states.scss`, `_pagination.scss`, `_search.scss`, `_skeleton.scss` etc. define layout primitives, flex helpers, typography, and general UI utilities. They should not reach into MDC selectors either.
   - **Component styles**: per-component `.scss` files (e.g., `users.component.scss`, `post-form.component.scss`) scoping selectors to `app-*` markup for feature-specific layout and skinning.

2. **Baseline metrics (current)**
   | Metric | File | Count | Command |
   | --- | --- | --- | --- |
   | `.mat-mdc-` selectors | `src/styles/_tokens.scss` | 0 | `rg -o ".mat-mdc-" src/styles/_tokens.scss \| wc -l` |
   | `.mdc-` selectors | `src/styles/_tokens.scss` | 0 | `rg -o ".mdc-" src/styles/_tokens.scss \| wc -l` |
   | `.cdk-` selectors | `src/styles/_tokens.scss` | 0 | `rg -o ".cdk-" src/styles/_tokens.scss \| wc -l` |
   | `!important` directives | `src/styles/_tokens.scss` | 0 | `rg -o "!important" src/styles/_tokens.scss \| wc -l` |
   | `.mat-mdc-` selectors | `src/styles/_material-overrides.scss` | 94 | `rg -o ".mat-mdc-" src/styles/_material-overrides.scss \| wc -l` |
   | `.mdc-` selectors | `src/styles/_material-overrides.scss` | 25 | `rg -o ".mdc-" src/styles/_material-overrides.scss \| wc -l` |
   | `!important` directives | `src/styles/_material-overrides.scss` | 135 | `rg -o "!important" src/styles/_material-overrides.scss \| wc -l` |
   | `.cdk-` selectors | `src/styles/_dialog.scss` | 49 | `rg -o ".cdk-" src/styles/_dialog.scss \| wc -l` |

> These numbers represent the current “stop-the-bleeding” baseline. Every PR targeting the style system should report the same metrics so we can track progress without reintroducing tokens-level selectors.

3. **Guardrail script**

- `npm run check:token-selectors` (new guardrail) fails when `_tokens.scss` contains selectors such as `.mat-mdc-*`, `.mdc-*`, or `.cdk-*`, reinforcing the “variables only” rule before any style PR is merged.

4. **Milestone checklist (per request)**
   - **Milestone 0**: Freeze the layer definitions above; capture the baseline metrics above and commit this document as the record of “safe” layers.
   - **Milestone 1**: Move every `.mat-mdc-*`, `.mdc-*`, `.cdk-*` rule out of `_tokens.scss` into `_material-overrides.scss` (or `_dialog.scss` for overlays). After the move, `tokens.scss` must declare only variables again.
   - **Milestone 2**: Centralize commonly shared classes (e.g., `.app-results-summary`, `.form-dialog`) into a single foundation partial instead of redefining them in multiple feature SCSS files.
   - **Milestone 3**: Rework `ResponsiveDialogService` / `_dialog.scss` so panel classes become semantic variants (`app-dialog--sm`, `app-dialog--sheet`, etc.), and ensure dialog skeletons (e.g., comments dialog) have clear header/body/composer regions with a scrollable list and a compact composer.
   - **Milestone 4**: Standardize the filters bar in Users + Posts via the same mobile-first flex pattern (column then wrapped row, `flex: 1 1 auto`, `min-width: 0`).
   - **Milestone 5**: Choose one path for selects/search/dialogs and stick to it (either every form uses `app-select`/`app-search-bar`/`ResponsiveDialogService`, or drop the wrapper entirely and document it).
   - **Milestone 6**: Guardrail automation: prevent tokens files from reintroducing selectors/MDC overrides (`rg` check) and ensure any `.mat-mdc-*` update touches only `_material-overrides.scss`.

5. **Governance reminders**

- Tokens = variables only; if you need a new color/shadow/breakpoint, add it to `:root` (and `.light-theme/.dark-theme` when necessary). Do not add selectors or `!important` in `_tokens.scss`. Material-specific CSS variables such as `--mat-field-*`, `--mat-option-*`, etc., now live exclusively in `_material-overrides.scss` so we can keep Material overrides self-contained.
- MDC overrides must live in `_material-overrides.scss` (`.mat-mdc-*`, `.mdc-*`, `.cdk-*`). For overlay sizing/skins, extend `_dialog.scss` with semantic panel variants—never add the same selectors elsewhere.
- Component-level styles may reference CSS custom properties from tokens/mixins, but they should avoid `!important` unless absolutely necessary and scoped inside the component.
- Run `npm run check:token-selectors` before touching `_tokens.scss` to catch accidental selector introductions early.

6. **Next steps**
   - Link to this document from the main README so every contributor knows the governance model (see README addition below).
   - Start Milestone 1 by auditing `_tokens.scss` and relocating selectors into `_material-overrides.scss`.
   - Track the `rg` counts listed above in future commits so progress is measurable.
