import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';
import express from 'express';
import yaml from 'js-yaml';
import fastFolderSize from 'fast-folder-size';
import { Storage } from '@google-cloud/storage';
import { jatsFetch } from 'jats-fetch';
import { jatsConvert } from 'jats-convert';
import { build, init, Session } from 'myst-cli';
import { basicLogger, LogLevel } from 'myst-cli-utils';
import { ProjectConfig, SiteConfig } from 'myst-config';
import { Download } from 'myst-frontmatter';
import {
  getFiles,
  logStatus,
  removeFolder,
  respondBadRequest,
} from './utils.js';

const PROJECT = 'curvenote-dev-1';
const BUCKET = 'pmc-jats-curvenote-dev-1';
const FOLDER = 'convert-service-test-0';

const LISTING = '/usr/app/listing.csv';
const TEMPLATE = '/usr/app/theme';

// Time steps for logging, based on some averages
const TS0 = 1; // start
const TS1 = TS0 + 6; // download done
const TS2 = TS1 + 2; // convert done
const TS3 = TS2 + 10; // build done
const TS4 = TS3 + 4; // upload done
const TS5 = TS4 + 1; // done

export function createService() {
  const app = express();
  app.use(express.json());

  app.post('/', async (req, res) => {
    console.info('Container configuration');
    console.info('PROJECT', PROJECT);
    console.info('BUCKET', BUCKET);
    console.info('FOLDER', FOLDER);

    // accept message & validate
    const { body } = req;
    if (!req.body) return respondBadRequest(res, 'no Pub/Sub message received');

    const { message } = body;
    if (!message)
      return respondBadRequest(res, 'invalid Pub/Sub message format');
    const { attributes } = message;

    const { id } = attributes ?? {};
    if (!id) return respondBadRequest(res, 'no ID in Pub/Sub message');

    const storage = new Storage();
    const bucket = storage.bucket(BUCKET);
    const prefix = `${FOLDER}/${id}/`;
    const [files] = await bucket.getFiles({ prefix });
    if (files.length > 0) {
      console.info(`ID already processed: ${id}`);
      return res.status(204).send(`ID already processed: ${id}`);
    }
    await logStatus(
      bucket,
      prefix,
      'processing',
      `${id}: Downloading data`,
      TS0 / TS5
    );
    let tmpFolder: string | undefined;
    let cwd: string | undefined;
    try {
      cwd = process.cwd();
      tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'jats'));
      removeFolder(tmpFolder);
      fs.mkdirSync(tmpFolder, { recursive: true });
      process.chdir(tmpFolder);
      console.info(`Working in temp folder: ${tmpFolder}`);
      const start = Date.now() / 1000;
      const session = new Session({
        logger: basicLogger(LogLevel.debug),
      });
      const jatsFile = `${id}.xml`;
      await jatsFetch(session, id, {
        output: jatsFile,
        data: true,
        listing: LISTING,
      });
      await logStatus(
        bucket,
        prefix,
        'processing',
        `${id}: Converting data for Curvenote`,
        TS1 / TS5
      );
      const downloadDone = Date.now() / 1000;
      await jatsConvert(session, jatsFile, {
        frontmatter: 'project',
        dois: false,
        bibtex: true,
      });
      await logStatus(
        bucket,
        prefix,
        'processing',
        `${id}: Building Curvenote site`,
        TS2 / TS5
      );
      await init(session, { project: true, site: true });
      const mystFile = 'myst.yml';
      const mystYml = yaml.load(fs.readFileSync(mystFile).toString()) as {
        project: ProjectConfig;
        site: SiteConfig;
      };
      const pdfs = fs
        .readdirSync('.')
        .filter((file) => path.extname(file).toLowerCase() === '.pdf');
      const filename = pdfs.length === 1 ? `${id}.pdf` : undefined;
      mystYml.project.downloads = [
        ...(mystYml.project.downloads ?? []),
        ...pdfs.map((file): Download => {
          return { url: file, filename };
        }),
      ];
      mystYml.site.template = TEMPLATE;
      fs.writeFileSync(mystFile, yaml.dump(mystYml));
      await session.reload();
      await build(session, [], { site: true });
      const processDone = Date.now() / 1000;
      await logStatus(
        bucket,
        prefix,
        'processing',
        `${id}: Saving data`,
        TS3 / TS5
      );
      for await (const filePath of getFiles('_build/site')) {
        try {
          const destination = `${prefix}${path.relative(
            '_build/site',
            filePath
          )}`;
          await bucket.upload(filePath, { destination });
        } catch {}
      }
      await bucket.upload(`${id}.xml`, {
        destination: `${prefix}content/${id}.xml`,
      });
      await logStatus(
        bucket,
        prefix,
        'processing',
        `${id}: Finalizing processing`,
        TS4 / TS5
      );
      const uploadDone = Date.now() / 1000;
      const logFile = `${id}.log.yml`;
      const logData = yaml.load(fs.readFileSync(logFile).toString()) as Record<
        string,
        any
      >;
      logData.date = new Date(Date.now()).toUTCString();
      logData.times = {
        download: downloadDone - start,
        process: processDone - downloadDone,
        upload: uploadDone - processDone,
      };
      const buildSize = await util.promisify(fastFolderSize)(`_build/`);
      logData.sizes = {
        archive: fs.lstatSync(`${id}.tar.gz`).size,
        build: buildSize,
      };
      fs.writeFileSync(logFile, yaml.dump(logData));
      await bucket.upload(logFile, { destination: `${prefix}${logFile}` });
      process.chdir(cwd);
      removeFolder(tmpFolder);
      await logStatus(
        bucket,
        prefix,
        'success',
        `${id}: Processing Complete`,
        1
      );
      return res.sendStatus(204);
    } catch (err: any) {
      try {
        await logStatus(bucket, prefix, 'failure', `Unable to process ${id}`);
      } catch {
        // Carry on if logging the failure errors.
      }
      console.error(err);
      console.error(`JATS convert job failed for ID: ${id}`);
      if (cwd) process.chdir(cwd);
      removeFolder(tmpFolder);
      return res.status(204).send(`Unable to process ${id}`);
    }
  });

  return app;
}
