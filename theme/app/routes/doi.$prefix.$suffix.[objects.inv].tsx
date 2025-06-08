import type { LoaderFunction } from '@remix-run/node';
import { NotFoundError } from '~/utils/errors';
import { getObjectsInv, prefixSuffixToId } from '~/utils/loaders.server';

export const loader: LoaderFunction = async ({ params }): Promise<Response> => {
  const { prefix, suffix } = params;
  if (!prefix || !suffix) throw NotFoundError();
  const id = prefixSuffixToId(prefix, suffix);
  const inv = await getObjectsInv(id);
  if (!inv) return new Response('Inventory not found', { status: 404 });
  return new Response(inv);
};
