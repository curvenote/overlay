import { createRobotsTxtResponse, getDomainFromRequest } from '@myst-theme/site';
import type { LoaderFunction } from '@remix-run/node';

function getRobotsOptions(request: Request): Parameters<typeof createRobotsTxtResponse>[1] {
  const { hostname } = new URL(request.url);
  if (hostname.endsWith('curve.report') || hostname.startsWith('launchpad-')) {
    return { allow: [], disallow: ['/'] };
  }
  return undefined;
}

export const loader: LoaderFunction = async ({ request }): Promise<Response | null> => {
  return createRobotsTxtResponse(getDomainFromRequest(request), getRobotsOptions(request));
};
