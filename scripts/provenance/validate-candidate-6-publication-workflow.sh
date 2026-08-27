#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
WORKFLOW="$REPOSITORY_ROOT/.github/workflows/publish-twenty-v2.30.1-candidate-6.yml"

command -v actionlint >/dev/null 2>&1 || { echo 'Candidate 6 workflow validation failed: actionlint is required' >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo 'Candidate 6 workflow validation failed: python3 with PyYAML is required' >&2; exit 1; }

if [[ "${1:-}" != --self-test ]]; then
  actionlint "$WORKFLOW"
fi

python3 - "$WORKFLOW" "${1:-}" <<'PY'
import copy
import re
import sys

try:
    import yaml
except ImportError as error:
    raise SystemExit(f"Candidate 6 workflow validation failed: PyYAML is required: {error}")

class ContractError(Exception):
    pass

class UniqueLoader(yaml.SafeLoader):
    pass

# YAML 1.1 would silently coerce GitHub's `on` key to True. Keep it a string.
UniqueLoader.yaml_implicit_resolvers = copy.deepcopy(yaml.SafeLoader.yaml_implicit_resolvers)
for initial, resolvers in list(UniqueLoader.yaml_implicit_resolvers.items()):
    UniqueLoader.yaml_implicit_resolvers[initial] = [item for item in resolvers if item[0] != 'tag:yaml.org,2002:bool']

def unique_mapping(loader, node, deep=False):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in mapping:
            raise ContractError(f"duplicate key: {key}")
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping

UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)

EXPECTED_ENV = {
    'CANDIDATE_NUMBER': '6',
    'CANDIDATE_SOURCE_TAG': 'mhoo/candidate/v2.30.1-6',
    'EXPECTED_REPOSITORY': 'mhoo-os/mhoo-twenty',
    'EXPECTED_SOURCE_REVISION': '08d55ab7ed4bbc4e72fee825822c3ce0656c82ef',
    'EXPECTED_SOURCE_TREE': '8d7b43fe941bc648a35bb486642d0d532013e5ae',
    'EXPECTED_UPSTREAM_TAG': 'twenty/v2.30.1',
    'EXPECTED_UPSTREAM_COMMIT': '064bdd795a0bd78c65f024350cefed2c8f38a661',
    'EXPECTED_UPSTREAM_TREE': '7ebc5efa7f5f1bfdf9d238a88e3455decaa4f313',
    'IMAGE_REPOSITORY': 'ghcr.io/mhoo-os/mhoo-twenty',
}
EXPECTED_PERMISSIONS = {'contents': 'read', 'id-token': 'write', 'packages': 'write'}
ORDER = [
    'Resolve and verify immutable Candidate 6 source tag',
    'Verify exact source and controlled overlay',
    'Build Candidate 6 once as an OCI layout',
    'Publish OCI layout by canonical digest and read it back',
    'Sign the authoritative digest with GitHub OIDC',
    'Verify the digest-bound keyless signature',
    'Create and validate raw evidence bundle',
    'Upload raw evidence bundle',
    'Create final receipt after evidence upload',
    'Validate final receipt structurally',
    'Upload final custody receipt',
]
REQUIRED_RECEIPT_FIELDS = [
    '--arg workflowBlob', '--arg taggerName', '--arg taggerEmail', '--arg taggerTimestamp',
    '--arg annotationSha256', '--arg buildxDigest', '--arg cosignRelease', '--arg cosignSha256', '--arg cosignDownload', '--arg runnerOs', '--arg runnerArch',
    '--arg evidenceId', '--arg evidenceDigest', 'registryReadback',
]

def load(text):
    try:
        document = yaml.load(text, Loader=UniqueLoader)
    except ContractError:
        raise
    except yaml.YAMLError as error:
        raise ContractError(f"invalid YAML: {error}")
    if not isinstance(document, dict):
        raise ContractError('workflow must be a mapping')
    return document

def executable_lines(run):
    return [line.split('#', 1)[0].rstrip() for line in run.splitlines() if line.split('#', 1)[0].strip()]

