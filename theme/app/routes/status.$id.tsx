import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate, useParams, useRevalidator } from '@remix-run/react';
import { useEffect, useState } from 'react';
import ProgressScreen from '~/components/ProgressScreen';
import { NotFoundError } from '~/utils/errors';
import { getProcessingStatus } from '~/utils/loaders.server';
import useInterval from '~/utils/useInterval';

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) throw NotFoundError();
  const status = await getProcessingStatus(id);
  // If processing was successful and the result is old, redirect immediately
  if (status.status === 'success' && Date.now() - (status.timestamp ?? 0) > 2000) {
    throw redirect(`/${id}`);
  }
  return json(status);
};

function useLivePageData(activate: boolean, delay: number) {
  const revalidator = useRevalidator();
  const interval = useInterval(
    () => {
      if (revalidator.state === 'idle') {
        revalidator.revalidate();
      }
    },
    delay,
    activate,
  );
  return interval;
}

export default function Page() {
  const data = useLoaderData() as Awaited<ReturnType<typeof getProcessingStatus>>;
  const { status, timestamp } = data;
  const navigate = useNavigate();
  const { id } = useParams();
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === 'success') {
      setTimeout(() => {
        navigate({ pathname: `/${id}` }, { replace: true });
      }, 300);
    }
    if (status === 'none') {
      setCount((c) => c + 1);
    }
  }, [status, timestamp]);
  useEffect(() => {
    if (count >= 40) {
      setError('Failed to start');
    }
  }, [count]);
  useLivePageData(status !== 'failure' && status !== 'success' && !error, 500);
  let message = data.message ?? '';
  const progress = data.progress ?? 0;
  if (status === 'success') {
    message = `Processing ${id} complete! Redirecting to article...`;
  }
  return (
    <ProgressScreen
      status={status}
      message={message}
      doi={data.doi}
      citation={data.citation}
      progress={progress}
    />
  );
}
