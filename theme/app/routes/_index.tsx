import { Link } from '@remix-run/react';
import { ArticlePageAndNavigation } from './($id).$';
import { Admonition, AdmonitionKind } from 'myst-to-react';

const IDs = [
  'PMC10134778',
  'PMC10134779',
  'PMC10134782',
  'PMC10134783',
  'PMC10134789',
  'PMC10134790',
  'PMC10134792',
  'PMC10134793',
  'PMC10134794',
  'PMC10134795',
  'PMC10134796',
  'PMC10134797',
  'PMC10134798',
  'PMC10134802',
  'PMC10134803',
  'PMC10134804',
  'PMC10134805',
  'PMC10134806',
  'PMC10134807',
  'PMC10134810',
  'PMC10134812',
  'PMC10134813',
  'PMC10134817',
  'PMC10134818',
  'PMC10134819',
  'PMC10134820',
  'PMC10134821',
  'PMC10134824',
  'PMC10134825',
  'PMC10134827',
  'PMC10134828',
  'PMC10134829',
  'PMC10134830',
  'PMC10134831',
  'PMC10134832',
  'PMC10134833',
  'PMC10134836',
  'PMC10134839',
  'PMC10134841',
  'PMC10134842',
  'PMC10134843',
  'PMC10134844',
  'PMC10134846',
  'PMC10134847',
  'PMC10134849',
  'PMC10134851',
  'PMC10134852',
  'PMC10134853',
  'PMC10134854',
  'PMC10134855',
  'PMC10134856',
  'PMC10134858',
  'PMC10134860',
  'PMC10134861',
  'PMC10134863',
  'PMC10134864',
  'PMC10134865',
  'PMC10134868',
  'PMC10134870',
  'PMC10134871',
  'PMC10134872',
  'PMC10134874',
  'PMC10134876',
  'PMC10134880',
  'PMC10134881',
  'PMC10134883',
  'PMC10134886',
  'PMC10134887',
  'PMC10134888',
  'PMC10134890',
  'PMC10134896',
  'PMC10134898',
  'PMC10134899',
  'PMC10134900',
  'PMC10134901',
  'PMC10134902',
  'PMC10134903',
  'PMC10134904',
  'PMC10134905',
  'PMC10134906',
  'PMC10134909',
  'PMC10134910',
  'PMC10134911',
  'PMC10134912',
  'PMC10134913',
  'PMC10134914',
  'PMC10134915',
  'PMC10134916',
  'PMC10134917',
  'PMC10134918',
  'PMC10134919',
  'PMC10134920',
  'PMC10134921',
  'PMC10134922',
  'PMC10134923',
  'PMC10134924',
  'PMC10134925',
  'PMC10134926',
  'PMC10134927',
  'PMC10134928',
];

function Index() {
  return (
    <ArticlePageAndNavigation>
      <main>
        <Admonition
          title={<>Beta Rendering of PMC Open Access Article</>}
          kind={AdmonitionKind.warning}
          color="yellow"
          simple
          dropdown
        >
          <p>
            This is an experiment to create an overlay rendering of an open-access article. There
            may be errors in the content. We recommend looking at the original article on PMC
            directly.
          </p>
        </Admonition>
        <ul>
          {IDs.map((id) => (
            <li key={id}>
              <Link to={`/${id}`} prefetch="intent">
                {id}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </ArticlePageAndNavigation>
  );
}

export default Index;
