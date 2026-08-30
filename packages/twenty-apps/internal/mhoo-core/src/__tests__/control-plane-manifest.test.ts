import { describe, expect, it } from 'vitest';

import evaluationsNavigationMenuItem from 'src/navigation-menu-items/evaluations.navigation-menu-item';
import healthChecksNavigationMenuItem from 'src/navigation-menu-items/health-checks.navigation-menu-item';
import needsAttentionNavigationMenuItem from 'src/navigation-menu-items/needs-attention.navigation-menu-item';
import systemOverviewNavigationMenuItem from 'src/navigation-menu-items/system-overview.navigation-menu-item';
import evaluation from 'src/objects/evaluation.object';
import healthCheck from 'src/objects/health-check.object';
import healthObservation from 'src/objects/health-observation.object';
import systemComponent from 'src/objects/system-component.object';
import defaultRole from 'src/default-role';
import mhooObserverRole from 'src/roles/mhoo-observer.role';
import mhooOperatorRole from 'src/roles/mhoo-operator.role';
import systemMachineRole from 'src/roles/system-machine.role';
import evaluationsView from 'src/views/evaluations.view';
import needsAttentionView from 'src/views/needs-attention.view';
import systemOverviewView from 'src/views/system-overview.view';

describe('Mhoo Core control-plane manifest', () => {
  it('defines the bounded system-health model', () => {
    const objects = [
      systemComponent,
      healthCheck,
      healthObservation,
      evaluation,
    ];

    expect(objects.every((definition) => definition.success)).toBe(true);
    expect(objects.map((definition) => definition.config.nameSingular)).toEqual([
      'systemComponent',
      'healthCheck',
      'healthObservation',
      'evaluation',
    ]);
  });

  it('keeps roles least-privilege and non-destructive', () => {
    const roles = [
      defaultRole,
      mhooOperatorRole,
      mhooObserverRole,
      systemMachineRole,
    ];

    expect(roles.every((definition) => definition.success)).toBe(true);
    expect(
      roles.every(
        (definition) =>
          definition.config.canSoftDeleteAllObjectRecords === false &&
          definition.config.canDestroyAllObjectRecords === false,
      ),
    ).toBe(true);
    expect(systemMachineRole.config.canBeAssignedToApiKeys).toBe(true);
    expect(systemMachineRole.config.canBeAssignedToUsers).toBe(false);
  });

  it('ships reachable operator views', () => {
    const views = [systemOverviewView, needsAttentionView, evaluationsView];
    const navigationItems = [
      systemOverviewNavigationMenuItem,
      needsAttentionNavigationMenuItem,
      healthChecksNavigationMenuItem,
      evaluationsNavigationMenuItem,
    ];

    expect(views.every((definition) => definition.success)).toBe(true);
    expect(navigationItems.every((definition) => definition.success)).toBe(
      true,
    );
    expect(needsAttentionView.config.filters?.[0]?.value).toEqual([
      'DEGRADED',
      'FAILED',
    ]);
  });
});
