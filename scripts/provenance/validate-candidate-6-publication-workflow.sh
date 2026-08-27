#!/usr/bin/env bash

set -euo pipefail

REPOSITORY_ROOT="$(git rev-parse --show-toplevel)"
WORKFLOW="$REPOSITORY_ROOT/.github/workflows/publish-twenty-v2.30.1-candidate-6.yml"
PUBLISHER="$REPOSITORY_ROOT/scripts/provenance/publish-oci-layout.sh"
PROOF="$REPOSITORY_ROOT/scripts/provenance/test-candidate-6-oci-publication.sh"
AUTH_HARNESS="$REPOSITORY_ROOT/scripts/provenance/test-candidate-6-oci-auth-harness.py"

command -v actionlint >/dev/null 2>&1 || { echo 'Candidate 6 workflow validation failed: actionlint is required' >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo 'Candidate 6 workflow validation failed: python3 with PyYAML is required' >&2; exit 1; }
[[ -x "$PUBLISHER" && -x "$PROOF" && -f "$AUTH_HARNESS" ]] || { echo 'Candidate 6 workflow validation failed: OCI publisher, authentication harness, and disposable proof must be present' >&2; exit 1; }

if [[ "${1:-}" != --self-test ]]; then
  actionlint "$WORKFLOW"
fi

python3 - "$WORKFLOW" "$PUBLISHER" "$PROOF" "$AUTH_HARNESS" "${1:-}" <<'PY'
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
    'Authenticate the exact-digest validation and signature client',
    'Publish OCI layout by canonical digest and read it back',
    'Pull the authoritative digest for runtime validation',
    'Validate the authoritative digest',
    'Obtain and verify Cosign executable',
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

