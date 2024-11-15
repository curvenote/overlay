import util from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Response } from 'express';
import { Bucket } from '@google-cloud/storage';

export function respondBadRequest(res: Response, msg: string) {
  console.error(`error: ${msg}`);
  return res.status(400).send(`Bad Request: ${msg}`);
}

export function removeTempFolder(tempFolder: string) {
  if (tempFolder && fs.existsSync(tempFolder)) {
    fs.rmSync(tempFolder, { recursive: true });
  }
}

export function createTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'export'));
}

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

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
  message?: string
) {
  const logFile = `${prefix}/status.json`;
  const logEntry = { timestamp: +Date.now(), status, message };
  await bucket.file(logFile).save(JSON.stringify(logEntry));
}
