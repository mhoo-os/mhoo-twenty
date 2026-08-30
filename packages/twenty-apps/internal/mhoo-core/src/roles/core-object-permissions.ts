import {
  EVALUATION_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CORE_OBJECT_UNIVERSAL_IDENTIFIERS = [
  SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
  HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
  HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
  EVALUATION_UNIVERSAL_IDENTIFIER,
];

export const READ_CORE_OBJECT_PERMISSIONS =
  CORE_OBJECT_UNIVERSAL_IDENTIFIERS.map((objectUniversalIdentifier) => ({
    objectUniversalIdentifier,
    canReadObjectRecords: true,
    canUpdateObjectRecords: false,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  }));

export const WRITE_CORE_OBJECT_PERMISSIONS =
  CORE_OBJECT_UNIVERSAL_IDENTIFIERS.map((objectUniversalIdentifier) => ({
    objectUniversalIdentifier,
    canReadObjectRecords: true,
    canUpdateObjectRecords: true,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  }));

export const SYSTEM_MACHINE_OBJECT_PERMISSIONS = [
  {
    objectUniversalIdentifier: SYSTEM_COMPONENT_UNIVERSAL_IDENTIFIER,
    canReadObjectRecords: true,
    canUpdateObjectRecords: true,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  },
  {
    objectUniversalIdentifier: HEALTH_CHECK_UNIVERSAL_IDENTIFIER,
    canReadObjectRecords: true,
    canUpdateObjectRecords: false,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  },
  {
    objectUniversalIdentifier: HEALTH_OBSERVATION_UNIVERSAL_IDENTIFIER,
    canReadObjectRecords: true,
    canUpdateObjectRecords: true,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  },
  {
    objectUniversalIdentifier: EVALUATION_UNIVERSAL_IDENTIFIER,
    canReadObjectRecords: true,
    canUpdateObjectRecords: true,
    canSoftDeleteObjectRecords: false,
    canDestroyObjectRecords: false,
  },
];