def validate(text, publisher, proof, auth_harness):
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
    login_steps = [
        step for step in steps
        if isinstance(step, dict) and str(step.get('uses', '')).startswith('docker/login-action@')
    ]
    if len(login_steps) != 1:
        raise ContractError('workflow must contain exactly one docker/login-action step')
    login_step = login_steps[0]
    if login_step.get('name') != 'Authenticate the exact-digest validation and signature client':
        raise ContractError('docker/login-action step has an unexpected name')
    if login_step.get('uses') != 'docker/login-action@5e57cd118135c172c3672efd75eb46360885c0ef':
        raise ContractError('docker/login-action must use the required immutable SHA')
    if login_step.get('with') != {
        'registry': 'ghcr.io',
        'username': '${{ github.actor }}',
        'password': '${{ github.token }}',
    }:
        raise ContractError('docker/login-action inputs must be the exact GHCR GitHub-token binding')
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
    pull_step = next((step for step in steps if step.get('name') == 'Pull the authoritative digest for runtime validation'), None)
    if not isinstance(pull_step, dict):
        raise ContractError('workflow must pull the authoritative digest before validation')
    if pull_step.get('env') != {'IMAGE_REF': '${{ steps.registry.outputs.image_ref }}'}:
        raise ContractError('authoritative digest pull source must be exactly the registry step output')
    if pull_step.get('shell') != 'bash':
        raise ContractError('authoritative digest pull must use bash')
    pull_lines = executable_lines(pull_step.get('run', ''))
    expected_digest_assertion = '[[ "$IMAGE_REF" =~ ^ghcr\\.io/mhoo-os/mhoo-twenty@sha256:[0-9a-f]{64}$ ]]'
    if expected_digest_assertion not in pull_lines:
        raise ContractError('authoritative digest pull must assert the exact digest format before pulling')
    if 'docker pull --platform linux/amd64 "$IMAGE_REF"' not in pull_lines:
        raise ContractError('authoritative digest pull must use the exact digest reference and linux/amd64 platform')
    if 'docker image inspect "$IMAGE_REF" >/dev/null' not in pull_lines:
        raise ContractError('authoritative digest pull must locally inspect the loaded exact image')
    if pull_lines.index(expected_digest_assertion) > pull_lines.index('docker pull --platform linux/amd64 "$IMAGE_REF"'):
        raise ContractError('authoritative digest format assertion must precede the pull')
    all_pull_lines = [line for step in steps if isinstance(step, dict) and isinstance(step.get('run'), str) for line in executable_lines(step['run']) if re.match(r'^\s*docker\s+pull\b', line)]
    if all_pull_lines != ['docker pull --platform linux/amd64 "$IMAGE_REF"']:
        raise ContractError('workflow must contain only the exact authoritative digest pull')
    login_index = names.index('Authenticate the exact-digest validation and signature client')
    publish_index = names.index('Publish OCI layout by canonical digest and read it back')
    pull_index = names.index('Pull the authoritative digest for runtime validation')
    validation_index = names.index('Validate the authoritative digest')
    signing_index = names.index('Sign the authoritative digest with GitHub OIDC')
    verification_index = names.index('Verify the digest-bound keyless signature')
    if not (login_index < publish_index < pull_index < validation_index < signing_index < verification_index):
        raise ContractError('registry login, publication, pull, validation, signing, and verification are in an unsafe order')
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
        "GHCR_TOKEN_ENDPOINT='https://ghcr.io/token'", "GHCR_TOKEN_SERVICE='ghcr.io'", "GHCR_TOKEN_SCOPE='repository:mhoo-os/mhoo-twenty:pull,push'",
        'test-only token overrides are forbidden outside disposable proof', 'test token endpoint is not loopback scoped and exact',
        'obtain_scoped_bearer_token()', '--data-urlencode "service=${TOKEN_SERVICE}"', '--data-urlencode "scope=${TOKEN_SCOPE}"',
        '--user "${GITHUB_ACTOR}:${GITHUB_TOKEN}"', 'Authorization: Bearer ${SCOPED_BEARER_TOKEN}',
        'token service response is malformed, missing, or ambiguous', 'token service response is indeterminate',
        'OCI_PUBLICATION_TEST_OMIT_MANIFEST_DIGEST:-}',
        'collect_manifest()', 'upload_blob()', 'publish_manifest()', 'verify_manifest_graph()',
        'manifests_postorder', 'blobs/uploads/', '/manifests/$digest', 'referenced manifest ${digest} read-back is indeterminate',
        'registry digest authorities disagree for ${digest}',
    ]
    if any(item not in publisher for item in publisher_required):
        raise ContractError('OCI publisher omits fixed Bearer exchange, fail-closed token binding, or recursive descriptor publication')
    if re.search(r'\b(?:docker\s+buildx\s+build\s+--push|docker\s+manifest\s+inspect)\b', publisher):
        raise ContractError('OCI publisher contains forbidden check-then-act registry publication')
    if '--location' in publisher or len(re.findall(r'--user\s+"\$\{GITHUB_ACTOR\}:\$\{GITHUB_TOKEN\}"', publisher)) != 1:
        raise ContractError('OCI publisher does not confine Basic credentials to one non-redirecting token exchange')
    if re.search(r'--user[^\n]*(?:REGISTRY_API|blobs/uploads|/manifests/)', publisher):
        raise ContractError('OCI publisher sends Basic credentials to the registry')
    if publisher.find('obtain_scoped_bearer_token\n\nupload_blob()') == -1:
        raise ContractError('OCI publisher does not obtain a scoped Bearer token before registry operations')
    proof_required = [
        'OCI_PUBLICATION_TEST_MODE=1', 'bound-disposable-token', 'candidate-6-disposable-bearer', 'manifest_digests',
        'body does not match its descriptor digest', 'missing child-manifest publication unexpectedly passed',
        'bound token path did not reach the first registry request', 'Basic credentials were not rejected by the registry challenge',
        'incorrect Bearer token was not rejected by the registry challenge', 'missing Bearer token was not rejected by the registry challenge',
        'Bearer credentials were not rejected by the token endpoint', 'publisher did not send valid Bearer credentials to every registry operation',
    ]
    if any(item not in proof for item in proof_required):
        raise ContractError('loopback challenge-auth disposable OCI proof is incomplete')
    harness_required = [
        'WWW-Authenticate', 'endpoint="token"', 'endpoint="registry"', 'authorization == expected_basic',
        'authorization == f"Bearer {bearer_token}"', 'any(query == {"service": [args.service], "scope": [scope]} for scope in args.scope)',
        'Credential values intentionally never enter the captured proof log.',
    ]
    if any(item not in auth_harness for item in harness_required):
        raise ContractError('loopback authentication harness is incomplete')
    if any(field not in code for field in REQUIRED_RECEIPT_FIELDS):
        raise ContractError('final receipt omits required custody fields')
    if 'upload-evidence.outputs.artifact-id' not in text or 'upload-evidence.outputs.artifact-digest' not in text:
        raise ContractError('final receipt does not bind the uploaded evidence artifact')
    return 'Candidate 6 workflow structural contract passed'

def expect_rejected(label, fixture, reason, publisher, proof, auth_harness):
    try:
        validate(fixture, publisher, proof, auth_harness)
    except ContractError as error:
        if reason not in str(error):
            raise SystemExit(f'self-test {label} rejected for unexpected reason: {error}')
    else:
        raise SystemExit(f'self-test {label} unexpectedly passed')

