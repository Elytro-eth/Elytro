import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface IRawDataProps {
  children: any;
  defaultExpand?: false;
}

export function RawData({ children, defaultExpand = false }: IRawDataProps) {
  const [showRawData, setShowRawData] = useState<boolean>(defaultExpand);
  return (
    <div className="w-full">
      <button
        className="flex items-center justify-center gap-x-2xs elytro-text-tiny-body text-gray-750 mb-sm"
        onClick={() => setShowRawData((prev) => !prev)}
      >
        Raw Data
        {showRawData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <div className={`${showRawData ? 'table' : 'hidden'} w-full table-fixed`}>
        <pre
          className="elytro-text-code-body text-gray-500 px-lg py-md bg-gray-150 rounded-2xs select-text cursor-text whitespace-pre-wrap break-all overflow-x-auto w-full table-cell"
          style={{
            userSelect: 'text',
            WebkitUserSelect: 'text',
          }}
        >
          {children}
        </pre>
      </div>
    </div>
  );
}
