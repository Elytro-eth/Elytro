'use client';

import { useSearchParams } from 'next/navigation';

export const InvalidRecordView = () => {
  const params = useSearchParams();
  const hasValidParams =
    params.get('id')?.startsWith('0x') && params.get('address') && params.get('chainId') && params.get('owner');

  return (
    <div className="flex flex-col items-center justify-center gap-y-md text-center">
      <div className="rounded-full bg-red-50 p-md">
        <svg
          className="size-16 text-red-500"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      </div>

      <p className="text-md text-gray-600">
        {hasValidParams
          ? 'The link appears to be broken. Please contact the person who sent you the link.'
          : 'This link is missing required information. Please get a new recovery link from Elytro wallet.'}
      </p>
    </div>
  );
};
