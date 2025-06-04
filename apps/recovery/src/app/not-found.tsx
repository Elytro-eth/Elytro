import ContentWrapper from '@/components/ContentWrapper';
import { InvalidRecordView } from '@/components/InvalidRecordView';

export default function NotFound() {
  return (
    <ContentWrapper title="The recovery link you visited is invalid">
      <InvalidRecordView />
    </ContentWrapper>
  );
}
