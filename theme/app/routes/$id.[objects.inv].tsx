import type { LoaderFunction } from '@remix-run/node';
import { NotFoundError } from '~/utils/errors';
import { getObjectsInv } from '~/utils/loaders.server';

export const loader: LoaderFunction = async ({ params }): Promise<Response> => {
  const { id } = params;
  if (!id || !id.match(/^PMC[0-9]*$/)) throw NotFoundError();
  const inv = await getObjectsInv(id);
  if (!inv) return new Response('Inventory not found', { status: 404 });
  return new Response(inv);
};
