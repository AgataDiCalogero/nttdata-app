// Angular testing setup required by Karma/Angular TestBed.
// Ensure base Zone.js is loaded before zone.js/testing which relies on the global Zone.
import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { of } from 'rxjs';

// Initialize the Angular testing environment using the non-deprecated browser testing APIs.
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
export const globalIconRegistryStub = {
  addSvgIcon: () => globalIconRegistryStub,
  addSvgIconInNamespace: () => globalIconRegistryStub,
  addSvgIconLiteral: () => globalIconRegistryStub,
  addSvgIconLiteralInNamespace: () => globalIconRegistryStub,
  getNamedSvgIcon: () => of(svgElement),
  getSvgIconFromUrl: () => of(svgElement),
} as unknown as MatIconRegistry;

export const lucideIconsStub = [];
