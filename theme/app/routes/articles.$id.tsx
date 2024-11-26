import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { NotFoundError } from '~/utils/errors';

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id || !id.match(/^PMC[0-9]*$/)) throw NotFoundError();
  throw redirect(`/${id}`);
};
