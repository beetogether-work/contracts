export const FEE_DIVIDER = 10000;

export const PROTOCOL_INDEX = 0;

export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

// export const EVIDENCE_CID = 'QmNSARUuUMHkFcnSzrCAhmZkmQu7ViK18sPkg48xnbAmv4';

// export const META_EVIDENCE_CID = 'QmQ2hcACF6r2Gf8PDxG4NcBdurzRUopwcaYQHNhSah6a8v';

// export const ARBITRATION_FEE_TIMEOUT = 60 * 60 * 24 * 3; // 3 days

export enum MintStatus {
  ON_PAUSE,
  ONLY_WHITELIST,
  PUBLIC,
}

export enum ProposalRequestStatus {
  Pending, // Pending to be executed
  Executed, // Executed
}

// export enum DisputeStatus {
//   Waiting,
//   Appealable,
//   Solved,
// }

// export enum TransactionStatus {
//   NoDispute,
//   WaitingSender,
//   WaitingReceiver,
//   DisputeCreated,
//   Resolved,
// }

// export enum PaymentType {
//   Release,
//   Reimburse,
// }
