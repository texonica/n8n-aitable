import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

/**
 * Aitable API Integration for n8n
 * 
 * Note on searchNodesInDatasheet operation:
 * This operation fetches records from a specified datasheet directly using the
 * /datasheets/{datasheetId}/records endpoint and performs filtering based on the search term.
 * The search is performed locally on the retrieved records, matching the search term against
 * string field values.
 */
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
					{
						name: 'Search Records in Datasheet',
						value: 'searchNodesInDatasheet',
						description: 'Search and retrieve records from a specific datasheet (supports both simple search and formula filtering)',
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
			// DatasheetId Field - Required for searchNodesInDatasheet operation
			{
				displayName: 'Datasheet ID',
				name: 'datasheetId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the datasheet to search records in (e.g., dstXXXXXXXXXXX)',
				displayOptions: {
					show: {
						operation: [
							'searchNodesInDatasheet',
						],
					},
				},
				placeholder: 'dstXXXXXXXXXXX',
				hint: 'You can find this in the URL when viewing a datasheet: https://aitable.ai/space/spcXXXX/datasheet/dst{DATASHEET_ID}/...'
			},
			// Search Term Field - Optional for searchNodesInDatasheet operation
			{
				displayName: 'Simple Search',
				name: 'searchTerm',
				type: 'string',
				default: '',
				required: false,
				description: 'Simple term to search for within the datasheet records (leave empty to retrieve all records)',
				displayOptions: {
					show: {
						operation: [
							'searchNodesInDatasheet',
						],
					},
				},
				placeholder: 'Example: project name',
			},
			// Filter By Formula Field - Optional for searchNodesInDatasheet operation
			{
				displayName: 'Filter By Formula',
				name: 'filterByFormula',
				type: 'string',
				default: '',
				required: false,
				description: 'Use Aitable formula syntax for advanced filtering (e.g., {Name}="Project X")',
				displayOptions: {
					show: {
						operation: [
							'searchNodesInDatasheet',
						],
					},
				},
				placeholder: 'Example: {Name}="Project X" or OR(find("Keyword", {Description}) > 0)',
			},
			// Columns to Search Field - Optional for searchNodesInDatasheet operation
			{
				displayName: 'Columns to Search',
				name: 'columnsToSearch',
				type: 'string',
				default: '',
				required: false,
				description: 'Comma-separated list of column IDs to search within. Leave empty to search all columns.',
				displayOptions: {
					show: {
						operation: [
							'searchNodesInDatasheet',
						],
					},
				},
			},
			// Maximum Results Field - Optional for searchNodesInDatasheet operation
			{
				displayName: 'Maximum Results',
				name: 'maxResults',
				type: 'number',
				default: 100,
				required: false,
				description: 'Maximum number of results to return (1-1000)',
				displayOptions: {
					show: {
						operation: [
							'searchNodesInDatasheet',
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
					// Updated endpoint to match Aitable API structure
					const endpoint = `/fusion/v1/spaces/${spaceId}/nodes`;
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'aitableApi',
						{
							method: 'GET',
							url: endpoint,
							baseURL: 'https://aitable.ai',
							qs: queryParams,
							headers: {
								'Content-Type': 'application/json',
							},
						},
					);

					// Process response for searchNodes operation
					if (response.success === true && response.data && response.data.nodes) {
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
				} else if (operation === 'searchNodesInDatasheet') {
					// Get parameters specific to searchNodesInDatasheet operation
					const datasheetId = this.getNodeParameter('datasheetId', itemIndex) as string;
					
					// Validate datasheetId
					if (!datasheetId) {
						throw new NodeOperationError(this.getNode(), 'Datasheet ID is required', { itemIndex });
					}
					
					const searchTerm = this.getNodeParameter('searchTerm', itemIndex) as string;
					const filterByFormula = this.getNodeParameter('filterByFormula', itemIndex) as string;
					const columnsToSearch = this.getNodeParameter('columnsToSearch', itemIndex, '') as string;
					const maxResults = this.getNodeParameter('maxResults', itemIndex, 100) as number;

					// Go directly to fetching records from the datasheet
					try {
						// Get the datasheet records
						const recordsEndpoint = `/fusion/v1/datasheets/${datasheetId}/records`;
						const recordsParams: any = {};
						
						if (columnsToSearch) {
							recordsParams.fieldIds = columnsToSearch;
						}
						
						if (maxResults) {
							recordsParams.pageSize = maxResults;
						}
						
						// Use filterByFormula for advanced filtering if provided
						if (filterByFormula) {
							recordsParams.filterByFormula = filterByFormula;
						}
						
						const recordsResponse = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'aitableApi',
							{
								method: 'GET',
								url: recordsEndpoint,
								baseURL: 'https://aitable.ai',
								qs: recordsParams,
								headers: {
									'Content-Type': 'application/json',
								},
							},
						);
						
						if (recordsResponse.success === true && recordsResponse.data && recordsResponse.data.records) {
							// Get the records from the response
							let records = recordsResponse.data.records;
							
							// If simple search term is provided, filter records locally that contain the search term
							if (searchTerm) {
								records = records.filter((record: any) => {
									// Check if any field value contains the search term
									for (const fieldKey in record.fields) {
										const fieldValue = record.fields[fieldKey];
										if (typeof fieldValue === 'string' && 
											fieldValue.toLowerCase().includes(searchTerm.toLowerCase())) {
											return true;
										}
									}
									return false;
								});
							}
							
							for (const record of records) {
								returnData.push({
									json: {
										...record,
										datasheetId,
									},
									pairedItem: itemIndex,
								});
							}
						} else {
							// If no records were found or there was an issue with the response
							returnData.push({
								json: {
									success: false,
									message: 'No records found in datasheet or error occurred',
									response: recordsResponse,
								},
								pairedItem: itemIndex,
							});
						}
					} catch (error) {
						// Handle any errors during the records fetch
						this.logger.error('Error fetching records: ' + error.message);
						
						if (this.continueOnFail()) {
							returnData.push({
								json: {
									success: false,
									message: `Error fetching records: ${error.message}`,
									datasheetId,
								},
								pairedItem: itemIndex,
							});
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`Error fetching records from datasheet ${datasheetId}: ${error.message}`,
								{ itemIndex }
							);
						}
					}
				}
			} catch (error) {
				// Get the operation value to include in error messages
				let operationName = '';
				try {
					operationName = this.getNodeParameter('operation', itemIndex) as string;
				} catch (e) {
					// If we can't get the operation, just use a generic error message
				}
				
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							operation: operationName,
							errorDetails: error.response ? error.response.data : undefined,
							statusCode: error.statusCode || error.response?.status || 'unknown',
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
						description: `Error during ${operationName} operation. Check API endpoint and authentication.`,
					});
				}
			}
		}

		return [returnData];
	}
}
