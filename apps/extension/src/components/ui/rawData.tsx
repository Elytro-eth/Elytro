import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface IRawDataProps {
  children: any;
  defaultExpand?: false;
}

export function RawData(props: IRawDataProps) {
  const { children, defaultExpand = false } = props || {};
  const [showRawData, setShowRawData] = useState<boolean>(defaultExpand);
  return (
    <div>
      <button
        className="flex items-center justify-center gap-x-2xs elytro-text-tiny-body text-gray-750 mb-sm"
        onClick={() => setShowRawData((prev) => !prev)}
      >
        Raw Data
        {showRawData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <pre
        className={`
          elytro-text-code-body text-gray-500 overflow-auto w-full flex-grow px-lg py-md bg-gray-150 rounded-2xs
          transition-opacity whitespace-pre-wrap
          ${showRawData ? 'block' : 'hidden'}
          `}
        style={{ userSelect: 'text' }}
      >
        {children}
      </pre>
    </div>
  );
}
