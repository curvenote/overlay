import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getPage, prefixSuffixToId } from '~/utils/loaders.server';

function api404(message = 'No API route found at this URL') {
  return json(
    {
      status: 404,
      message,
    },
    { status: 404 },
  );
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const { prefix, suffix } = params;
  if (!prefix || !suffix) return api404('No page found at this URL.');
  const id = prefixSuffixToId(prefix, suffix);
  const data = await getPage(request, id, {});
  if (!data) return api404('No page found at this URL.');
  return json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
};
