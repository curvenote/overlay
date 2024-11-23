import { PubSub } from '@google-cloud/pubsub';
import { Storage } from '@google-cloud/storage';
import type { SiteManifest } from 'myst-config';
import * as cdn from '@curvenote/cdn';
import { type Host } from '@curvenote/common';
import { getDomainFromRequest } from '@myst-theme/site';
import type { GoogleAuthOptions } from '@google-cloud/storage/build/cjs/src/nodejs-common';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';

const PROJECT = 'curvenote-dev-1';
const BUCKET = 'pmc-jats-curvenote-dev-1';
const FOLDER = 'convert-service-test-0';
const TOPIC = 'pmcJatsConvertTopic';

const CDN = `https://storage.googleapis.com/${BUCKET}/${FOLDER}/`;

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

export async function getJatsXml(id: string): Promise<string | null> {
  const host = getHostname(id);
  const baseUrl = await cdn.getCdnBaseUrl(host);
  if (!baseUrl) return null;
  const url = `${baseUrl}content/${id}.xml`;
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);
  const jatsXml = await response.text();
  return jatsXml;
}

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

export const getFolders = async () => {
  try {
    const storage = new Storage();
    const bucket = storage.bucket(BUCKET);
    const [files] = await bucket.getFiles({ matchGlob: `${FOLDER}/*/*.log.yml`, maxResults: 50 });
    return files.map((file) => file.name.split('/').slice(-2)[0]);
  } catch {
    return [];
  }
};

export const getProcessingStatus = async (
  id: string,
): Promise<{
  timestamp?: number;
  status?: 'none' | 'processing' | 'success' | 'failure';
  message?: string;
  progress?: number;
}> => {
  try {
    const storage = new Storage();
    const file = storage.bucket(BUCKET).file(`${FOLDER}/${id}/status.json`);
    const exists = await file.exists();
    if (exists) {
      const contents = await file.download();
      const result = JSON.parse(contents.toString()) as {
        timestamp?: number;
        status?: 'processing' | 'success' | 'failure';
        message?: string;
        progress?: number;
      };
      return result;
    }
  } catch {
    // Error - still no status
  }
  return {
    status: 'none',
    timestamp: Date.now(),
    message: 'Processing has not started',
    progress: 0,
  };
};

export const triggerPubSub = async (id: string) => {
  let credentials: GoogleAuthOptions['credentials'] | undefined;
  console.log('client_email', process.env.CLIENT_EMAIL);
  if (process.env.CLIENT_EMAIL && process.env.PRIVATE_KEY) {
    credentials = {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY,
    };
  }
  const pubsub = new PubSub({
    projectId: PROJECT,
    credentials,
  });
  const topic = pubsub.topic(TOPIC);
  console.log(`triggering pubsub: ${id}`);
  await topic.publishMessage({ attributes: { id } });
};
