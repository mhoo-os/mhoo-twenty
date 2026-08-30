import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';

import { USAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import type { GlobalUsage, UsageWindow, WorkspaceUsage } from 'src/types/usage';

const theme = {
  background: 'var(--t-background-primary)',
  surface: 'var(--t-background-secondary)',
  border: 'var(--t-border-color-light)',
  text: 'var(--t-font-color-primary)',
  muted: 'var(--t-font-color-tertiary)',
  accent: 'var(--t-accent-accent4060)',
  danger: 'var(--t-color-red)',
  radius: 'var(--t-border-radius-md)',
  font: 'var(--t-font-family)',
} as const;

const styles: Record<string, CSSProperties> = {
  root: {
    background: theme.background,
    color: theme.text,
    fontFamily: theme.font,
    minHeight: '100%',
    padding: 20,
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 650, margin: 0 },
  subtitle: { color: theme.muted, fontSize: 13, margin: '5px 0 0' },
  windowGroup: {
    display: 'flex',
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: 2,
    flexShrink: 0,
  },
  windowButton: {
    appearance: 'none',
    border: 0,
    borderRadius: 6,
    padding: '7px 10px',
    background: 'transparent',
    color: theme.muted,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))',
    gap: 10,
    marginBottom: 18,
  },
  card: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius,
    padding: 14,
  },
  cardLabel: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: 650,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  cardValue: { fontSize: 21, fontWeight: 650, marginTop: 7 },
  panel: {
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius,
    overflow: 'hidden',
    background: theme.background,
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '11px 12px',
    textAlign: 'right',
    color: theme.muted,
    borderBottom: `1px solid ${theme.border}`,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  td: {
    padding: '12px',
    textAlign: 'right',
    borderBottom: `1px solid ${theme.border}`,
    fontVariantNumeric: 'tabular-nums',
  },
  workspaceCell: { textAlign: 'left', minWidth: 160 },
  workspaceName: { fontWeight: 600 },
  workspaceMeta: { color: theme.muted, fontSize: 11, marginTop: 3 },
  models: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 7,
  },
  modelChip: {
    border: `1px solid ${theme.border}`,
    borderRadius: 999,
    padding: '2px 6px',
    color: theme.muted,
    fontSize: 10,
  },
  state: {
    minHeight: 240,
    display: 'grid',
    placeItems: 'center',
    color: theme.muted,
    textAlign: 'center',
    padding: 24,
  },
  retry: {
    appearance: 'none',
    background: theme.accent,
    color: '#fff',
    border: 0,
    borderRadius: 7,
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: 12,
  },
  footer: { color: theme.muted, fontSize: 11, marginTop: 10 },
};

const formatInteger = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const compactNumber = (value: number): string => {
  if (value < 1_000) return formatInteger.format(value);
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
};

const formatDate = (value: string | null): string => {
  if (value === null) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Unknown' : date.toLocaleString();
};

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div style={styles.card}>
    <div style={styles.cardLabel}>{label}</div>
    <div style={styles.cardValue}>{value}</div>
  </div>
);

const WorkspaceRow = ({ workspace }: { workspace: WorkspaceUsage }) => {
  const totalTokens = workspace.inputTokens + workspace.outputTokens;
  return (
    <tr>
      <td style={{ ...styles.td, ...styles.workspaceCell }}>
        <div style={styles.workspaceName}>{workspace.workspaceName}</div>
        <div style={styles.workspaceMeta}>
          {workspace.isActive ? 'Active key' : 'Inactive key'} · Last used{' '}
          {formatDate(workspace.lastUsedAt)}
        </div>
        {workspace.models.length > 0 && (
          <div style={styles.models}>
            {workspace.models.slice(0, 4).map((model) => (
              <span key={model.model} style={styles.modelChip}>
                {model.model}
              </span>
            ))}
            {workspace.models.length > 4 && (
              <span style={styles.modelChip}>+{workspace.models.length - 4}</span>
            )}
          </div>
        )}
      </td>
      <td style={styles.td}>{formatInteger.format(workspace.requestCount)}</td>
      <td style={styles.td}>{compactNumber(totalTokens)}</td>
      <td style={styles.td}>{compactNumber(workspace.cachedInputTokens)}</td>
      <td style={styles.td}>{formatInteger.format(workspace.errorCount)}</td>
      <td style={styles.td}>{formatCurrency.format(workspace.totalCostUsd)}</td>
    </tr>
  );
};

export const UsageDashboard = () => {
  const [window, setWindow] = useState<UsageWindow>('7d');
  const [usage, setUsage] = useState<GlobalUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await new RestApiClient().get<GlobalUsage>(
        `/s/codex-lb/usage?window=${window}`,
      );
      setUsage(result);
    } catch {
      setError('Usage could not be loaded. Check the App bridge configuration.');
    } finally {
      setLoading(false);
    }
  }, [window]);

  useEffect(() => {
    void load();
  }, [load]);

  const tokenTotal = useMemo(
    () => (usage ? usage.totals.inputTokens + usage.totals.outputTokens : 0),
    [usage],
  );

  return (
    <main style={styles.root}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Codex LB usage</h1>
          <p style={styles.subtitle}>
            Aggregate spend and traffic across bound Twenty Workspaces.
          </p>
        </div>
        <div style={styles.windowGroup} aria-label="Usage window">
          {(['1d', '7d', '30d'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setWindow(item)}
              style={{
                ...styles.windowButton,
                ...(window === item
                  ? { background: theme.surface, color: theme.text }
                  : {}),
              }}
              aria-pressed={window === item}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      {loading && usage === null ? (
        <div style={styles.state}>Loading aggregate usage…</div>
      ) : error ? (
        <div style={styles.state}>
          <div>
            <div>{error}</div>
            <button type="button" onClick={() => void load()} style={styles.retry}>
              Retry
            </button>
          </div>
        </div>
      ) : usage ? (
        <>
          <section style={styles.cards} aria-label="Usage totals">
            <MetricCard
              label="Requests"
              value={formatInteger.format(usage.totals.requestCount)}
            />
            <MetricCard label="Tokens" value={compactNumber(tokenTotal)} />
            <MetricCard
              label="Cost"
              value={formatCurrency.format(usage.totals.totalCostUsd)}
            />
            <MetricCard
              label="Errors"
              value={formatInteger.format(usage.totals.errorCount)}
            />
          </section>

          <section style={styles.panel} aria-label="Workspace usage">
            {usage.workspaces.length === 0 ? (
              <div style={styles.state}>
                No Codex-LB keys are bound to Twenty Workspaces yet.
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, textAlign: 'left' }}>Workspace</th>
                      <th style={styles.th}>Requests</th>
                      <th style={styles.th}>Tokens</th>
                      <th style={styles.th}>Cached</th>
                      <th style={styles.th}>Errors</th>
                      <th style={styles.th}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.workspaces.map((workspace) => (
                      <WorkspaceRow
                        key={workspace.workspaceId}
                        workspace={workspace}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <div style={styles.footer}>
            Updated {formatDate(usage.generatedAt)} · Read-only · Owner access
          </div>
        </>
      ) : null}
    </main>
  );
};

export default defineFrontComponent({
  universalIdentifier: USAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'Codex LB global usage',
  description: 'Owner-only cross-Workspace Codex usage dashboard.',
  component: UsageDashboard,
});
