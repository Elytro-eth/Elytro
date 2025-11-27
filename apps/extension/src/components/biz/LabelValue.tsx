const LabelValue = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-row justify-between items-center gap-x-2 text-sm ">
    <span className="text-xs text-gray-600 whitespace-nowrap">{label}</span>
    <span className="text-foreground text-xs font-bold break-all">{value}</span>
  </div>
);

export default LabelValue;
