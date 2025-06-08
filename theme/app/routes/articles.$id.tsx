import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { NotFoundError } from '~/utils/errors';

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) throw NotFoundError();
  throw redirect(`/${id}`);
};
