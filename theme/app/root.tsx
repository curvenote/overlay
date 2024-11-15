import type { LinksFunction, LoaderFunction, V2_MetaFunction } from '@remix-run/node';
import tailwind from '~/styles/app.css';
import type { SiteLoader } from '@myst-theme/common';
import { Document, getMetaTagsForSite, getThemeSession } from '@myst-theme/site';
import { ErrorSiteExpired } from './components/ErrorSiteExpired';
import { ErrorSiteNotFound } from './components/ErrorSiteNotFound';
import { Outlet, useCatch, useLoaderData } from '@remix-run/react';
import { Theme } from '@myst-theme/providers';
import thebeCoreCss from 'thebe-core/dist/lib/thebe-core.css';

export const meta: V2_MetaFunction = ({ data }) => {
  return getMetaTagsForSite({
    title: data?.config?.title,
    description: data?.config?.description,
    twitter: data?.config?.twitter,
  });
};

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: tailwind },
    { rel: 'stylesheet', href: thebeCoreCss },
    {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/jupyter-matplotlib@0.11.3/css/mpl_widget.css',
    },
    {
      rel: 'stylesheet',
      href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css',
    },
  ];
};

export const loader: LoaderFunction = async ({ request }): Promise<SiteLoader> => {
  const themeSession = await getThemeSession(request);
  const config = {} as any;
  const data = {
    theme: themeSession.getTheme(),
    config,
    CONTENT_CDN_PORT: process.env.CONTENT_CDN_PORT,
  };
  return data;
};

export function CatchBoundary() {
  const caught = useCatch();
  const isLaunchpad =
    typeof document === 'undefined' ? false : window.location.hostname.startsWith('launchpad-');

  return (
    <Document theme={Theme.light} title={caught.statusText}>
      <article className="content">
        <main className="error-content">
          {isLaunchpad && <ErrorSiteExpired />}
          {!isLaunchpad && <ErrorSiteNotFound />}
        </main>
      </article>
    </Document>
  );
}

function App() {
  const { theme, config } = useLoaderData<SiteLoader>();
  return (
    <Document theme={theme} config={config} top={0}>
      <Outlet />
    </Document>
  );
}

export default App;
