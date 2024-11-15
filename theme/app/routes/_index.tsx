import { Link } from '@remix-run/react';
import { ArticlePageAndNavigation } from './($id).$';
import { Admonition, AdmonitionKind } from 'myst-to-react';

const IDs = [
  'PMC10135332',
  'PMC10135333',
  'PMC10135334',
  'PMC10135335',
  'PMC10135336',
  'PMC10135337',
  'PMC10135338',
  'PMC10135339',
  'PMC10135341',
  'PMC10135342',
  'PMC10135343',
  'PMC10135344',
  'PMC10135345',
  'PMC10135346',
  'PMC10135347',
  'PMC10135348',
  'PMC10135349',
  'PMC10135350',
  'PMC10135351',
  'PMC10135352',
  'PMC10135353',
  'PMC10135354',
  'PMC10135355',
  'PMC10135356',
  'PMC10135357',
  'PMC10135358',
  'PMC10135359',
  'PMC10135360',
  'PMC10135361',
  'PMC10135362',
  'PMC10135363',
  'PMC10135364',
  'PMC10135365',
  'PMC10135366',
  'PMC10135367',
  'PMC10135368',
  'PMC10135369',
  'PMC10135370',
  'PMC10135371',
  'PMC10135374',
  'PMC10135375',
  'PMC10135376',
  'PMC10135377',
  'PMC10135378',
  'PMC10135379',
  'PMC10135380',
  'PMC10135381',
  'PMC10135382',
  'PMC10135383',
  'PMC10135384',
  'PMC10135385',
  'PMC10135386',
  'PMC10135387',
  'PMC10135388',
  'PMC10135389',
  'PMC10135390',
  'PMC10135391',
  'PMC10135392',
  'PMC10135393',
  'PMC10135394',
  'PMC10135395',
  'PMC10135396',
  'PMC10135397',
  'PMC10135403',
  'PMC10135404',
  'PMC10135405',
  'PMC10135406',
  'PMC10135407',
  'PMC10135408',
  'PMC10135409',
  'PMC10135410',
  'PMC10135411',
  'PMC10135412',
  'PMC10135413',
  'PMC10135414',
  'PMC10135415',
  'PMC10135418',
  'PMC10135419',
  'PMC10135420',
  'PMC10135422',
  'PMC10135423',
  'PMC10135424',
  'PMC10135425',
  'PMC10135426',
  'PMC10135427',
  'PMC10135428',
  'PMC10135429',
  'PMC10135430',
  'PMC10135431',
  'PMC10135433',
  'PMC10135434',
  'PMC10135435',
  'PMC10135436',
  'PMC10135438',
  'PMC10135439',
  'PMC10135441',
  'PMC10135444',
  'PMC10135445',
  'PMC10135446',
  'PMC10135447',
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
