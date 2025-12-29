import {
  AngularAppEngine,
  createRequestHandler,
  ɵsetAngularAppEngineManifest as setAngularAppEngineManifest,
  ɵsetAngularAppManifest as setAngularAppManifest,
} from '@angular/ssr';
import { getContext } from '@netlify/angular-runtime/context.mjs';
import appEngineManifest from './angular-app-engine-manifest.mjs';
import appManifest from './angular-app-manifest.mjs';

setAngularAppEngineManifest(appEngineManifest);
setAngularAppManifest(appManifest);

const angularAppEngine = new AngularAppEngine();

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext();

  const result = await angularAppEngine.handle(request, context);
  return result || new Response('Not found', { status: 404 });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
