import { join } from 'node:path';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const portEnv = process.env['PORT'];
  const port =
    portEnv != null && portEnv !== '' && !Number.isNaN(Number(portEnv)) ? Number(portEnv) : 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.info(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
