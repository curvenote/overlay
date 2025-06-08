import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { NotFoundError } from '~/utils/errors';
import { prefixSuffixToId } from '~/utils/loaders.server';

export const loader: LoaderFunction = async ({ params }) => {
  const { prefix, suffix } = params;
  if (!prefix || !suffix) throw NotFoundError();
  const id = prefixSuffixToId(prefix, suffix);
  throw redirect(`/doi/${id}`);
};
