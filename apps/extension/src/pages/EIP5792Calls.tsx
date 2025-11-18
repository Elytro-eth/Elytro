// import React from 'react';
// import { useApproval } from '@/contexts/approval-context';
// // import { EIP5792CallsApproval } from '@/components/biz/EIP5792CallsApproval';
// // import { FullPageWrapper } from '@/components/biz/FullPageWrapper';

// const EIP5792Calls: React.FC = () => {
//   const { approval } = useApproval();

//   if (!approval?.data) {
//     return (
//       <FullPageWrapper>
//         <div className="flex items-center justify-center h-full">
//           <div className="text-center">
//             <h2 className="text-lg font-semibold mb-2">No calls data</h2>
//             <p className="text-muted-foreground">No EIP-5792 calls data available.</p>
//           </div>
//         </div>
//       </FullPageWrapper>
//     );
//   }

//   // const { calls, callId, dApp } = approval.data;

//   return (
//     <FullPageWrapper>
//       <div className="p-6">{/* <EIP5792CallsApproval calls={calls} callId={callId} dApp={dApp} /> */}</div>
//     </FullPageWrapper>
//   );
// };

// export default EIP5792Calls;
