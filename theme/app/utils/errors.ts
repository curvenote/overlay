import { ErrorStatus } from '@myst-theme/common';

export function NotFoundError() {
  return new Response(ErrorStatus.noSite, {
    status: 404,
    statusText: ErrorStatus.noSite,
  });
}
