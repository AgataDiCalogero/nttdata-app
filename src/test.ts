import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { of } from 'rxjs';

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

const registryProto = MatIconRegistry.prototype as unknown as Record<string, unknown>;
registryProto.addSvgIcon = () => globalIconRegistryStub;
registryProto.addSvgIconLiteral = () => globalIconRegistryStub;
registryProto.addSvgIconInNamespace = () => globalIconRegistryStub;
registryProto.addSvgIconLiteralInNamespace = () => globalIconRegistryStub;
registryProto.getNamedSvgIcon = () => of(svgElement);
registryProto.getSvgIconFromUrl = () => of(svgElement);
