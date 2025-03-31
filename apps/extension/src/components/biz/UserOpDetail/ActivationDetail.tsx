import SessionCard from '../SessionCard';

export default function ActivationDetail() {
  return (
    <div className="flex flex-col gap-y-md">
      <div className="flex flex-col gap-2xs px-lg py-md rounded-sm bg-light-green">
        <h3 className="elytro-text-small-bold text-gray-750">Why activate?</h3>
        <p className="elytro-text-tiny-body text-gray-750">
          Activation confirms ownership and protects your wallet on the
          blockchain network.
        </p>
      </div>

      <SessionCard />
    </div>
  );
}
