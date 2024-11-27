import React from 'react';

interface ProgressScreenProps {
  message: string;
  progress: number; // Value between 0 and 1
  status?: 'none' | 'processing' | 'success' | 'failure';
  doi?: string;
  citation?: string;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({
  message,
  progress,
  status,
  citation,
  doi,
}) => {
  if (status === 'failure') {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>{message}</div>
        {citation && <div style={styles.citation}>Citation: {citation}</div>}
        {doi && (
          <div style={styles.doiMessage}>
            You may be able to view the source article here:{' '}
            <a href={`https://doi.org/${doi}`} style={styles.doiLink}>
              {doi}
            </a>
          </div>
        )}
      </div>
    );
  }

  const progressStyle: React.CSSProperties = {
    width: `${progress * 100}%`,
    transition: 'width 0.5s ease',
  };

  return (
    <div style={styles.container}>
      <div style={styles.message}>{message}</div>
      {citation && <div style={styles.citation}>{citation}</div>}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progress, ...progressStyle }} />
      </div>
      <div style={styles.percentage}>{Math.round(progress * 100)}%</div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    color: '#333',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },
  message: {
    marginBottom: '20px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#d32f2f', // Red for error message
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  citation: {
    marginBottom: '20px',
    fontSize: '14px',
    color: '#666',
  },
  doiMessage: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#333',
  },
  doiLink: {
    color: '#345E98',
    textDecoration: 'none',
  },
  progressBar: {
    width: '80%',
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
    position: 'relative',
  },
  progress: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: '10px 0 0 10px',
  },
  percentage: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#666',
  },
};

export default ProgressScreen;
