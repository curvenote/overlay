import React from 'react';
import { Tooltip } from 'myst-to-react';
import { ShieldAlert } from 'lucide-react';

const GitHubIssueButton: React.FC<{ id: string }> = ({ id }) => {
  const repoOwner = 'curvenote';
  const repoName = 'jats-xml';
  const issueTitle = encodeURIComponent(`${id}: `);
  const issueBody = encodeURIComponent(
    `<!-- Describe the PMC content issue -->\n\n<!-- Screenshots are nice, but no need to link back to the article -->\n\nID: ${id}`,
  );
  const url = `https://github.com/${repoOwner}/${repoName}/issues/new?title=${issueTitle}&body=${issueBody}`;

  return (
    <Tooltip title="Report an Issue">
      <a
        href={url}
        target="_blank"
        className="fixed bottom-2 right-2 p-2 z-10 bg-[#F3F4F5] border hover:border-white hover:shadow-lg hover:bg-[#DF4F4A] text-black hover:text-white rounded shadow no-underline text-base font-normal"
      >
        <ShieldAlert size={20} />
      </a>
    </Tooltip>
  );
};

export default GitHubIssueButton;
