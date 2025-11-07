// Angular testing setup required by Karma/Angular TestBed.
// Ensure base Zone.js is loaded before zone.js/testing which relies on the global Zone.
import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Initialize the Angular testing environment using the non-deprecated browser testing APIs.
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
