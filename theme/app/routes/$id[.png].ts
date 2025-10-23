import { type LoaderFunction } from '@remix-run/node';
import { getConfig, getPage } from '~/utils/loaders.server';
import { NotFoundError } from '../utils/errors';

const OG_API = 'https://og.curvenote.com/';

export const loader: LoaderFunction = async ({ request, params }) => {
  const id = params.id?.toUpperCase();
  if (!id || !id.match(/^PMC[0-9]*$/)) throw NotFoundError();
  const [config, article] = await Promise.all([getConfig(id), getPage(request, id, {})]);
  if (!config || !article) throw NotFoundError();
  const title = `${config?.projects?.[0].title}`;
  const authors = config?.projects?.[0].authors;
  const date = config?.projects?.[0].date;
  const thumbnail = article?.frontmatter.thumbnail ?? undefined;
  console.log(thumbnail);
  const url = new URL(`${OG_API}api/journal`);
  const pmcLogo = 'https://upload.wikimedia.org/wikipedia/commons/f/fb/US-NLM-PubMed-Logo.svg';
  url.searchParams.set('logo', pmcLogo);
  url.searchParams.set('title', title.replace(/<\/?[a-zA-Z0-9-]+>/g, ''));
  if (authors && authors.length) {
    url.searchParams.set('authors', authors.map((a) => a.name).join(', '));
  }
  url.searchParams.set('subject', id);
  url.searchParams.set('theme', '#542D59');

  if (thumbnail) url.searchParams.set('image', thumbnail);
  const dateString = (date ? new Date(date) : new Date()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  url.searchParams.set('date', dateString);
  // 'https://og-pearl.vercel.app/api/physiome?title=Bond%20Graph%20Model%20of%20Cerebral%20Circulation%3A%20Toward%20Clinically%20Feasible%20Systemic%20Blood%20Flow%20Simulations&date=August%2021%2C%202020&image=https%3A%2F%2Fphysiome.curve.space%2Fstatic%2Fthumbnails%2FS000001.png&authors=Shan%20Su%2C%20Pablo%20J.%20Blanco%2C%20Lucas%20O.%20M%C3%BCller%2C%20Peter%20J.%20Hunter%2C%20Soroush%20Safaei&subject=Original%20Submission',
  const ogUrl = url.toString();
  const resp = await fetch(ogUrl);

  return new Response(await resp.arrayBuffer(), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'max-age=86400',
    },
  });
};
