import { createSitemapResponse, getDomainFromRequest } from '@myst-theme/site';
import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  const sitemapPages = [''];
  return createSitemapResponse(getDomainFromRequest(request), sitemapPages);
};
