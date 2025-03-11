import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class Aitable implements INodeType {
	constructor() {
		// Initialize any necessary properties
	}
	description: INodeTypeDescription = {
		displayName: 'Aitable.ai',
		name: 'aitable',
		group: ['transform'],
		version: 1,
		description: 'Interact with Aitable.ai API',
		defaults: {
			name: 'Aitable',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'aitableApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Search Nodes',
						value: 'searchNodes',
						description: 'Search for nodes (datasheets, folders, etc.) in a space',
					},
				],
				default: 'searchNodes',
			},
			// Space ID Field
			{
				displayName: 'Space ID',
				name: 'spaceId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the space (e.g., spcX9P2xUcKst)',
			},
			// Node Type Field - Shows when Search Nodes operation is selected
			{
				displayName: 'Node Type',
				name: 'nodeType',
				type: 'options',
				options: [
					{
						name: 'Datasheet',
						value: 'Datasheet',
					},
					{
						name: 'Folder',
						value: 'Folder',
					},
					{
						name: 'Form',
						value: 'Form',
					},
					{
						name: 'Dashboard',
						value: 'Dashboard',
					},
					{
						name: 'Mirror',
						value: 'Mirror',
					},
				],
				default: 'Datasheet',
				description: 'Type of node to search for',
				displayOptions: {
					show: {
						operation: [
							'searchNodes',
						],
					},
				},
			},
			// Query Field - Optional filter for Search Nodes
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				required: false,
				description: 'Search nodes by name - partial matches supported',
				displayOptions: {
					show: {
						operation: [
							'searchNodes',
						],
					},
				},
			},
			// Permissions Field - Optional filter for Search Nodes
			{
				displayName: 'Permissions',
				name: 'permissions',
				type: 'multiOptions',
				options: [
					{
						name: 'Manager (0)',
						value: '0',
						description: 'Full management permissions',
					},
					{
						name: 'Editor (1)',
						value: '1',
						description: 'Can edit but not manage',
					},
					{
						name: 'Update-only (2)',
						value: '2',
						description: 'Can add and edit records but not delete',
					},
					{
						name: 'Read-only (3)',
						value: '3',
						description: 'Can only view data',
					},
				],
				default: ['0', '1', '2', '3'],
				description: 'Filter nodes by permission levels',
				displayOptions: {
					show: {
						operation: [
							'searchNodes',
						],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// For each input item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const spaceId = this.getNodeParameter('spaceId', itemIndex) as string;

				if (operation === 'searchNodes') {
					// Get parameters specific to searchNodes operation
					const nodeType = this.getNodeParameter('nodeType', itemIndex) as string;
					const query = this.getNodeParameter('query', itemIndex, '') as string;
					const permissionsArray = this.getNodeParameter('permissions', itemIndex, []) as string[];
					
					// Build the permissions query parameter
					let permissionsParam = '';
					if (permissionsArray.length > 0) {
						permissionsParam = permissionsArray.join(',');
					}

					// Prepare query parameters
					const queryParams: {
						type?: string;
						query?: string;
						permissions?: string;
					} = {
						type: nodeType,
					};

					if (query) {
						queryParams.query = query;
					}

					if (permissionsParam) {
						queryParams.permissions = permissionsParam;
					}

					// Make API request to search nodes
					const endpoint = `/fusion/v2/spaces/${spaceId}/nodes`;
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'aitableApi',
						{
							method: 'GET',
							url: endpoint,
							baseURL: 'https://aitable.ai',
							qs: queryParams,
						},
					);

					// Process response
					if (response.success && response.data && response.data.nodes) {
						const responseData = response.data.nodes;
						
						// Return data for each node found
						for (const node of responseData) {
							returnData.push({
								json: node,
								pairedItem: itemIndex,
							});
						}
					} else {
						// If no nodes were found or there was an issue with the response
						returnData.push({
							json: {
								success: false,
								message: 'No data returned or error occurred',
								response,
							},
							pairedItem: itemIndex,
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: itemIndex,
					});
				} else {
					// Add more context to the error
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}
