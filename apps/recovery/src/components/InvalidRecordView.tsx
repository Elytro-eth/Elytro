// 'use client';

import { AlertCircle } from 'lucide-react';

// import { useSearchParams } from 'next/navigation';

export const InvalidRecordView = () => {
  // const params = useSearchParams();
  // const hasValidParams =
  //   params.get('id')?.startsWith('0x') && params.get('address') && params.get('chainId') && params.get('owner');

  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="rounded-xl bg-white px-4xl py-5xl flex flex-col items-center justify-center gap-y-sm w-[36rem]">
        <AlertCircle className="size-20 stroke-red rounded-full" />

        <div className="text-dark-blue text-bold-body">Invalid recovery link</div>

        <p className="text-md text-center text-gray-600">
          {/* {hasValidParams
              ? 'The link appears to be broken. Please contact the person who sent you the link.'
              : 'This link is missing required information. Please get a new recovery link from Elytro wallet..'}
             */}
          Please get the complete recovery link
          <br />
          from Elytro wallet.
        </p>
      </div>
    </div>
  );
};
