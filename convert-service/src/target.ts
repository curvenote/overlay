import fs from 'fs';
import path from 'path';
import util from 'util';
import yaml from 'js-yaml';
import { Response } from 'express';
import {
  getFiles,
  logStatus,
  respondUnableToProcess,
  TEMPLATE,
  TS0,
  TS1,
  TS2,
  TS3,
  TS4,
  TS5,
} from './utils.js';
import { Bucket } from '@google-cloud/storage';
import { build, init, Session } from 'myst-cli';
import { basicLogger, LogLevel } from 'myst-cli-utils';
import { jatsFetch } from 'jats-fetch';
import { jatsConvert } from 'jats-convert';
import { ProjectConfig, SiteConfig } from 'myst-config';
import fastFolderSize from 'fast-folder-size';

/**
 * Generic target processing
 */
export async function processTarget(
  target: string,
  id: string,
  bucket: Bucket,
  prefix: string,
  res: Response
) {
  const start = Date.now() / 1000;
  const session = new Session({
    logger: basicLogger(LogLevel.debug),
  });
  // License check would need to come from JATS body after fetching
  await logStatus(bucket, prefix, 'processing', {
    message: `${target}: Attempting to download JATS data`,
    progress: TS0 / TS5,
    target,
  });
  const jatsFile = `${id}.xml`;
  await jatsFetch(session, target, {
    output: jatsFile,
  });
  if (!fs.existsSync(jatsFile)) {
    await logStatus(bucket, prefix, 'failure', {
      message: `${target}: Unable to download JATS data`,
      error: 'invalid',
      target,
    });
    return respondUnableToProcess(res, id);
  }
  await logStatus(bucket, prefix, 'processing', {
    message: `${target}: Converting data for Curvenote`,
    progress: TS1 / TS5,
    target,
  });
  const downloadDone = Date.now() / 1000;
  await jatsConvert(session, jatsFile, {
    frontmatter: 'project',
    dois: false,
    bibtex: true,
  });
  await logStatus(bucket, prefix, 'processing', {
    message: `${target}: Building Curvenote site`,
    progress: TS2 / TS5,
    target,
  });
  await init(session, { project: true, site: true });
  const mystFile = 'myst.yml';
  const mystYml = yaml.load(fs.readFileSync(mystFile).toString()) as {
    project: ProjectConfig;
    site: SiteConfig;
  };
  // Downloads would need to come from JATS body directly
  mystYml.site.template = TEMPLATE;
  fs.writeFileSync(mystFile, yaml.dump(mystYml));
  await session.reload();
  await build(session, [], { site: true });
  const processDone = Date.now() / 1000;
  await logStatus(bucket, prefix, 'processing', {
    message: `${target}: Saving data`,
    progress: TS3 / TS5,
    target,
  });
  for await (const filePath of getFiles('_build/site')) {
    try {
      const destination = `${prefix}${path.relative('_build/site', filePath)}`;
      await bucket.upload(filePath, { destination });
    } catch {}
  }
  await bucket.upload(`${id}.xml`, {
    destination: `${prefix}content/${id}.xml`,
  });
  await logStatus(bucket, prefix, 'processing', {
    message: `${target}: Finalizing processing`,
    progress: TS4 / TS5,
    target,
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
    build: buildSize,
  };
  fs.writeFileSync(logFile, yaml.dump(logData));
  await bucket.upload(logFile, { destination: `${prefix}${logFile}` });
  await logStatus(bucket, prefix, 'success', {
    message: `${target}: Processing Complete`,
    progress: 1,
    target,
  });
  return res.sendStatus(204);
}
