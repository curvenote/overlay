import { ReferencesProvider, useProjectManifest } from '@myst-theme/providers';
import {
  Bibliography,
  ContentBlocks,
  FooterLinksBlock,
  FrontmatterParts,
  BackmatterParts,
  Footnotes,
  extractKnownParts,
} from '@myst-theme/site';
import type { PageLoader } from '@myst-theme/common';
import { Admonition, AdmonitionKind } from 'myst-to-react';
import { copyNode, type GenericParent } from 'myst-common';
import { FrontmatterBlock } from '@myst-theme/frontmatter';
import type { SiteAction } from 'myst-config';

/**
 * Combines the project downloads and the export options
 */
function combineDownloads(
  siteDownloads: SiteAction[] | undefined,
  pageFrontmatter: PageLoader['frontmatter'],
) {
  if (pageFrontmatter.downloads) {
    return pageFrontmatter.downloads;
  }
  // No downloads on the page, combine the exports if they exist
  if (siteDownloads) {
    return [...(pageFrontmatter.exports ?? []), ...siteDownloads];
  }
  return pageFrontmatter.exports;
}

export function ArticlePage({
  article,
  hide_all_footer_links,
  hideKeywords,
}: {
  article: PageLoader;
  hide_all_footer_links?: boolean;
  hideKeywords?: boolean;
}) {
  const manifest = useProjectManifest();

  const { hide_title_block, hide_footer_links } = (article.frontmatter as any)?.options ?? {};
  const downloads = combineDownloads(manifest?.downloads, article.frontmatter);
  const tree = copyNode(article.mdast);
  const keywords = article.frontmatter?.keywords ?? [];
  const parts = extractKnownParts(tree);

  return (
    <ReferencesProvider
      references={{ ...article.references, article: article.mdast }}
      frontmatter={article.frontmatter}
    >
      {!hide_title_block && (
        <FrontmatterBlock
          kind={article.kind}
          frontmatter={{ ...article.frontmatter, ...manifest, downloads }}
          className="mb-8 pt-9"
          authorStyle="list"
        />
      )}
      <Admonition
        title={<>Beta Rendering of PMC Open Access Article</>}
        kind={AdmonitionKind.warning}
        color="yellow"
        simple
        dropdown
      >
        <p>
          This is an experiment to create an overlay rendering of an open-access article. There may
          be errors in the content. We recommend looking at the original article at:
          <br />
          <ul>
            {article.frontmatter.identifiers?.pmcid && (
              <li>
                <a
                  href={`https://pmc.ncbi.nlm.nih.gov/articles/${article.frontmatter.identifiers?.pmcid}`}
                  target="_blank"
                >
                  https://pmc.ncbi.nlm.nih.gov/articles/{article.frontmatter.identifiers?.pmcid}
                </a>
              </li>
            )}
            <li>
              <a href={`https://doi.org/${article.frontmatter.doi}`} target="_blank">
                https://doi.org/{article.frontmatter.doi}
              </a>
            </li>
          </ul>
        </p>
      </Admonition>
      <div id="skip-to-article" />
      <FrontmatterParts parts={parts} keywords={keywords} hideKeywords={hideKeywords} />
      <ContentBlocks pageKind={article.kind} mdast={tree as GenericParent} />
      <BackmatterParts parts={parts} />
      <Footnotes />
      <Bibliography />
      {!hide_footer_links && !hide_all_footer_links && <FooterLinksBlock links={article.footer} />}
    </ReferencesProvider>
  );
}
