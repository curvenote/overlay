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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
        <div className="text-red-600 text-lg font-bold">{message}</div>
        {citation && <div className="text-gray-600 mt-2 text-sm">Citation: {citation}</div>}
        {doi && (
          <div className="mt-4 text-sm">
            You may be able to view the source article here:{' '}
            <a href={`https://doi.org/${doi}`} className="text-blue-500 underline">
              {doi}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
      <div className="text-lg font-semibold mb-4">{message}</div>
      {citation && <div className="text-gray-600 mt-4 text-sm">{citation}</div>}
      <div className="w-3/4 h-4 mb-4 bg-gray-200 rounded-full dark:bg-gray-700">
        <div
          className="h-4 bg-blue-800 rounded-full dark:bg-blue-900"
          style={{ width: `${progress * 100}%` }}
        ></div>
      </div>
      <div className="mt-2 text-sm text-gray-600">{Math.round(progress * 100)}%</div>
    </div>
  );
};

export default ProgressScreen;
