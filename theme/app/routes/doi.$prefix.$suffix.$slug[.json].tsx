import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  getPage,
  getMystXrefJson,
  getMystSearchJson,
  prefixSuffixToId,
} from '~/utils/loaders.server';

function api404(message = 'No API route found at this URL') {
  return json(
    {
      status: 404,
      message,
    },
    { status: 404 },
  );
}

export const loader: LoaderFunction = async ({ request }) => {
  const [prefix, suffix, slug] = new URL(request.url).pathname
    .slice(2)
    .replace(/\.json$/, '')
    .split('/');
  const id = prefixSuffixToId(prefix, suffix);
  // Handle myst.xref.json as slug
  if (slug === 'myst.xref') {
    const xref = await getMystXrefJson(id);
    if (!xref) return new Response('myst.xref.json not found', { status: 404 });
    return json(xref, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  // Handle /myst.search.json as slug
  else if (slug === 'myst.search') {
    const search = await getMystSearchJson(id);
    if (!search) {
      return json({ message: 'myst.search.json not found', status: 404 }, { status: 404 });
    }
    return json(search, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  const data = await getPage(request, id, { slug });
  if (!data) return api404('No page found at this URL.');
  return json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
};
