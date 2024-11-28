import { Link, useFetcher, useNavigate } from '@remix-run/react';
import type { ActionFunction } from '@remix-run/node';
import type { ChangeEventHandler, KeyboardEventHandler } from 'react';
import { useEffect, useState } from 'react';
import { Admonition, AdmonitionKind } from 'myst-to-react';
import { getFolders } from '~/utils/loaders.server';
import { ArticlePageAndNavigation } from './($id).$';

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') return;
  return { folders: await getFolders() };
};

const buttonClasses = `px-6 py-2 font-medium rounded-md shadow transition 
  bg-blue-800 text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50`;

function Index() {
  const [id, setId] = useState('');
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [inputDisabled, setInputDisabled] = useState(false);
  const navigate = useNavigate();
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setId(event.target.value);
  };
  const handleInputEnter: KeyboardEventHandler = async (event) => {
    if (event.key === 'Enter' && id.match(/^PMC[0-9]+$/)) {
      await handleSubmit();
    }
  };
  const handleSubmit = async () => {
    if (id) {
      setButtonDisabled(true);
      setInputDisabled(true);
      navigate(`/${id}`);
    }
  };
  useEffect(() => {
    if (id.match(/^PMC[0-9]+$/)) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [id]);
  const fetcher = useFetcher();
  const handleFolders = () => {
    fetcher.submit({}, { method: 'POST' });
  };
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
        <text>Enter PMC ID: </text>
        <div className="flex items-center space-x-2">
          <input
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="PMC###"
            onChange={handleChange}
            value={id}
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
