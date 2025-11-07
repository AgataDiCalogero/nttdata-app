import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app.component';
import { appConfig } from './app/app.config';

// bootstrapApplication returns a Promise; avoid top-level await for broader target support
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
