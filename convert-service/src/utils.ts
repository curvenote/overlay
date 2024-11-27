import util from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Response } from 'express';
import { Bucket } from '@google-cloud/storage';

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
  };
  await bucket.file(logFile).save(JSON.stringify(logEntry));
}
