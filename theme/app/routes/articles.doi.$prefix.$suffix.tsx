import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { NotFoundError } from '~/utils/errors';

export const loader: LoaderFunction = async ({ params }) => {
  const { prefix, suffix } = params;
  if (!prefix || !suffix) throw NotFoundError();
  throw redirect(`/doi/${prefix}/${suffix}`);
};
