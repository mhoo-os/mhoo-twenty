export const REQUIRED_INVENTORY_CATEGORIES = [
  'BUSINESS_CHECKING',
  'BUSINESS_SAVINGS',
  'BUSINESS_CREDIT_CARD',
  'PROCESSOR',
  'LOAN',
  'CASH',
  'CLOSED_ACCOUNTS',
  'OWNER_OR_PERSONAL_ACCOUNTS',
] as const;

export type InventoryCategory =
  (typeof REQUIRED_INVENTORY_CATEGORIES)[number];
export type InventoryAttestation = 'ITEMIZED' | 'NONE_KNOWN' | 'NOT_ANSWERED';
export type YearBasis = 'CALENDAR' | 'FISCAL' | 'OPERATING';
export type SeparateAuthorizationStatus =
  | 'NOT_AUTHORIZED'
  | 'APPROVED'
  | 'REVOKED'
  | 'EXPIRED';

type YearPeriod = {
  startDate: string;
  endDate: string;
};

type InventoryItem = {
  inventoryId: string;
  category: InventoryCategory;
  maskedLabel: string;
  lifecycle: 'OPEN' | 'CLOSED' | 'RENAMED' | 'UNKNOWN';
  scope: 'IN_SCOPE' | 'POTENTIALLY_RELEVANT' | 'OUT_OF_SCOPE';
  sensitivity: 'BUSINESS' | 'RESTRICTED_PERSONAL';
};

export type FinanceEngagementContract = {
  schemaVersion: '2.0';
  status:
    | 'DRAFT'
    | 'READY_FOR_CLIENT_APPROVAL'
    | 'APPROVED'
    | 'SUPERSEDED'
    | 'CLOSED';
  revision: {
    contractId: string;
    revision: number;
    contentSha256: string;
    canonicalRepository: 'mhoo-os/mhoo';
  };
  engagement: {
    legalEntityName: string;
    authorizedClientRepresentative: string;
    representativeAuthorityBasis: string;
    inclusiveStartDate: string;
    inclusiveEndDate: string;
    timezone: string;
    yearBasis: YearBasis;
    yearStartMonth: number;
    operatingYearDefinition: string | null;
    monthCloseRule: string;
    yearPeriods: YearPeriod[];
  };
  cloverScope: {
    merchantReferences: string[];
    locationReferences: string[];
    expectedHistoryStart: string;
    expectedHistoryEnd: string;
    tenderScope: string;
    orderTypeScope: string;
    employeeShiftScope: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'UNAVAILABLE';
  };
  inventory: {
    attestations: Record<InventoryCategory, InventoryAttestation>;
    items: InventoryItem[];
    representativeAttestation: string;
    closedAccountDiscoveryAnswer: string;
    missingPeriodDiscoveryAnswer: string;
  };
  peopleAndRoles: {
    engagementAdministrator: string;
    evidenceCustodian: string;
    finalReviewers: string[];
    approvedRecipients: string[];
    recipientNoneAttestation: string | null;
    segregationAndRoleLimitations: string;
  };
  workProduct: {
    approvedName: string;
    language: string;
    permittedFactualLanguage: string;
    legalReportLanguageReviewer: string;
    limitations: {
      namesExactScopeAndDates: boolean;
      namesNonProvenCoverage: boolean;
      namesExclusionsAndUnresolvedExceptions: boolean;
      statesEvidenceReliance: boolean;
      disclaimsAuditAssuranceTaxAndLegalOpinion: boolean;
    };
  };
  retentionAndReturn: {
    policyReference: string;
    retentionTrigger: string;
    retentionDuration: string;
    deletionAuthority: string;
    deletionReceiptRequired: true;
    exportFormat: string;
    exportRecipient: string;
    legalHoldProcess: string;
    clientReturnOrDisposalPolicy: string;
  };
  authorizations: {
    sourceAcquisition: {
      status: SeparateAuthorizationStatus;
      formReferences: string[];
    };
    personalData: {
      status: SeparateAuthorizationStatus;
      consents: {
        consentReference: string;
        inventoryId: string;
        caseReference: string;
      }[];
    };
  };
  approvals: {
    clientApprovedBy: string;
    clientApprovedAt: string;
    mhooAcceptedBy: string;
    mhooAcceptedAt: string;
    reportLanguageApprovedBy: string;
    retentionApprovedBy: string;
  };
};