path, publisher_path, proof_path, harness_path, mode = sys.argv[1:]
text = open(path, encoding='utf-8').read()
publisher = open(publisher_path, encoding='utf-8').read()
proof = open(proof_path, encoding='utf-8').read()
auth_harness = open(harness_path, encoding='utf-8').read()
if mode == '--self-test':
    expect_rejected('duplicate top-level on', text.replace('on:\n', 'on:\n  workflow_dispatch:\non:\n', 1), 'duplicate key: on', publisher, proof, auth_harness)
    expect_rejected('unauthorized push', text.replace('workflow_dispatch:', 'push:\n    branches: [main]', 1), 'workflow must expose only', publisher, proof, auth_harness)
    expect_rejected('comment only command', text.replace('          scripts/provenance/verify-source.sh', '          # scripts/provenance/verify-source.sh', 1), 'missing executable', publisher, proof, auth_harness)
    injection = '          if ! docker manifest inspect "$IMAGE_REF"; then echo absent; fi\n'
    expect_rejected('old nonzero absent', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'check-then-act', publisher, proof, auth_harness)
    injection = '          if curl returns 401 then proceed publication\n'
    expect_rejected('401 proceeds', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'registry failure path', publisher, proof, auth_harness)
    injection = '          docker buildx build --push --tag ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-6 .\n'
    expect_rejected('fixed tag push', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'check-then-act', publisher, proof, auth_harness)
    expect_rejected('mutable OCI tag', text.replace('  IMAGE_REPOSITORY:', '  IMAGE_TAG: ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-6\n  IMAGE_REPOSITORY:', 1), 'digest-only', publisher, proof, auth_harness)
    swapped = text.replace('      - name: Upload raw evidence bundle', '      - name: TEMPORARY\n', 1).replace('      - name: Create final receipt after evidence upload', '      - name: Upload raw evidence bundle', 1).replace('      - name: TEMPORARY', '      - name: Create final receipt after evidence upload', 1)
    expect_rejected('unsafe receipt order', swapped, 'unsafe order', publisher, proof, auth_harness)
    injection = '          cosign sign "$IMAGE_REF"\n'
    expect_rejected('unverified cosign', text.replace('          set -euo pipefail\n', '          set -euo pipefail\n' + injection, 1), 'unverified cosign', publisher, proof, auth_harness)
    expect_rejected('missing recursive readback', text, 'OCI publisher omits', publisher.replace('referenced manifest ${digest} read-back is indeterminate', 'missing recursive readback', 1), proof, auth_harness)
    expect_rejected('missing tagger receipt field', text.replace('--arg taggerName', '--arg missingTaggerName', 1), 'final receipt omits', publisher, proof, auth_harness)
    expect_rejected('unpinned action', text.replace('actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5', 'actions/checkout@v4', 1), 'immutable-SHA', publisher, proof, auth_harness)
    expect_rejected('unbound token', text.replace('          GITHUB_TOKEN: ${{ github.token }}\n', '', 1), 'explicitly bind GITHUB_TOKEN', publisher, proof, auth_harness)
    login_block = '''      - name: Authenticate the exact-digest validation and signature client
        uses: docker/login-action@5e57cd118135c172c3672efd75eb46360885c0ef # v3.4.0
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ github.token }}
'''
    expect_rejected('missing login', text.replace(login_block, '', 1), 'exactly one docker/login-action', publisher, proof, auth_harness)
    expect_rejected('unpinned login action', text.replace('docker/login-action@5e57cd118135c172c3672efd75eb46360885c0ef', 'docker/login-action@v3', 1), 'required immutable SHA', publisher, proof, auth_harness)
    expect_rejected('wrong login registry', text.replace('          registry: ghcr.io', '          registry: example.invalid', 1), 'exact GHCR GitHub-token binding', publisher, proof, auth_harness)
    expect_rejected('arbitrary login username', text.replace('          username: ${{ github.actor }}', '          username: arbitrary-user', 1), 'exact GHCR GitHub-token binding', publisher, proof, auth_harness)
    expect_rejected('arbitrary login password', text.replace('          password: ${{ github.token }}', '          password: arbitrary-password', 1), 'exact GHCR GitHub-token binding', publisher, proof, auth_harness)
    expect_rejected('PAT login password', text.replace('          password: ${{ github.token }}', '          password: ${{ secrets.GHCR_PAT }}', 1), 'exact GHCR GitHub-token binding', publisher, proof, auth_harness)
    expect_rejected('repository-secret login username', text.replace('          username: ${{ github.actor }}', '          username: ${{ secrets.REGISTRY_USERNAME }}', 1), 'exact GHCR GitHub-token binding', publisher, proof, auth_harness)
    pull_block = '''      - name: Pull the authoritative digest for runtime validation
        env:
          IMAGE_REF: ${{ steps.registry.outputs.image_ref }}
        shell: bash
        run: |
          set -euo pipefail
          [[ "$IMAGE_REF" =~ ^ghcr\\.io/mhoo-os/mhoo-twenty@sha256:[0-9a-f]{64}$ ]]
          docker pull --platform linux/amd64 "$IMAGE_REF"
          docker image inspect "$IMAGE_REF" >/dev/null
'''
    expect_rejected('missing exact-digest pull', text.replace(pull_block, '', 1), 'missing ordered custody step', publisher, proof, auth_harness)
    expect_rejected('pull by tag', text.replace('docker pull --platform linux/amd64 "$IMAGE_REF"', 'docker pull --platform linux/amd64 ghcr.io/mhoo-os/mhoo-twenty:v2.30.1-6', 1), 'exact digest reference and linux/amd64 platform', publisher, proof, auth_harness)
    swapped = text.replace('      - name: Publish OCI layout by canonical digest and read it back', '      - name: TEMPORARY', 1).replace('      - name: Pull the authoritative digest for runtime validation', '      - name: Publish OCI layout by canonical digest and read it back', 1).replace('      - name: TEMPORARY', '      - name: Pull the authoritative digest for runtime validation', 1)
    expect_rejected('pull before publication', swapped, 'unsafe order', publisher, proof, auth_harness)
    swapped = text.replace('      - name: Pull the authoritative digest for runtime validation', '      - name: TEMPORARY', 1).replace('      - name: Validate the authoritative digest', '      - name: Pull the authoritative digest for runtime validation', 1).replace('      - name: TEMPORARY', '      - name: Validate the authoritative digest', 1)
    expect_rejected('validation before pull', swapped, 'unsafe order', publisher, proof, auth_harness)
    swapped = text.replace('      - name: Validate the authoritative digest', '      - name: TEMPORARY', 1).replace('      - name: Sign the authoritative digest with GitHub OIDC', '      - name: Validate the authoritative digest', 1).replace('      - name: TEMPORARY', '      - name: Sign the authoritative digest with GitHub OIDC', 1)
    expect_rejected('signing before validation', swapped, 'unsafe order', publisher, proof, auth_harness)
    expect_rejected('pull from non-registry output', text.replace('${{ steps.registry.outputs.image_ref }}', '${{ steps.build.outputs.buildx_digest }}', 1), 'authoritative digest pull source', publisher, proof, auth_harness)
    expect_rejected('missing Bearer exchange', text, 'does not obtain a scoped Bearer token', publisher.replace('obtain_scoped_bearer_token\n\nupload_blob()', 'missing_bearer_exchange\n\nupload_blob()', 1), proof, auth_harness)
    expect_rejected('Basic credentials sent to registry', text, 'does not confine Basic credentials', publisher.replace('authenticated_curl() {', 'authenticated_curl() { curl --user "${GITHUB_ACTOR}:${GITHUB_TOKEN}" "$REGISTRY_API"; ', 1), proof, auth_harness)
    expect_rejected('arbitrary token endpoint', text, 'omits fixed Bearer exchange', publisher.replace("GHCR_TOKEN_ENDPOINT='https://ghcr.io/token'", "GHCR_TOKEN_ENDPOINT='https://invalid.example/token'", 1), proof, auth_harness)
    expect_rejected('arbitrary token service', text, 'omits fixed Bearer exchange', publisher.replace("GHCR_TOKEN_SERVICE='ghcr.io'", "GHCR_TOKEN_SERVICE='invalid.example'", 1), proof, auth_harness)
    expect_rejected('arbitrary token scope', text, 'omits fixed Bearer exchange', publisher.replace("GHCR_TOKEN_SCOPE='repository:mhoo-os/mhoo-twenty:pull,push'", "GHCR_TOKEN_SCOPE='repository:other:pull,push'", 1), proof, auth_harness)
    expect_rejected('empty or malformed token response', text, 'loopback challenge-auth', publisher, proof.replace('Bearer credentials were not rejected by the token endpoint', 'missing malformed-token response rejection', 1), auth_harness)
    expect_rejected('test override outside test mode', text, 'omits fixed Bearer exchange', publisher.replace('test-only token overrides are forbidden outside disposable proof', 'test-only token overrides are allowed outside disposable proof', 1), proof, auth_harness)
print(validate(text, publisher, proof, auth_harness))
PY
