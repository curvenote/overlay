import { redirect, type ActionFunction } from '@remix-run/node';
import { triggerPubSub } from '~/utils/loaders.server';

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== 'POST') return null;
  const { id } = params ?? {};
  if (!id) return null;
  await triggerPubSub(id);
  throw redirect(`/status/${id}`);
};
