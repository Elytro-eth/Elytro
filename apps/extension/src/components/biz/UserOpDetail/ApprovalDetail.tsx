import { DecodeResult } from '@soulwallet/decoder';
import SessionCard from '../SessionCard';
import InfoCard from '../InfoCard';
import TokenAmountItem from '../TokenAmountItem';
import FragmentedAddress from '../FragmentedAddress';

const { InfoCardItem, InfoCardWrapper } = InfoCard;

interface IApprovalDetailProps {
  session?: TDAppInfo;
  decodedUserOp: Nullable<DecodeResult>;
}

export default function ActivationDetail({
  session,
  decodedUserOp,
}: IApprovalDetailProps) {
  return (
    <>
      <SessionCard session={session} />
      <div className="flex flex-col gap-y-sm">
        <InfoCardWrapper>
          <InfoCardItem
            label="Sending"
            content={
              <TokenAmountItem
                {...decodedUserOp?.toInfo}
                amount={decodedUserOp?.value?.toString() || '0'} // Changed line
              />
            }
          />

          <InfoCardItem label="Token" content={decodedUserOp?.toInfo?.symbol} />

          <InfoCardItem
            label="Contract"
            content={
              <FragmentedAddress
                address={decodedUserOp?.to}
                chainId={decodedUserOp?.toInfo?.chainId}
              />
            }
          />

          <InfoCardItem
            label="Function"
            content={decodedUserOp?.method?.text || 'Unknown'}
          />

          {/* TODO: get data */}
          <InfoCardItem label="Data" content={decodedUserOp?.method?.bytes4} />
        </InfoCardWrapper>
      </div>
    </>
  );
}