def validate(text):
    doc = load(text)
    if set(doc) != {'name', 'on', 'permissions', 'env', 'jobs'}:
        raise ContractError('workflow has an unexpected top-level surface')
    if doc['on'] != {'workflow_dispatch': None}:
        raise ContractError('workflow must expose only input-free workflow_dispatch')
    if doc['permissions'] != EXPECTED_PERMISSIONS:
        raise ContractError('workflow permissions are not exactly contents:read, id-token:write, packages:write')
    env = doc['env']
    if not isinstance(env, dict) or any(str(env.get(key)) != value for key, value in EXPECTED_ENV.items()):
        raise ContractError('workflow identity environment is incomplete or incorrect')
    if 'IMAGE_TAG' in env or any('candidate-6' in str(value) and 'ghcr.io' in str(value) and '@sha256:' not in str(value) for value in env.values()):
        raise ContractError('digest-only design forbids a mutable Candidate 6 OCI tag')
    jobs = doc['jobs']
    if set(jobs) != {'publish'} or not isinstance(jobs['publish'], dict):
        raise ContractError('workflow must contain exactly the publish job')
    steps = jobs['publish'].get('steps')
    if not isinstance(steps, list):
        raise ContractError('publish job must have ordered steps')
    names = [step.get('name') for step in steps if isinstance(step, dict)]
    positions = []
    for required in ORDER:
        if required not in names:
            raise ContractError(f'missing ordered custody step: {required}')
        positions.append(names.index(required))
    if positions != sorted(positions):
        raise ContractError('custody steps are in an unsafe order')
    if names[-1] != 'Upload final custody receipt':
        raise ContractError('final receipt upload must be the final custody operation')
    runs = []
    for step in steps:
        if not isinstance(step, dict):
            raise ContractError('workflow step must be a mapping')
        if 'uses' in step:
            action = step['uses']
            if not isinstance(action, str) or not re.fullmatch(r'[^@\s]+@[0-9a-f]{40}', action.split()[0]):
                raise ContractError('third-party action is not immutable-SHA pinned')
        if 'run' in step:
            if not isinstance(step['run'], str):
                raise ContractError('run must be a string')
            runs.extend(executable_lines(step['run']))
    code = '\n'.join(runs)
    required_commands = [
        r'^\s*scripts/provenance/verify-source\.sh\s*$',
        r'git ls-remote --tags', r'authenticated_curl',
        r'--request PUT', r'Docker-Content-Digest|docker-content-digest',
        r'rawBodySha256', r'"\$COSIGN_PATH" sign', r'"\$COSIGN_PATH" verify',
    ]
    for pattern in required_commands:
        if not re.search(pattern, code, re.MULTILINE):
            raise ContractError(f'missing executable custody command: {pattern}')
    if 'OUTPUT_MODE: oci' not in text:
        raise ContractError('build must export an OCI layout, not a registry tag')
    if re.search(r'\bdocker\s+(manifest|buildx imagetools)\s+inspect\b|(?<!\S)--push(?!\S)|(?<!\S)--tag(?!\S)', code):
        raise ContractError('check-then-act or mutable-tag publication is forbidden')
    if re.search(r'\bcosign\s+(sign|verify)\b', code):
        raise ContractError('unverified cosign selected from PATH')
    if re.search(r'if\s+.*(?:docker|curl).*\b(?:401|403|429|5\d\d|nonzero)\b.*(?:continue|proceed|publish)', code, re.I):
        raise ContractError('registry failure path proceeds instead of failing closed')
    if 'status="$(status_from' not in code or '[[ "$read_status" == 200 ]]' not in code:
        raise ContractError('registry helper does not classify authenticated responses fail-closed')
    if 'registry digest authorities disagree' not in code:
        raise ContractError('authoritative registry digest read-back is absent')
    if any(field not in code for field in REQUIRED_RECEIPT_FIELDS):
        raise ContractError('final receipt omits required custody fields')
    if 'upload-evidence.outputs.artifact-id' not in text or 'upload-evidence.outputs.artifact-digest' not in text:
        raise ContractError('final receipt does not bind the uploaded evidence artifact')
    return 'Candidate 6 workflow structural contract passed'

def expect_rejected(label, fixture, reason):
    try:
        validate(fixture)
    except ContractError as error:
        if reason not in str(error):
            raise SystemExit(f'self-test {label} rejected for unexpected reason: {error}')
    else:
        raise SystemExit(f'self-test {label} unexpectedly passed')

path, mode = sys.argv[1:]
text = open(path, encoding='utf-8').read()
if mode == '--self-test':
    expect_rejected('duplicate top-level on', text.replace('on:\n', 'on:\n  workflow_dispatch:\non:\n', 1), 'duplicate key: on')
    expect_rejected('unauthorized push', text.replace('workflow_dispatch:', 'push:\n    branches: [main]', 1), 'workflow must expose only')
    expect_rejected('comment only command', text.replace('          scripts/provenance/verify-source.sh', '          # scripts/provenance/verify-source.sh', 1), 'missing executable')
    injection = '          if ! docker manifest inspect "$IMAGE_REF"; then echo absent; fi\n'
    expect_rejected('old nonzero absent', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'check-then-act')
    injection = '          if curl returns 401 then proceed publication\n'
    expect_rejected('401 proceeds', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'registry failure path')
    injection = '          docker buildx build --push --tag ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-6 .\n'
    expect_rejected('fixed tag push', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'check-then-act')
    expect_rejected('mutable OCI tag', text.replace('  IMAGE_REPOSITORY:', '  IMAGE_TAG: ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-6\n  IMAGE_REPOSITORY:', 1), 'digest-only')
    swapped = text.replace('      - name: Upload raw evidence bundle', '      - name: TEMPORARY\n', 1).replace('      - name: Create final receipt after evidence upload', '      - name: Upload raw evidence bundle', 1).replace('      - name: TEMPORARY', '      - name: Create final receipt after evidence upload', 1)
    expect_rejected('unsafe receipt order', swapped, 'unsafe order')
    injection = '          cosign sign "$IMAGE_REF"\n'
    expect_rejected('unverified cosign', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'unverified cosign')
    expect_rejected('missing readback', text.replace('registry digest authorities disagree', 'digest check', 1), 'authoritative registry')
    expect_rejected('missing tagger receipt field', text.replace('--arg taggerName', '--arg missingTaggerName', 1), 'final receipt omits')
    expect_rejected('unpinned action', text.replace('actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5', 'actions/checkout@v4', 1), 'immutable-SHA')
print(validate(text))
PY
