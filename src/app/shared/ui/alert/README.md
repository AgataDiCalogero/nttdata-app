# Alert Component

A versatile alert component for displaying user messages, errors, and notifications.

## Variants

| Variant      | Use Case                                        |
| ------------ | ----------------------------------------------- |
| `info`       | Neutral information, empty states               |
| `success`    | Positive confirmations, successful operations   |
| `warning`    | Caution messages, non-critical issues           |
| `error`      | Critical errors, validation failures            |
| `decorative` | Stylized content without semantic alert meaning |

## Padding Options

| Padding    | Use Case                                |
| ---------- | --------------------------------------- |
| `default`  | General alerts with significant content |
| `compact`  | Form validation, inline alerts          |
| `spacious` | Hero banners, prominent messaging       |

## Theme Support

- ✅ **Dark Theme**: Default (dark backgrounds)
- ✅ **Light Theme**: Automatic adaptation
- ✅ **Reading Mode**: Special styling for accessibility
- ✅ **Color-Mix Fallbacks**: Progressive enhancement

## Common Combinations

```html
<!-- Form error -->
<app-alert variant="error" padding="compact"> Username is required </app-alert>

<!-- Success message -->
<app-alert variant="success"> Profile updated successfully </app-alert>

<!-- Empty state -->
<app-alert variant="info">
  <div class="empty-state">
    <h3>No results found</h3>
    <p>Try adjusting your filters</p>
  </div>
</app-alert>

<!-- Dismissible alert -->
<app-alert variant="warning" [dismissible]="true" (dismissed)="handleDismiss()">
  Your session will expire in 5 minutes
</app-alert>
```

## States

- **Default**: Standard alert styling
- **Dismissible**: Shows X button in top-right
- **Focus Visible**: WCAG-compliant focus ring

## Accessibility

- `role="status"` for status updates
- `aria-live="polite"` for screen readers
- `aria-atomic="true"` for content integrity
- Proper contrast ratios in all themes

## Technical Notes

- Uses CSS custom properties for theming
- Fully OnPush compatible
- Standalone component (Angular 14+)
- Supports projected content (<ng-content>)
