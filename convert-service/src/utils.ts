import util from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Response } from 'express';
import { Bucket } from '@google-cloud/storage';

// Time steps for logging, based on some averages
export const TS0 = 2; // start
export const TS1 = TS0 + 6; // download done
export const TS2 = TS1 + 2; // convert done
export const TS3 = TS2 + 10; // build done
export const TS4 = TS3 + 4; // upload done
export const TS5 = TS4 + 1; // done

export const TEMPLATE = '/usr/app/theme';

export function respondBadRequest(res: Response, msg: string) {
  console.error(`error: ${msg}`);
  return res.status(204).send(`Bad Request: ${msg}`);
}

export function respondUnableToProcess(res: Response, id: string) {
  return res.status(204).send(`Unable to process ${id}`);
}

export function removeFolder(folder?: string) {
  if (folder && fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true });
  }
}

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

/**
 * From google cloud docs for uploading a directory to a bucket
 */
export async function* getFiles(directory = '.'): AsyncGenerator<string> {
  for (const file of await readdir(directory)) {
    const fullPath = path.join(directory, file);
    const stats = await stat(fullPath);
    if (stats.isDirectory()) {
      yield* getFiles(fullPath);
    }
    if (stats.isFile()) {
      yield fullPath;
    }
  }
}

/**
 * Write log file to cloud storage
 *
 * This updates in place and only contains the current status.
 * We could use a webhook to send these updates directly back to the client.
 */
export async function logStatus(
  bucket: Bucket,
  prefix: string,
  status: 'processing' | 'success' | 'failure',
  opts?: {
    message?: string;
    progress?: number;
    error?: 'invalid' | 'non-pmc' | 'non-oa' | 'non-cc';
    doi?: string;
    citation?: string;
    license?: string;
    target?: string;
  }
) {
  if (opts?.message) console.info(opts?.message);
  const logFile = `${prefix}status.json`;
  const logEntry = {
    timestamp: +Date.now(),
    status,
    message: opts?.message,
    progress: opts?.progress,
    error: opts?.error,
    doi: opts?.doi,
    citation: opts?.citation,
    license: opts?.license,
    target: opts?.target,
  };
  await bucket.file(logFile).save(JSON.stringify(logEntry));
}
