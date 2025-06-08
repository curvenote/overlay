import type { LoaderFunction } from '@remix-run/node';
import { NotFoundError } from '~/utils/errors';
import { getJatsXml, prefixSuffixToId } from '~/utils/loaders.server';

export const loader: LoaderFunction = async ({ params }) => {
  const { prefix, suffix } = params;
  if (!prefix || !suffix) throw NotFoundError();
  const id = prefixSuffixToId(prefix, suffix);
  const jatsXml = await getJatsXml(id);
  return new Response(jatsXml, { headers: { 'Content-Type': 'application/xml' } });
};
