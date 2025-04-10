import SessionCard from '../SessionCard';

export default function ActivationDetail() {
  return (
    <div className="flex flex-col gap-y-md">
      <div className="flex flex-col gap-2xs px-lg py-md rounded-sm bg-light-green">
        <h3 className="elytro-text-small-bold text-gray-750">
          Why activating?
        </h3>
        <p className="elytro-text-tiny-body text-gray-750">
          This confirms your wallet ownership on blockchain
        </p>
      </div>

      <SessionCard />
    </div>
  );
}
