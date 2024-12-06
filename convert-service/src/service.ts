import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';
import express from 'express';
import yaml from 'js-yaml';
import fastFolderSize from 'fast-folder-size';
import { Storage } from '@google-cloud/storage';
import { convertPMCID2DOI, getDownloadMetadata, jatsFetch } from 'jats-fetch';
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
  respondUnableToProcess,
} from './utils.js';

const PROJECT = 'curvenote-dev-1';
const BUCKET = 'pmc-jats-curvenote-dev-1';
const FOLDER = 'convert-service-test-1';

const LISTING = '/usr/app/listing.csv';
const TEMPLATE = '/usr/app/theme';

// Time steps for logging, based on some averages
const TS0 = 2; // start
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

    const { body } = req;
    if (!req.body) return respondBadRequest(res, 'no Pub/Sub message received');

    const { message } = body;
    if (!message)
      return respondBadRequest(res, 'invalid Pub/Sub message format');
    const { attributes } = message;

    const { id } = (attributes ?? {}) as { id?: string };
    if (!id) return respondBadRequest(res, 'no ID in Pub/Sub message');

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
      if (!id.match(/^PMC[0-9]+$/)) {
        await logStatus(bucket, prefix, 'failure', {
          message: `${id}: Invalid PMC ID`,
          error: 'invalid',
        });
        return respondUnableToProcess(res, id);
      }
      await logStatus(bucket, prefix, 'processing', {
        message: `${id}: Validating PMC ID`,
        progress: 0 / TS5,
      });
      const start = Date.now() / 1000;
      const session = new Session({
        logger: basicLogger(LogLevel.debug),
      });
      let gzurl: string;
      let citation: string | undefined;
      let license: string | undefined;
      try {
        const metadata = await getDownloadMetadata(id);
        gzurl = metadata.url;
        citation = metadata.citation;
        license = metadata.license;
      } catch {
        const doi = await convertPMCID2DOI(session, id);
        if (doi) {
          await logStatus(bucket, prefix, 'failure', {
            message: `${id}: PMC ID is not open access`,
            error: 'non-oa',
            doi,
          });
        } else {
          await logStatus(bucket, prefix, 'failure', {
            message: `${id}: PMC ID cannot be found`,
            error: 'non-pmc',
          });
        }
        return respondUnableToProcess(res, id);
      }
      if (!license || !['CC BY', 'CC0'].includes(license)) {
        const doi = await convertPMCID2DOI(session, id);
        await logStatus(bucket, prefix, 'failure', {
          message: `${id}: PMC article must be CC-BY or CC0 (License: ${license ?? 'None'})`,
          error: 'non-cc',
          doi,
          citation,
          license,
        });
        return respondUnableToProcess(res, id);
      }
      await logStatus(bucket, prefix, 'processing', {
        message: `${id}: Downloading data`,
        progress: TS0 / TS5,
        citation,
        license,
      });
      cwd = process.cwd();
      tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'jats'));
      removeFolder(tmpFolder);
      fs.mkdirSync(tmpFolder, { recursive: true });
      process.chdir(tmpFolder);
      console.info(`Working in temp folder: ${tmpFolder}`);
      const jatsFile = `${id}.xml`;
      await jatsFetch(session, gzurl, {
        output: jatsFile,
        data: true,
      });
      await logStatus(bucket, prefix, 'processing', {
        message: `${id}: Converting data for Curvenote`,
        progress: TS1 / TS5,
        citation,
        license,
      });
      const downloadDone = Date.now() / 1000;
      await jatsConvert(session, jatsFile, {
        frontmatter: 'project',
        dois: false,
        bibtex: true,
      });
      await logStatus(bucket, prefix, 'processing', {
        message: `${id}: Building Curvenote site`,
        progress: TS2 / TS5,
        citation,
        license,
      });
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
      await logStatus(bucket, prefix, 'processing', {
        message: `${id}: Saving data`,
        progress: TS3 / TS5,
        citation,
        license,
      });
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
      await logStatus(bucket, prefix, 'processing', {
        message: `${id}: Finalizing processing`,
        progress: TS4 / TS5,
        citation,
        license,
      });
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
      await logStatus(bucket, prefix, 'success', {
        message: `${id}: Processing Complete`,
        progress: 1,
        citation,
        license,
      });
      return res.sendStatus(204);
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
