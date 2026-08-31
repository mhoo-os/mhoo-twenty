import { describe, expect, it } from 'vitest';

import {
  evaluateAcquisitionAuthority,
  evaluateGate0,
  type FinanceEngagementContract,
  isProvenComplete,
  type ProvenCompleteReceipt,
} from '../engagement/authority-contract';

const completeReceipt: ProvenCompleteReceipt = {
  approvedEligibleGate0Revision: true,
  approvedExactSourceAcquisition: true,
  immutableOriginalsAndManifest: true,
  sourceBoundaryExhaustedAndControlled: true,
  zeroUnresolvedPopulationEffects: true,
  rowCountsAndAmountsReconciled: true,
  independentControlsAndContinuityPassed: true,
  noHiddenPartialOrMissingScope: true,
  reproducibleSnapshotRulesAndRun: true,
  authorizedReviewerApprovedWithoutExceptions: true,
};

const approvedContract = (): FinanceEngagementContract => ({
  schemaVersion: '2.0',
  status: 'APPROVED',
  revision: {
    contractId: 'contract-1',
    revision: 1,
    contentSha256: 'a'.repeat(64),
    canonicalRepository: 'mhoo-os/mhoo',
  },
  engagement: {
    legalEntityName: 'Approved entity',
    authorizedClientRepresentative: 'restricted-member-reference',
    representativeAuthorityBasis: 'approved authority record',
    inclusiveStartDate: '2020-01-01',
    inclusiveEndDate: '2025-12-31',
    timezone: 'America/New_York',
    yearBasis: 'CALENDAR',
    yearStartMonth: 1,
    operatingYearDefinition: null,
    monthCloseRule: 'calendar month end',
    yearPeriods: Array.from({ length: 6 }, (_, index) => ({
      startDate: `${2020 + index}-01-01`,
      endDate: `${2020 + index}-12-31`,
    })),
  },
  cloverScope: {
    merchantReferences: ['masked-merchant'],
    locationReferences: ['masked-location'],
    expectedHistoryStart: '2020-01-01',
    expectedHistoryEnd: '2025-12-31',
    tenderScope: 'all approved tenders; exclusions recorded',
    orderTypeScope: 'all approved order types; exclusions recorded',
    employeeShiftScope: 'OUT_OF_SCOPE',
  },
  inventory: {
    attestations: {
      BUSINESS_CHECKING: 'ITEMIZED',
      BUSINESS_SAVINGS: 'NONE_KNOWN',
      BUSINESS_CREDIT_CARD: 'NONE_KNOWN',
      PROCESSOR: 'NONE_KNOWN',
      LOAN: 'NONE_KNOWN',
      CASH: 'NONE_KNOWN',
      CLOSED_ACCOUNTS: 'NONE_KNOWN',
      OWNER_OR_PERSONAL_ACCOUNTS: 'NONE_KNOWN',
    },
    items: [
      {
        inventoryId: 'business-checking-1',
        category: 'BUSINESS_CHECKING',
        maskedLabel: 'checking-1',
        lifecycle: 'OPEN',
        scope: 'IN_SCOPE',
        sensitivity: 'BUSINESS',
      },
    ],
    representativeAttestation: 'Every currently known item is listed.',
    closedAccountDiscoveryAnswer: 'No closed accounts are known.',
    missingPeriodDiscoveryAnswer: 'Known missing periods are itemized.',
  },
  peopleAndRoles: {
    engagementAdministrator: 'member-admin',
    evidenceCustodian: 'member-custodian',
    finalReviewers: ['member-reviewer'],
    approvedRecipients: ['recipient-reference'],
    recipientNoneAttestation: null,
    segregationAndRoleLimitations: 'Roles are separated and least privilege.',
  },
  workProduct: {
    approvedName: 'Six-Year Financial Records Review and Exception Workpapers',
    language: 'English',
    permittedFactualLanguage: 'Factual exceptions and stated limitations.',
    legalReportLanguageReviewer: 'member-legal-reviewer',
    limitations: {
      namesExactScopeAndDates: true,
      namesNonProvenCoverage: true,
      namesExclusionsAndUnresolvedExceptions: true,
      statesEvidenceReliance: true,
      disclaimsAuditAssuranceTaxAndLegalOpinion: true,
    },
  },
  retentionAndReturn: {
    policyReference: 'policy-1',
    retentionTrigger: 'engagement closure',
    retentionDuration: 'approved duration',
    deletionAuthority: 'client representative',
    deletionReceiptRequired: true,
    exportFormat: 'approved manifest and originals',
    exportRecipient: 'recipient-reference',
    legalHoldProcess: 'hold prevents deletion until released',
    clientReturnOrDisposalPolicy: 'return then receipt-backed disposal',
  },
  authorizations: {
    sourceAcquisition: { status: 'NOT_AUTHORIZED', formReferences: [] },
    personalData: { status: 'NOT_AUTHORIZED', consents: [] },
  },
  approvals: {
    clientApprovedBy: 'client-representative',
    clientApprovedAt: '2026-08-31T00:00:00Z',
    mhooAcceptedBy: 'mhoo-approver',
    mhooAcceptedAt: '2026-08-31T00:00:00Z',
    reportLanguageApprovedBy: 'language-approver',
    retentionApprovedBy: 'retention-approver',
  },
});

