#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
WORKFLOW="$REPOSITORY_ROOT/.github/workflows/publish-twenty-v2.30.1-candidate-6.yml"
PUBLISHER="$REPOSITORY_ROOT/scripts/provenance/publish-oci-layout.sh"
PROOF="$REPOSITORY_ROOT/scripts/provenance/test-candidate-6-oci-publication.sh"

command -v actionlint >/dev/null 2>&1 || { echo 'Candidate 6 workflow validation failed: actionlint is required' >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo 'Candidate 6 workflow validation failed: python3 with PyYAML is required' >&2; exit 1; }
[[ -x "$PUBLISHER" && -x "$PROOF" ]] || { echo 'Candidate 6 workflow validation failed: OCI publisher and disposable proof must be executable' >&2; exit 1; }

if [[ "${1:-}" != --self-test ]]; then
  actionlint "$WORKFLOW"
fi

python3 - "$WORKFLOW" "$PUBLISHER" "$PROOF" "${1:-}" <<'PY'
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

def validate(text, publisher, proof):
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
    publish_step = next((step for step in steps if step.get('name') == 'Publish OCI layout by canonical digest and read it back'), None)
    if not isinstance(publish_step, dict) or publish_step.get('env', {}).get('GITHUB_TOKEN') != '${{ github.token }}':
        raise ContractError('registry publication must explicitly bind GITHUB_TOKEN from the GitHub token context')
    if 'scripts/provenance/publish-oci-layout.sh' not in publish_step.get('run', ''):
        raise ContractError('registry publication must use the source-faithful OCI graph publisher')
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
        r'git ls-remote --tags', r'scripts/provenance/publish-oci-layout\.sh',
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
    publisher_required = [
        'require_environment REGISTRY_API OCI_LAYOUT BUILD_CLAIMED_DIGEST IMAGE_REPOSITORY GITHUB_ACTOR GITHUB_TOKEN',
        'OCI_PUBLICATION_TEST_OMIT_MANIFEST_DIGEST:-}',
        'collect_manifest()', 'upload_blob()', 'publish_manifest()', 'verify_manifest_graph()',
        'manifests_postorder', 'blobs/uploads/', '/manifests/$digest', 'referenced manifest ${digest} read-back is indeterminate',
        'registry digest authorities disagree for ${digest}',
    ]
    if any(item not in publisher for item in publisher_required):
        raise ContractError('OCI publisher omits fail-closed token binding or recursive descriptor publication')
    if re.search(r'\b(?:docker\s+buildx\s+build\s+--push|docker\s+manifest\s+inspect)\b', publisher):
        raise ContractError('OCI publisher contains forbidden check-then-act registry publication')
    proof_required = [
        'OCI_PUBLICATION_TEST_MODE=1', 'bound-disposable-token', 'manifest_digests',
        'body does not match its descriptor digest', 'missing child-manifest publication unexpectedly passed',
        'bound token path did not reach the first registry request',
    ]
    if any(item not in proof for item in proof_required):
        raise ContractError('disposable OCI proof is incomplete')
    if any(field not in code for field in REQUIRED_RECEIPT_FIELDS):
        raise ContractError('final receipt omits required custody fields')
    if 'upload-evidence.outputs.artifact-id' not in text or 'upload-evidence.outputs.artifact-digest' not in text:
        raise ContractError('final receipt does not bind the uploaded evidence artifact')
    return 'Candidate 6 workflow structural contract passed'

def expect_rejected(label, fixture, reason, publisher, proof):
    try:
        validate(fixture, publisher, proof)
    except ContractError as error:
        if reason not in str(error):
            raise SystemExit(f'self-test {label} rejected for unexpected reason: {error}')
    else:
        raise SystemExit(f'self-test {label} unexpectedly passed')

path, publisher_path, proof_path, mode = sys.argv[1:]
text = open(path, encoding='utf-8').read()
publisher = open(publisher_path, encoding='utf-8').read()
proof = open(proof_path, encoding='utf-8').read()
if mode == '--self-test':
    expect_rejected('duplicate top-level on', text.replace('on:\n', 'on:\n  workflow_dispatch:\non:\n', 1), 'duplicate key: on', publisher, proof)
    expect_rejected('unauthorized push', text.replace('workflow_dispatch:', 'push:\n    branches: [main]', 1), 'workflow must expose only', publisher, proof)
    expect_rejected('comment only command', text.replace('          scripts/provenance/verify-source.sh', '          # scripts/provenance/verify-source.sh', 1), 'missing executable', publisher, proof)
    injection = '          if ! docker manifest inspect "$IMAGE_REF"; then echo absent; fi\n'
    expect_rejected('old nonzero absent', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'check-then-act', publisher, proof)
    injection = '          if curl returns 401 then proceed publication\n'
    expect_rejected('401 proceeds', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'registry failure path', publisher, proof)
    injection = '          docker buildx build --push --tag ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-6 .\n'
    expect_rejected('fixed tag push', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'check-then-act', publisher, proof)
    expect_rejected('mutable OCI tag', text.replace('  IMAGE_REPOSITORY:', '  IMAGE_TAG: ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-6\n  IMAGE_REPOSITORY:', 1), 'digest-only', publisher, proof)
    swapped = text.replace('      - name: Upload raw evidence bundle', '      - name: TEMPORARY\n', 1).replace('      - name: Create final receipt after evidence upload', '      - name: Upload raw evidence bundle', 1).replace('      - name: TEMPORARY', '      - name: Create final receipt after evidence upload', 1)
    expect_rejected('unsafe receipt order', swapped, 'unsafe order', publisher, proof)
    injection = '          cosign sign "$IMAGE_REF"\n'
    expect_rejected('unverified cosign', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'unverified cosign', publisher, proof)
    expect_rejected('missing recursive readback', text, 'OCI publisher omits', publisher.replace('referenced manifest ${digest} read-back is indeterminate', 'missing recursive readback', 1), proof)
    expect_rejected('missing tagger receipt field', text.replace('--arg taggerName', '--arg missingTaggerName', 1), 'final receipt omits', publisher, proof)
    expect_rejected('unpinned action', text.replace('actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5', 'actions/checkout@v4', 1), 'immutable-SHA', publisher, proof)
    expect_rejected('unbound token', text.replace('          GITHUB_TOKEN: ${{ github.token }}\n', '', 1), 'explicitly bind GITHUB_TOKEN', publisher, proof)
print(validate(text, publisher, proof))
PY
