import type { LoaderFunction } from '@remix-run/node';
import { getJatsXml } from '~/utils/loaders.server';

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) throw Error('No site');
  const jatsXml = await getJatsXml(id);
  return new Response(jatsXml, { headers: { 'Content-Type': 'application/xml' } });
};
