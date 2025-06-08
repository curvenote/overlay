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
export async function processPMC(
  id: string,
  bucket: Bucket,
  prefix: string,
  res: Response
) {
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
  // tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'jats'));
  // removeFolder(tmpFolder);
  // fs.mkdirSync(tmpFolder, { recursive: true });
  // process.chdir(tmpFolder);
  // console.info(`Working in temp folder: ${tmpFolder}`);
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
      const destination = `${prefix}${path.relative('_build/site', filePath)}`;
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
  await logStatus(bucket, prefix, 'success', {
    message: `${id}: Processing Complete`,
    progress: 1,
    citation,
    license,
  });
  return res.sendStatus(204);
}
