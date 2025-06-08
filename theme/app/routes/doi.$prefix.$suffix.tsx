import {
  redirect,
  type LinksFunction,
  type LoaderFunction,
  type V2_MetaFunction,
} from '@remix-run/node';
import { type PageLoader } from '@myst-theme/common';
import {
  getMetaTagsForArticle,
  KatexCSS,
  useOutlineHeight,
  DocumentOutline,
  ErrorDocumentNotFound,
  ErrorUnhandled,
} from '@myst-theme/site';
import {
  getConfig,
  getPage,
  getProcessingStatus,
  prefixSuffixToId,
  triggerPubSub,
} from '~/utils/loaders.server';
import { isRouteErrorResponse, useLoaderData, useRouteError } from '@remix-run/react';
import type { SiteManifest } from 'myst-config';
import { useSiteManifest, ProjectProvider, SiteProvider } from '@myst-theme/providers';
import { ArticlePage } from '~/components/ArticlePage';
import { NotFoundError } from '~/utils/errors';
import GitHubIssueButton from '~/components/GitHubIssueButton';
import { ArticlePageAndNavigation } from './($id)';

type LoaderData = { config: SiteManifest; article: PageLoader; id: string };

export const meta: V2_MetaFunction = (args) => {
  const { config, article } = (args?.data as LoaderData) ?? {};
  if (!config || !article || !article.frontmatter) return [];
  return getMetaTagsForArticle({
    origin: '',
    url: args.location.pathname,
    title: `${config?.projects?.[0].title}`,
    description: article.frontmatter.description,
    image: (article.frontmatter.thumbnailOptimized || article.frontmatter.thumbnail) ?? undefined,
  });
};

export const links: LinksFunction = () => [KatexCSS];

export const loader: LoaderFunction = async ({ params, request }) => {
  const { prefix, suffix } = params;
  if (!prefix || !suffix) throw NotFoundError();
  const id = prefixSuffixToId(prefix, suffix);
  try {
    const config = await getConfig(id);
    const article = await getPage(request, id, {});
    if (article) {
      article.frontmatter.identifiers ??= {};
      article.frontmatter.identifiers.doi = id;
    }
    return { config, article, id };
  } catch (error) {
    const { status } = await getProcessingStatus(id);
    if (status === 'none') await triggerPubSub(id);
    throw redirect(`/status/doi/${id}`);
  }
};

interface ThemeTemplateOptions {
  hide_toc?: boolean;
  hide_outline?: boolean;
  hide_footer_links?: boolean;
}

export default function Page() {
  const { container, outline } = useOutlineHeight();
  const { config, article, id } = useLoaderData() as LoaderData;
  const pageDesign: ThemeTemplateOptions =
    (article.frontmatter as any)?.site ?? (article.frontmatter as any)?.design ?? {};
  const siteDesign: ThemeTemplateOptions =
    (useSiteManifest() as SiteManifest & ThemeTemplateOptions) ?? {};
  const { hide_toc, hide_outline, hide_footer_links } = {
    ...siteDesign,
    ...pageDesign,
  };
  return (
    <ArticlePageAndNavigation hide_toc={hide_toc} hideSearch>
      <SiteProvider config={config}>
        <ProjectProvider project={config.projects?.[0]}>
          <main ref={container} className="article-left-grid subgrid-gap col-screen">
            <GitHubIssueButton id={id} />
            {!hide_outline && (
              <div
                className="sticky z-10 hidden h-0 col-margin-right-inset lg:block"
                style={{ top: 0 }}
              >
                <DocumentOutline
                  className="relative pt-5 ml-6 max-w-[350px]"
                  outlineRef={outline}
                  isMargin={false}
                />
              </div>
            )}
            <ArticlePage article={article} hide_all_footer_links={hide_footer_links} />
          </main>
        </ProjectProvider>
      </SiteProvider>
    </ArticlePageAndNavigation>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <ArticlePageAndNavigation>
      <main className="article-content">
        <main className="article">
          {isRouteErrorResponse(error) ? (
            <ErrorDocumentNotFound />
          ) : (
            <ErrorUnhandled error={error as any} />
          )}
        </main>
      </main>
    </ArticlePageAndNavigation>
  );
}