describe('finance engagement authority contract', () => {
  it('approves exact Gate 0 scope without granting source or production access', () => {
    const result = evaluateGate0(approvedContract());

    expect(result).toEqual({
      gate0Approved: true,
      blockers: [],
      mayAcquireBusinessSourceData: false,
      mayAccessPersonalAccountData: false,
      mayUseCredentials: false,
      mayDeploy: false,
      mayUseProduction: false,
    });
  });

  it('requires six contiguous inclusive year periods', () => {
    const contract = approvedContract();
    contract.engagement.inclusiveEndDate = '2025-12-30';

    expect(evaluateGate0(contract).blockers).toContain(
      'engagement.sixInclusiveYearPeriods',
    );
  });

  it('rejects an unanswered or falsely itemized inventory category', () => {
    const contract = approvedContract();
    contract.inventory.attestations.LOAN = 'NOT_ANSWERED';
    contract.inventory.attestations.CASH = 'ITEMIZED';

    expect(evaluateGate0(contract).blockers).toEqual(
      expect.arrayContaining([
        'inventory.attestations.LOAN',
        'inventory.items.CASH',
      ]),
    );
  });

  it('does not turn separate forms into blanket Gate 0 acquisition authority', () => {
    const contract = approvedContract();
    contract.authorizations.sourceAcquisition = {
      status: 'APPROVED',
      formReferences: ['source-form-1'],
    };
    contract.authorizations.personalData = {
      status: 'APPROVED',
      consents: [],
    };

    const result = evaluateGate0(contract);
    expect(result.mayAcquireBusinessSourceData).toBe(false);
    expect(result.mayAccessPersonalAccountData).toBe(false);
    expect(result.mayUseCredentials).toBe(false);
    expect(result.mayDeploy).toBe(false);
    expect(result.mayUseProduction).toBe(false);
  });

  it('authorizes only the exact in-scope business item and acquisition form', () => {
    const contract = approvedContract();
    contract.authorizations.sourceAcquisition = {
      status: 'APPROVED',
      formReferences: ['source-form-1'],
    };

    expect(
      evaluateAcquisitionAuthority(contract, {
        inventoryId: 'business-checking-1',
        sourceAcquisitionFormReference: 'source-form-1',
      }),
    ).toEqual({
      authorized: true,
      blockers: [],
      mayUseCredentials: false,
      mayDeploy: false,
      mayUseProduction: false,
    });
    expect(
      evaluateAcquisitionAuthority(contract, {
        inventoryId: 'business-checking-1',
        sourceAcquisitionFormReference: 'another-form',
      }).authorized,
    ).toBe(false);
  });

  it('requires an exact case-specific consent for restricted personal data', () => {
    const contract = approvedContract();
    contract.inventory.attestations.OWNER_OR_PERSONAL_ACCOUNTS = 'ITEMIZED';
    contract.inventory.items.push({
      inventoryId: 'personal-account-1',
      category: 'OWNER_OR_PERSONAL_ACCOUNTS',
      maskedLabel: 'personal-1',
      lifecycle: 'OPEN',
      scope: 'IN_SCOPE',
      sensitivity: 'RESTRICTED_PERSONAL',
    });
    contract.authorizations.sourceAcquisition = {
      status: 'APPROVED',
      formReferences: ['source-form-personal-1'],
    };
    contract.authorizations.personalData = {
      status: 'APPROVED',
      consents: [
        {
          consentReference: 'personal-consent-1',
          inventoryId: 'personal-account-1',
          caseReference: 'case-1',
        },
      ],
    };

    expect(
      evaluateAcquisitionAuthority(contract, {
        inventoryId: 'personal-account-1',
        sourceAcquisitionFormReference: 'source-form-personal-1',
        personalConsentReference: 'personal-consent-1',
        caseReference: 'case-1',
      }).authorized,
    ).toBe(true);
    expect(
      evaluateAcquisitionAuthority(contract, {
        inventoryId: 'personal-account-1',
        sourceAcquisitionFormReference: 'source-form-personal-1',
        personalConsentReference: 'personal-consent-1',
        caseReference: 'another-case',
      }).authorized,
    ).toBe(false);
  });

  it('defines PROVEN_COMPLETE as an all-conjunct receipt', () => {
    expect(isProvenComplete(completeReceipt)).toBe(true);
    expect(
      isProvenComplete({
        ...completeReceipt,
        independentControlsAndContinuityPassed: false,
      }),
    ).toBe(false);
  });
});
