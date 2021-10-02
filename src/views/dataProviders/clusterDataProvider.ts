import { fluxTools } from '../../flux/fluxTools';
import { kubernetesTools } from '../../kubernetes/kubernetesTools';
import { statusBar } from '../../statusBar';
import { ClusterDeploymentNode } from '../nodes/clusterDeploymentNode';
import { ClusterNode } from '../nodes/clusterNode';
import { refreshClusterTreeView } from '../treeViews';
import { DataProvider } from './dataProvider';

/**
 * Defines Clusters data provider for loading configured kubernetes clusters
 * and contexts in GitOps Clusters tree view.
 */
export class ClusterDataProvider extends DataProvider {

	/**
   * Creates Clusters tree view items from local kubernetes config.
   * @returns Cluster tree view items to display.
   */
	async buildTree(): Promise<ClusterNode[]> {
		// load configured kubernetes clusters
		const clusters = await kubernetesTools.getClusters();
		if (!clusters) {
			return [];
		}
		const treeItems: ClusterNode[] = [];
		let currentContextTreeItem: ClusterNode | undefined;
		const currentContext = (await kubernetesTools.getCurrentContext()) || '';
		for (const cluster of clusters) {
			const clusterNode = new ClusterNode(cluster);
			if (cluster.name === currentContext) {
				clusterNode.isCurrent = true;
				currentContextTreeItem = clusterNode;
				clusterNode.makeCollapsible();
				// load flux system deployments
				const fluxDeployments = await kubernetesTools.getFluxDeployments();
				if (fluxDeployments) {
					clusterNode.expand();
					for (const deployment of fluxDeployments.items) {
						clusterNode.addChild(new ClusterDeploymentNode(deployment));
					}
				}
			}
			treeItems.push(clusterNode);
		}

		// Update async status of the deployments (flux commands take a while to run)
		this.updateDeploymentStatus(currentContextTreeItem);

		statusBar.hide();
		return treeItems;
	}

	/**
	 * Update deployment status for flux controllers.
	 * Get status from running flux commands instead of kubectl.
	 */
	async updateDeploymentStatus(clusterNode?: ClusterNode) {
		if (!clusterNode) {
			return;
		}
		const fluxCheckResult = await fluxTools.check();
		if (!fluxCheckResult) {
			return;
		}

		// Match controllers fetched with flux with controllers
		// fetched with kubectl and update tree nodes.
		for (const clusterController of (clusterNode.children as ClusterDeploymentNode[])) {
			for (const controller of fluxCheckResult.controllers) {
				const clusterControllerName = clusterController.resource.metadata.name?.trim();
				const deploymentName = controller.name.trim();

				if (clusterControllerName === deploymentName) {
					clusterController.description = controller.status;
					if (controller.success) {
						clusterController.setStatus('success');
					} else {
						clusterController.setStatus('failure');
					}
				}
			}
			refreshClusterTreeView(clusterController);
		}
	}
}
