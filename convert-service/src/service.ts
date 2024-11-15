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
import { ProjectConfig, SiteConfig } from 'myst-config';
import { Download } from 'myst-frontmatter';
import { getFiles, removeTempFolder, respondBadRequest } from './utils.js';

const PROJECT = 'curvenote-dev-1';
const BUCKET = 'pmc-jats-curvenote-dev-1';
const FOLDER = 'convert-service-test-1';

const LISTING = '/usr/app/listing.csv';
const TEMPLATE = '/usr/app/theme';

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
    const prefix = `${FOLDER}/${id}`;
    const [files] = await bucket.getFiles({ prefix });
    if (files.length > 0) {
      return res.status(204).send(`ID already processed: ${id}`);
    }
    // Log downloading
    let tmpFolder: string | undefined;
    let cwd: string | undefined;
    try {
      cwd = process.cwd();
      tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'jats'));
      if (fs.existsSync(tmpFolder)) fs.rmSync(tmpFolder, { recursive: true });
      fs.mkdirSync(tmpFolder, { recursive: true });
      console.info(`Made temp folder at: ${tmpFolder}`);
      process.chdir(tmpFolder);
      const start = Date.now() / 1000;
      const session = new Session();
      const jatsFile = `${tmpFolder}/${id}.xml`;
      await jatsFetch(session, id, {
        output: jatsFile,
        data: true,
        listing: LISTING,
      });
      // Log converting
      const downloadDone = Date.now() / 1000;
      await jatsConvert(jatsFile, {
        frontmatter: 'project',
        dois: false,
        bibtex: true,
      });
      // Log building
      await init(session, { project: true, site: true });
      const mystFile = 'myst.yml';
      const mystYml = yaml.load(fs.readFileSync(mystFile).toString()) as {
        project: ProjectConfig;
        site: SiteConfig;
      };
      const pdfs = fs
        .readdirSync('.')
        .filter((file) => path.extname(file).toLowerCase() === '.pdf');
      mystYml.project.downloads = [
        ...(mystYml.project.downloads ?? []),
        ...pdfs.map((file): Download => {
          return { url: file };
        }),
      ];
      mystYml.site.template = TEMPLATE;
      fs.writeFileSync(mystFile, yaml.dump(mystYml));
      await build(session, [], { site: true });
      const processDone = Date.now() / 1000;
      // Log saving
      for await (const filePath of getFiles('_build/site')) {
        try {
          const destination = `${prefix}/${path.relative(
            '_build/site',
            filePath
          )}`;
          await bucket.upload(filePath, { destination });
        } catch {}
      }
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
        archive: fs.lstatSync(`${id}.tar.gz`),
        build: buildSize,
      };
      fs.writeFileSync(logFile, yaml.dump(logData));
      await bucket.upload(logFile, { destination: `${prefix}/${logFile}` });
      process.chdir(cwd);
      removeTempFolder(tmpFolder);
      // Log success
      return res.sendStatus(204);
    } catch (err: any) {
      // Log failure
      console.error(err, `JATS convert job failed for ID: ${id}`);
      if (cwd) process.chdir(cwd);
      if (tmpFolder) removeTempFolder(tmpFolder);
      return res.status(204).send(err.message);
    }
  });

  return app;
}