export type Gate0Evaluation = {
  gate0Approved: boolean;
  blockers: string[];
  mayAcquireBusinessSourceData: boolean;
  mayAccessPersonalAccountData: boolean;
  mayUseCredentials: false;
  mayDeploy: false;
  mayUseProduction: false;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^[a-f0-9]{64}$/;

const hasText = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const parseDate = (value: string): Date | null => {
  if (!ISO_DATE.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
    ? null
    : parsed;
};

const nextDay = (value: Date) => {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + 1);
  return result;
};

const hasSixContiguousInclusivePeriods = (
  startDate: string,
  endDate: string,
  periods: YearPeriod[],
) => {
  if (periods.length !== 6) {
    return false;
  }

  const engagementStart = parseDate(startDate);
  const engagementEnd = parseDate(endDate);
  const parsedPeriods = periods.map((period) => ({
    start: parseDate(period.startDate),
    end: parseDate(period.endDate),
  }));

  if (
    engagementStart === null ||
    engagementEnd === null ||
    parsedPeriods.some(({ start, end }) => start === null || end === null)
  ) {
    return false;
  }

  if (
    parsedPeriods[0].start?.getTime() !== engagementStart.getTime() ||
    parsedPeriods[5].end?.getTime() !== engagementEnd.getTime()
  ) {
    return false;
  }

  return parsedPeriods.every(({ start, end }, index) => {
    if (start === null || end === null || start > end) {
      return false;
    }
    if (index === 0) {
      return true;
    }
    const priorEnd = parsedPeriods[index - 1].end;
    return priorEnd !== null && nextDay(priorEnd).getTime() === start.getTime();
  });
};

const hasDeclaredYearBoundaries = (
  basis: YearBasis,
  yearStartMonth: number,
  periods: YearPeriod[],
) => {
  if (basis === 'OPERATING') {
    return true;
  }

  return periods.every((period) => {
    const start = parseDate(period.startDate);
    const end = parseDate(period.endDate);
    if (start === null || end === null) {
      return false;
    }

    const requiredMonth = basis === 'CALENDAR' ? 0 : yearStartMonth - 1;
    if (start.getUTCMonth() !== requiredMonth || start.getUTCDate() !== 1) {
      return false;
    }

    const nextBoundary = new Date(
      Date.UTC(start.getUTCFullYear() + 1, requiredMonth, 1),
    );
    nextBoundary.setUTCDate(nextBoundary.getUTCDate() - 1);
    return end.getTime() === nextBoundary.getTime();
  });
};

export const evaluateGate0 = (
  contract: FinanceEngagementContract,
): Gate0Evaluation => {
  const blockers: string[] = [];
  const requireText = (value: string | null | undefined, field: string) => {
    if (!hasText(value)) {
      blockers.push(field);
    }
  };

  if (contract.status !== 'APPROVED') blockers.push('status');
  if (contract.revision.revision < 1) blockers.push('revision.revision');
  if (!SHA256.test(contract.revision.contentSha256)) {
    blockers.push('revision.contentSha256');
  }
  requireText(contract.revision.contractId, 'revision.contractId');

  requireText(
    contract.engagement.legalEntityName,
    'engagement.legalEntityName',
  );
  requireText(
    contract.engagement.authorizedClientRepresentative,
    'engagement.authorizedClientRepresentative',
  );
  requireText(
    contract.engagement.representativeAuthorityBasis,
    'engagement.representativeAuthorityBasis',
  );
  requireText(contract.engagement.timezone, 'engagement.timezone');
  requireText(contract.engagement.monthCloseRule, 'engagement.monthCloseRule');
  if (
    contract.engagement.yearStartMonth < 1 ||
    contract.engagement.yearStartMonth > 12
  ) {
    blockers.push('engagement.yearStartMonth');
  }
  if (
    contract.engagement.yearBasis === 'CALENDAR' &&
    contract.engagement.yearStartMonth !== 1
  ) {
    blockers.push('engagement.calendarYearStartMonth');
  }
  if (
    contract.engagement.yearBasis === 'OPERATING' &&
    !hasText(contract.engagement.operatingYearDefinition)
  ) {
    blockers.push('engagement.operatingYearDefinition');
  }
  if (
    !hasSixContiguousInclusivePeriods(
      contract.engagement.inclusiveStartDate,
      contract.engagement.inclusiveEndDate,
      contract.engagement.yearPeriods,
    )
  ) {
    blockers.push('engagement.sixInclusiveYearPeriods');
  }
  if (
    !hasDeclaredYearBoundaries(
      contract.engagement.yearBasis,
      contract.engagement.yearStartMonth,
      contract.engagement.yearPeriods,
    )
  ) {
    blockers.push('engagement.yearBoundaries');
  }

  if (contract.cloverScope.merchantReferences.length === 0) {
    blockers.push('cloverScope.merchantReferences');
  }
  if (contract.cloverScope.locationReferences.length === 0) {
    blockers.push('cloverScope.locationReferences');
  }
  for (const [field, value] of Object.entries({
    expectedHistoryStart: contract.cloverScope.expectedHistoryStart,
    expectedHistoryEnd: contract.cloverScope.expectedHistoryEnd,
    tenderScope: contract.cloverScope.tenderScope,
    orderTypeScope: contract.cloverScope.orderTypeScope,
  })) {
    requireText(value, `cloverScope.${field}`);
  }

  for (const category of REQUIRED_INVENTORY_CATEGORIES) {
    const attestation = contract.inventory.attestations[category];
    if (attestation === 'NOT_ANSWERED') {
      blockers.push(`inventory.attestations.${category}`);
    }
    if (
      attestation === 'ITEMIZED' &&
      !contract.inventory.items.some((item) => item.category === category)
    ) {
      blockers.push(`inventory.items.${category}`);
    }
  }
  requireText(
    contract.inventory.representativeAttestation,
    'inventory.representativeAttestation',
  );
  requireText(
    contract.inventory.closedAccountDiscoveryAnswer,
    'inventory.closedAccountDiscoveryAnswer',
  );
  requireText(
    contract.inventory.missingPeriodDiscoveryAnswer,
    'inventory.missingPeriodDiscoveryAnswer',
  );

  requireText(
    contract.peopleAndRoles.engagementAdministrator,
    'peopleAndRoles.engagementAdministrator',
  );
  requireText(
    contract.peopleAndRoles.evidenceCustodian,
    'peopleAndRoles.evidenceCustodian',
  );
  requireText(
    contract.peopleAndRoles.segregationAndRoleLimitations,
    'peopleAndRoles.segregationAndRoleLimitations',
  );
  if (contract.peopleAndRoles.finalReviewers.length === 0) {
    blockers.push('peopleAndRoles.finalReviewers');
  }
  if (
    contract.peopleAndRoles.approvedRecipients.length === 0 &&
    !hasText(contract.peopleAndRoles.recipientNoneAttestation)
  ) {
    blockers.push('peopleAndRoles.approvedRecipients');
  }

  for (const [field, value] of Object.entries({
    approvedName: contract.workProduct.approvedName,
    language: contract.workProduct.language,
    permittedFactualLanguage: contract.workProduct.permittedFactualLanguage,
    legalReportLanguageReviewer:
      contract.workProduct.legalReportLanguageReviewer,
  })) {
    requireText(value, `workProduct.${field}`);
  }
  if (Object.values(contract.workProduct.limitations).some((value) => !value)) {
    blockers.push('workProduct.limitations');
  }

  for (const [field, value] of Object.entries(
    contract.retentionAndReturn,
  ).filter(([field]) => field !== 'deletionReceiptRequired')) {
    requireText(value as string, `retentionAndReturn.${field}`);
  }
  if (!contract.retentionAndReturn.deletionReceiptRequired) {
    blockers.push('retentionAndReturn.deletionReceiptRequired');
  }

  for (const [field, value] of Object.entries(contract.approvals)) {
    requireText(value, `approvals.${field}`);
  }

  const gate0Approved = blockers.length === 0;
  return {
    gate0Approved,
    blockers,
    // Gate 0 is intentionally incapable of authorizing an acquisition. Call
    // evaluateAcquisitionAuthority with the exact source/form/case context.
    mayAcquireBusinessSourceData: false,
    mayAccessPersonalAccountData: false,
    mayUseCredentials: false,
    mayDeploy: false,
    mayUseProduction: false,
  };
};

export type AcquisitionAuthorityRequest = {
  inventoryId: string;
  sourceAcquisitionFormReference: string;
  personalConsentReference?: string;
  caseReference?: string;
};

export type AcquisitionAuthorityEvaluation = {
  authorized: boolean;
  blockers: string[];
  mayUseCredentials: false;
  mayDeploy: false;
  mayUseProduction: false;
};

export const evaluateAcquisitionAuthority = (
  contract: FinanceEngagementContract,
  request: AcquisitionAuthorityRequest,
): AcquisitionAuthorityEvaluation => {
  const blockers = [...evaluateGate0(contract).blockers];
  const item = contract.inventory.items.find(
    ({ inventoryId }) => inventoryId === request.inventoryId,
  );

  if (item === undefined) {
    blockers.push('request.inventoryId');
  } else if (item.scope !== 'IN_SCOPE') {
    blockers.push('request.inventoryScope');
  }

  if (contract.authorizations.sourceAcquisition.status !== 'APPROVED') {
    blockers.push('authorizations.sourceAcquisition.status');
  }
  if (
    !contract.authorizations.sourceAcquisition.formReferences.includes(
      request.sourceAcquisitionFormReference,
    )
  ) {
    blockers.push('request.sourceAcquisitionFormReference');
  }

  if (item?.sensitivity === 'RESTRICTED_PERSONAL') {
    if (contract.authorizations.personalData.status !== 'APPROVED') {
      blockers.push('authorizations.personalData.status');
    }
    if (!hasText(request.personalConsentReference)) {
      blockers.push('request.personalConsentReference');
    }
    if (!hasText(request.caseReference)) {
      blockers.push('request.caseReference');
    }

    const matchingConsent = contract.authorizations.personalData.consents.some(
      (consent) =>
        consent.inventoryId === request.inventoryId &&
        consent.consentReference === request.personalConsentReference &&
        consent.caseReference === request.caseReference,
    );
    if (!matchingConsent) {
      blockers.push('request.matchingPersonalConsent');
    }
  }

  return {
    authorized: blockers.length === 0,
    blockers,
    mayUseCredentials: false,
    mayDeploy: false,
    mayUseProduction: false,
  };
};

export type ProvenCompleteReceipt = {
  approvedEligibleGate0Revision: boolean;
  approvedExactSourceAcquisition: boolean;
  immutableOriginalsAndManifest: boolean;
  sourceBoundaryExhaustedAndControlled: boolean;
  zeroUnresolvedPopulationEffects: boolean;
  rowCountsAndAmountsReconciled: boolean;
  independentControlsAndContinuityPassed: boolean;
  noHiddenPartialOrMissingScope: boolean;
  reproducibleSnapshotRulesAndRun: boolean;
  authorizedReviewerApprovedWithoutExceptions: boolean;
};

export const isProvenComplete = (receipt: ProvenCompleteReceipt) =>
  Object.values(receipt).every((condition) => condition === true);
