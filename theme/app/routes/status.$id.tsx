import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useParams, useRevalidator } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { NotFoundError } from '~/utils/errors';
import { getProcessingStatus } from '~/utils/loaders.server';
import ProgressScreen from '~/utils/progress';
import useInterval from '~/utils/useInterval';

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;
  if (!id) throw NotFoundError();
  const status = await getProcessingStatus(id);
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
        navigate({ pathname: `/${id}` });
      }, 2000);
    }
    if (status === 'none') {
      setCount((c) => c + 1);
    }
  }, [status, timestamp]);
  useEffect(() => {
    if (count >= 20) {
      setError('Failed to start');
    }
  }, [count]);
  useLivePageData(status !== 'failure' && status !== 'success' && !error, 1000);
  let color = '#4caf50';
  let message = data.message ?? '';
  let progress = data.progress ?? 0;
  if (error) {
    message = error;
  }
  if (status === 'failure') {
    color = '#FF0000';
    progress = 1;
  }
  if (status === 'success') {
    message = `Processing ${id} complete! Redirecting to article...`;
  }
  return <ProgressScreen message={message} progress={progress} color={color} />;
}
