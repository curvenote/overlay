import type { SiteManifest } from 'myst-config';
import * as cdn from '@curvenote/cdn';
import { type Host } from '@curvenote/common';
import { getDomainFromRequest } from '@myst-theme/site';

const CDN = 'https://storage.googleapis.com/pmc-jats-curvenote-dev-1/2024.11.15/';

function getHostname(id: string): Host {
  return { cdn: CDN, key: id };
}

export function isFlatSite(config?: SiteManifest): boolean {
  return config?.projects?.length === 1 && !config.projects[0].slug;
}

export const getConfig = async (id: string) => {
  return cdn.getConfig(getHostname(id));
};
export const getMystXrefJson = async (id: string) => {
  return cdn.getMystXrefJson(getHostname(id));
};
export const getMystSearchJson = async (id: string) => {
  return cdn.getMystSearchJson(getHostname(id));
};

export const getPage = async (
  request: Request,
  id: string,
  opts: Parameters<typeof cdn.getPage>[1],
) =>
  cdn.getPage(getHostname(id), {
    ...opts,
    domain: getDomainFromRequest(request),
  });

export const getObjectsInv = async (id: string) => cdn.getObjectsInv(getHostname(id));
