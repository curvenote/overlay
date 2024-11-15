import type { LoaderFunction } from '@remix-run/node';
import { getObjectsInv } from '~/utils/loaders.server';

export const loader: LoaderFunction = async ({ request }): Promise<Response> => {
  const inv = await getObjectsInv(request);
  if (!inv) return new Response('Inventory not found', { status: 404 });
  return new Response(inv);
};
