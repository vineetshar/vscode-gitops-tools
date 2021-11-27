import { HelmRelease } from '../../kubernetes/helmRelease';
import { KubernetesObjectKinds } from '../../kubernetes/kubernetesTypes';
import { WorkloadNode } from './workloadNode';

/**
 * Defines Helm release tree view item for display in GitOps Workloads tree view.
 */
export class HelmReleaseNode extends WorkloadNode {

	contextValue = KubernetesObjectKinds.HelmRelease;

	/**
	 * Helm release kubernetes resource object
	 */
	resource: HelmRelease;

	/**
	 * Creates new helm release tree view item for display.
	 * @param helmRelease Helm release kubernetes object info.
	 */
	constructor(helmRelease: HelmRelease) {
		super(helmRelease.metadata?.name || '', helmRelease);

		this.description = KubernetesObjectKinds.HelmRelease;

		this.resource = helmRelease;

		this.makeCollapsible();

	}
}
