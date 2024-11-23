import React from 'react';

interface ProgressScreenProps {
  message: string;
  progress: number; // Value between 0 and 1
  color?: string;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ message, progress, color }) => {
  const progressStyle: React.CSSProperties = {
    width: `${progress * 100}%`,
    backgroundColor: color,
    transition: 'width 0.5s ease',
  };

  return (
    <div style={styles.container}>
      <div style={styles.message}>{message}</div>
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
  },
  message: {
    marginBottom: '20px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  progressBar: {
    width: '80%',
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
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
