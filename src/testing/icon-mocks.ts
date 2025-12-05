import { MatIconRegistry } from '@angular/material/icon';
import { LUCIDE_ICONS } from 'lucide-angular';
import { of } from 'rxjs';

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
const stubIconRegistry = {
  addSvgIcon: () => stubIconRegistry,
  addSvgIconInNamespace: () => stubIconRegistry,
  addSvgIconLiteral: () => stubIconRegistry,
  addSvgIconLiteralInNamespace: () => stubIconRegistry,
  getNamedSvgIcon: () => of(svg),
  getSvgIconFromUrl: () => of(svg),
} as unknown as MatIconRegistry;

export const iconProviders = [
  { provide: MatIconRegistry, useValue: stubIconRegistry },
  { provide: LUCIDE_ICONS, useValue: [] },
];
