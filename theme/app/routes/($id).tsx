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
  useSidebarHeight,
  DocumentOutline,
  ErrorDocumentNotFound,
  ErrorUnhandled,
} from '@myst-theme/site';
import { getConfig, getPage, getProcessingStatus, triggerPubSub } from '~/utils/loaders.server';
import { isRouteErrorResponse, useLoaderData, useRouteError } from '@remix-run/react';
import type { SiteManifest } from 'myst-config';
import {
  TabStateProvider,
  UiStateProvider,
  useSiteManifest,
  useThemeTop,
  ProjectProvider,
  GridSystemProvider,
  SiteProvider,
} from '@myst-theme/providers';
import { ArticlePage } from '~/components/ArticlePage';
import { NotFoundError } from '~/utils/errors';
import GitHubIssueButton from '~/components/GitHubIssueButton';

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
  const { id } = params;
  if (!id) throw NotFoundError();
  try {
    const config = await getConfig(id);
    const article = await getPage(request, id, {});
    if (article && id.match(/^PMC[0-9]+$/)) {
      article.frontmatter.identifiers ??= {};
      article.frontmatter.identifiers.pmcid = id;
    }
    return { config, article, id };
  } catch (error) {
    const { status } = await getProcessingStatus(id);
    if (status === 'none') {
      // No processing has begun...
      if (id.match(/^PMC[0-9]+$/)) {
        // Trigger processing for PMC ids
        await triggerPubSub(id);
        throw redirect(`/status/${id}`);
      } else {
        // Do nothing for other unknown IDs
        throw NotFoundError();
      }
    } else {
      // If processing has begun, go to the status page
      throw redirect(`/status/${id}`);
    }
  }
};

export function ArticlePageAndNavigation({
  children,
  inset = 20, // begin text 20px from the top (aligned with menu)
}: {
  hide_toc?: boolean;
  hideSearch?: boolean;
  projectSlug?: string;
  children: React.ReactNode;
  inset?: number;
}) {
  const top = useThemeTop();
  const { container } = useSidebarHeight(top, inset);
  return (
    <UiStateProvider>
      <TabStateProvider>
        <GridSystemProvider gridSystem="article-left-grid">
          <article ref={container} className="article content article-left-grid grid-gap">
            {children}
          </article>
        </GridSystemProvider>
      </TabStateProvider>
    </UiStateProvider>
  );
}

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
                className="hidden sticky z-10 h-0 col-margin-right-inset lg:block"
                style={{ top: 0 }}
              >
                <DocumentOutline
                  className="relative pt-5 ml-6 max-w-[350px]"
                  outlineRef={outline}
                  isMargin={false}
                  maxdepth={1}
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
