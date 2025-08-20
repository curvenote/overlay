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
import { convertPMCID2DOI, getDownloadMetadata, jatsFetch } from 'jats-fetch';
import { jatsConvert } from 'jats-convert';
import { ProjectConfig, SiteConfig } from 'myst-config';
import { Download } from 'myst-frontmatter';
import fastFolderSize from 'fast-folder-size';

/**
 * PMC-specific processing
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
  let citation: string | undefined;
  let license: string | undefined;
  if (target.match(/^PMC[0-9]+$/)) {
    await logStatus(bucket, prefix, 'processing', {
      message: `${target}: Validating PMC ID`,
      progress: 0 / TS5,
    });
    try {
      const metadata = await getDownloadMetadata(id);
      citation = metadata.citation;
      license = metadata.license;
    } catch {
      const doi = await convertPMCID2DOI(session, id);
      if (doi) {
        await logStatus(bucket, prefix, 'failure', {
          message: `${target}: PMC ID is not open access`,
          error: 'non-oa',
          doi,
        });
      } else {
        await logStatus(bucket, prefix, 'failure', {
          message: `${target}: PMC ID cannot be found`,
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
  }
  await logStatus(bucket, prefix, 'processing', {
    message: `${target}: Downloading data`,
    progress: TS0 / TS5,
    target,
    citation,
    license,
  });
  const jatsFile = `${id.replace('/', '.')}.xml`;
  await jatsFetch(session, target, {
    output: jatsFile,
    data: true,
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
    message: `${target}: Building Curvenote site`,
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
    message: `${target}: Saving data`,
    progress: TS3 / TS5,
    target,
    citation,
    license,
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
    citation,
    license,
  });
  const uploadDone = Date.now() / 1000;
  const logFile = `${id.replace('/', '.')}.log.yml`;
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
  const archiveFile = fs
    .readdirSync('.')
    .find(
      (file) =>
        file.toLowerCase().endsWith('.tar.gz') ||
        file.toLowerCase().endsWith('.meca')
    );
  const archive = archiveFile ? fs.lstatSync(archiveFile).size : undefined;
  logData.sizes = {
    archive,
    build: buildSize,
  };
  fs.writeFileSync(logFile, yaml.dump(logData));
  await bucket.upload(logFile, { destination: `${prefix}${logFile}` });
  await logStatus(bucket, prefix, 'success', {
    message: `${target}: Processing Complete`,
    progress: 1,
    target,
    citation,
    license,
  });
  return res.sendStatus(204);
}
