import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import { Storage } from '@google-cloud/storage';
import {
  logStatus,
  removeFolder,
  respondBadRequest,
  respondUnableToProcess,
} from './utils.js';
import { processTarget } from './process.js';

const PROJECT = 'curvenote-dev-1';
const BUCKET = 'pmc-jats-curvenote-dev-1';
const FOLDER = 'convert-service-test-3';

export function createService() {
  const app = express();
  app.use(express.json());

  app.post('/', async (req, res) => {
    console.info('Container configuration');
    console.info('PROJECT', PROJECT);
    console.info('BUCKET', BUCKET);
    console.info('FOLDER', FOLDER);

    const { body } = req;
    if (!req.body) return respondBadRequest(res, 'no Pub/Sub message received');

    const { message } = body;
    if (!message)
      return respondBadRequest(res, 'invalid Pub/Sub message format');
    const { attributes } = message;

    // target: input passed to jats fetch
    // id:     storage key associated with target (for PMC and DOI, id matches target)
    const { target } = (attributes ?? {}) as { target?: string; id?: string };
    if (!target) return respondBadRequest(res, 'no target in Pub/Sub message');
    const id = attributes?.id ?? target;

    const storage = new Storage();
    const bucket = storage.bucket(BUCKET);
    const prefix = `${FOLDER}/${id}/`;
    const [files] = await bucket.getFiles({ prefix });
    if (files.length > 0) {
      console.info(`ID already processed: ${id}`);
      return res.status(204).send(`ID already processed: ${id}`);
    }
    let tmpFolder: string | undefined;
    let cwd: string | undefined;
    try {
      cwd = process.cwd();
      tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'jats'));
      removeFolder(tmpFolder);
      fs.mkdirSync(tmpFolder, { recursive: true });
      process.chdir(tmpFolder);
      console.info(`Working in temp folder: ${tmpFolder}`);
      await processTarget(target, id, bucket, prefix, res);
      process.chdir(cwd);
      removeFolder(tmpFolder);
      return res;
    } catch (err: any) {
      try {
        await logStatus(bucket, prefix, 'failure', {
          message: `Unable to process ${id}`,
        });
      } catch {
        // Carry on if logging the failure errors.
      }
      console.error(err);
      console.error(`JATS convert job failed for ID: ${id}`);
      if (cwd) process.chdir(cwd);
      removeFolder(tmpFolder);
      return respondUnableToProcess(res, id);
    }
  });

  return app;
}
