import { Link, useFetcher, useNavigate } from '@remix-run/react';
import type { ActionFunction } from '@remix-run/node';
import type { ChangeEventHandler, KeyboardEventHandler } from 'react';
import { useEffect, useState } from 'react';
import { Admonition, AdmonitionKind } from 'myst-to-react';
import { getFolders, triggerPubSub } from '~/utils/loaders.server';
import { ArticlePageAndNavigation } from './($id)';
import { doi } from 'doi-utils';
import { isUrl } from '~/utils/isUrl';
import { simpleHash } from '~/utils/simpleHash';

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') return;
  return { folders: await getFolders() };
};

const buttonClasses = `px-6 py-2 font-medium rounded-md shadow transition 
  bg-blue-800 text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50`;

function isValidTarget(target: string) {
  return target.match(/^PMC[0-9]+$/) || doi.validate(target) || isUrl(target);
}

function Index() {
  const [target, setTarget] = useState('');
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [inputDisabled, setInputDisabled] = useState(false);
  const navigate = useNavigate();
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setTarget(event.target.value);
  };
  const handleInputEnter: KeyboardEventHandler = async (event) => {
    if (event.key === 'Enter' && isValidTarget(target)) {
      await handleSubmit();
    }
  };
  const handleSubmit = async () => {
    if (target) {
      setButtonDisabled(true);
      setInputDisabled(true);
      if (target.match(/^PMC[0-9]+$/)) {
        navigate(`/${target}`);
      } else if (doi.validate(target)) {
        navigate(`/doi/${doi.normalize(target)}`);
      } else if (isUrl(target)) {
        const id = simpleHash(target);
        await triggerPubSub(target, id);
        navigate(`/status/${id}`);
      }
    }
  };
  useEffect(() => {
    if (isValidTarget(target)) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [target]);
  const fetcher = useFetcher();
  const handleFolders = () => {
    fetcher.submit({}, { method: 'POST' });
  };
  return (
    <ArticlePageAndNavigation>
      <main>
        <Admonition
          title={<>Beta Overlay for Open Access Articles</>}
          kind={AdmonitionKind.warning}
          color="yellow"
          simple
          dropdown
        >
          <p>
            This is an experiment to create an overlay rendering of an open-access article. There
            may be errors in the content. We recommend looking at the original article via DOI or
            PMC directly.
          </p>
        </Admonition>
        <text>Enter PMC ID, DOI, or article URL: </text>
        <div className="flex items-center space-x-2">
          <input
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="PMC###"
            onChange={handleChange}
            value={target}
            disabled={inputDisabled}
            onKeyDown={handleInputEnter}
          />
          <button className={buttonClasses} onClick={handleSubmit} disabled={buttonDisabled}>
            Submit
          </button>
        </div>
        <h3>Previously processed examples:</h3>
        {!fetcher.data?.folders && (
          <button
            className={buttonClasses}
            onClick={handleFolders}
            disabled={fetcher.state !== 'idle'}
          >
            Load...
          </button>
        )}
        {fetcher.data?.folders && (
          <ul>
            {fetcher.data?.folders.map((folder: string) => (
              <li key={folder}>
                <Link to={`/${folder}`} prefetch="intent">
                  {folder}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </ArticlePageAndNavigation>
  );
}

export default Index;
