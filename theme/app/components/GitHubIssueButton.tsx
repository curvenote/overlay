import React from 'react';

const GitHubIssueButton: React.FC<{ id: string }> = ({ id }) => {
  const openGitHubIssue = () => {
    const repoOwner = 'curvenote';
    const repoName = 'jats-xml';
    const issueTitle = encodeURIComponent(`${id}: `);
    const issueBody = encodeURIComponent(
      `<!-- Describe the PMC content issue -->\n\n<!-- Screenshots are nice, but no need to link back to the article -->\n\nID: ${id}`,
    );

    const url = `https://github.com/${repoOwner}/${repoName}/issues/new?title=${issueTitle}&body=${issueBody}`;
    window.open(url, '_blank');
  };

  return (
    <button style={styles.button} onClick={openGitHubIssue}>
      Report an Issue
    </button>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  button: {
    position: 'fixed',
    top: '10px',
    right: '10px',
    zIndex: 1000,
    backgroundColor: '#345E98',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'background-color 0.3s ease',
  },
};

export default GitHubIssueButton;
