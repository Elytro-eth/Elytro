import React from 'react';

interface IInfoCardItemProps {
  label: React.ReactNode;
  content: React.ReactNode;
}

function InfoCardItem({ label, content }: IInfoCardItemProps) {
  return (
    <div className="flex flex-row justify-between items-center gap-x-sm">
      <span className="text-xs text-gray-600 text-nowrap">{label}</span>
      {content}
    </div>
  );
}

function InfoCardList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col w-full px-lg py-md bg-gray-150 rounded-sm gap-y-sm">{children}</div>;
}
const InfoCard = { InfoCardItem, InfoCardList };

export default InfoCard;
