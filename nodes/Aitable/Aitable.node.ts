import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Aitable API Integration for n8n (Unofficial)
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
		displayName: 'Aitable Unofficial',
		name: 'aitable',
		icon: 'file:aitable.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with Aitable.ai API (Unofficial Integration)',
		defaults: {
			name: 'Aitable Unofficial',
		},
		inputs: ['main'],
		outputs: ['main'],
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
						name: 'Create Record',
						value: 'createRecord',
						description: 'Create a new record in a datasheet with support for all field types including linked records',
						action: 'Create a new record in a datasheet with support for all field types including linked records',
					},
					{
						name: 'Delete Record',
						value: 'deleteRecord',
						description: 'Delete an existing record from a datasheet',
						action: 'Delete an existing record from a datasheet',
					},
					{
						name: 'Edit Record',
						value: 'editRecord',
						description: 'Update an existing record in a datasheet',
						action: 'Update an existing record in a datasheet',
					},
					{
						name: 'Search Nodes',
						value: 'searchNodes',
						description: 'Search for nodes (datasheets, folders, etc.) in a space',
						action: 'Search for nodes datasheets folders etc in a space',
					},
					{
						name: 'Search Records in Datasheet',
						value: 'searchNodesInDatasheet',
						description: 'Search and retrieve records from a specific datasheet (supports both simple search and formula filtering)',
						action: 'Search and retrieve records from a specific datasheet supports both simple search and formula filtering',
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
						name: 'Dashboard',
						value: 'Dashboard',
					},
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
				description: 'Maximum number of results to return (1-1000)',
				displayOptions: {
					show: {
						operation: [
							'searchNodesInDatasheet',
						],
					},
				},
			},
			// Datasheet ID Field - Required for createRecord operation
			{
				displayName: 'Datasheet ID',
				name: 'datasheetId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the datasheet to create a record in (e.g., dstXXXXXXXXXXX)',
				displayOptions: {
					show: {
						operation: [
							'createRecord',
						],
					},
				},
				placeholder: 'dstXXXXXXXXXXX',
				hint: 'You can find this in the URL when viewing a datasheet: https://aitable.ai/space/spcXXXX/datasheet/dst{DATASHEET_ID}/...'
			},
			// Use Field Names instead of IDs toggle
			{
				displayName: 'Use Field Names',
				name: 'useFieldNames',
				type: 'boolean',
				default: true,
				description: 'Whether to use field names instead of field IDs when creating a record (recommended)',
				displayOptions: {
					show: {
						operation: [
							'createRecord',
						],
					},
				},
			},
			// Fields to Create - Required for createRecord operation
			{
				displayName: 'Fields',
				name: 'fieldsUi',
				placeholder: 'Add Field',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: [
							'createRecord',
						],
					},
				},
				options: [
					{
						name: 'fieldValues',
						displayName: 'Field',
						values: [
							{
								displayName: 'Field Name or ID',
								name: 'fieldName',
								type: 'string',
								default: '',
								description: 'The name or ID of the field (e.g., "Title" or fldXXXXXXXXXXX)',
								placeholder: 'Title',
							},
							{
								displayName: 'Field Type',
								name: 'fieldType',
								type: 'options',
								options: [
									{
										name: 'Checkbox',
										value: 'checkbox',
									},
									{
										name: 'Date',
										value: 'date',
									},
									{
										name: 'Link (One-Way)',
										value: 'link',
									},
									{
										name: 'Link (Two-Way)',
										value: 'twoWayLink',
									},
									{
										name: 'MultiSelect',
										value: 'multiSelect',
									},
									{
										name: 'Number',
										value: 'number',
									},
									{
										name: 'Select',
										value: 'select',
									},
									{
										name: 'Text',
										value: 'text',
									},
								],
								default: 'text',
								description: 'The type of the field',
							},
							{
								displayName: 'Field Value',
								name: 'fieldValue',
								type: 'string',
								default: '',
								description: 'The value to set for the field. For linked fields, enter the record ID(s) separated by commas. To explicitly clear a linked field, type "null" (this will set an actual null value in the API call). Empty values will be ignored for security reasons.',
							},
						],
					},
				],
				default: {},
				description: 'Fields to set on the record',
			},
			// Fetch Fields - Optional for createRecord operation
			{
				displayName: 'Fetch Fields',
				name: 'fetchFields',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch the datasheet fields first to help with record creation',
				displayOptions: {
					show: {
						operation: [
							'createRecord',
						],
					},
				},
			},
			// Datasheet ID Field - Required for editRecord operation
			{
				displayName: 'Datasheet ID',
				name: 'datasheetId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the datasheet containing the record to edit (e.g., dstXXXXXXXXXXX)',
				displayOptions: {
					show: {
						operation: [
							'editRecord',
						],
					},
				},
				placeholder: 'dstXXXXXXXXXXX',
				hint: 'You can find this in the URL when viewing a datasheet: https://aitable.ai/space/spcXXXX/datasheet/dst{DATASHEET_ID}/...'
			},
			// Record ID Field - Required for editRecord operation
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the record to edit (e.g., recXXXXXXXXXXX)',
				displayOptions: {
					show: {
						operation: [
							'editRecord',
						],
					},
				},
				placeholder: 'recXXXXXXXXXXX',
			},
			// Use Field Names instead of IDs toggle for editRecord
			{
				displayName: 'Use Field Names',
				name: 'useFieldNames',
				type: 'boolean',
				default: true,
				description: 'Whether to use field names instead of field IDs when updating a record (recommended)',
				displayOptions: {
					show: {
						operation: [
							'editRecord',
						],
					},
				},
			},
			// Fields to Update - Required for editRecord operation
			{
				displayName: 'Fields',
				name: 'fieldsUi',
				placeholder: 'Add Field',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: [
							'editRecord',
						],
					},
				},
				options: [
					{
						name: 'fieldValues',
						displayName: 'Field',
						values: [
							{
								displayName: 'Field Name or ID',
								name: 'fieldName',
								type: 'string',
								default: '',
								description: 'The name or ID of the field (e.g., "Title" or fldXXXXXXXXXXX)',
								placeholder: 'Title',
							},
							{
								displayName: 'Field Type',
								name: 'fieldType',
								type: 'options',
								options: [
									{
										name: 'Checkbox',
										value: 'checkbox',
									},
									{
										name: 'Date',
										value: 'date',
									},
									{
										name: 'Link (One-Way)',
										value: 'link',
									},
									{
										name: 'Link (Two-Way)',
										value: 'twoWayLink',
									},
									{
										name: 'MultiSelect',
										value: 'multiSelect',
									},
									{
										name: 'Number',
										value: 'number',
									},
									{
										name: 'Select',
										value: 'select',
									},
									{
										name: 'Text',
										value: 'text',
									},
								],
								default: 'text',
								description: 'The type of the field',
							},
							{
								displayName: 'Field Value',
								name: 'fieldValue',
								type: 'string',
								default: '',
								description: 'The value to set for the field. For linked fields, enter the record ID(s) separated by commas. To explicitly clear a linked field, type "null" (this will set an actual null value in the API call). Empty values will be ignored for security reasons.',
							},
						],
					},
				],
				default: {},
				description: 'Fields to update on the record',
			},
			// Fetch Fields - Optional for editRecord operation
			{
				displayName: 'Fetch Fields',
				name: 'fetchFields',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch the datasheet fields first to help with record updates',
				displayOptions: {
					show: {
						operation: [
							'editRecord',
						],
					},
				},
			},
			// Datasheet ID for deleteRecord operation
			{
				displayName: 'Datasheet ID',
				name: 'datasheetId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the datasheet to delete the record from (e.g., dstXXXXXXXXXXXX)',
				displayOptions: {
					show: {
						operation: [
							'deleteRecord',
						],
					},
				},
			},
			// Record ID Field for deleteRecord operation
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the record to delete (e.g., recXXXXXXXXXXXX)',
				displayOptions: {
					show: {
						operation: [
							'deleteRecord',
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
				} else if (operation === 'createRecord') {
					// Get parameters specific to createRecord operation
					const datasheetId = this.getNodeParameter('datasheetId', itemIndex) as string;
					
					// Validate datasheetId
					if (!datasheetId) {
						throw new NodeOperationError(this.getNode(), 'Datasheet ID is required', { itemIndex });
					}

					const useFieldNames = this.getNodeParameter('useFieldNames', itemIndex, true) as boolean;
					const fetchFields = this.getNodeParameter('fetchFields', itemIndex, false) as boolean;
					const fieldsUi = this.getNodeParameter('fieldsUi', itemIndex, {}) as {
						fieldValues?: Array<{
							fieldName: string;
							fieldType: string;
							fieldValue: string;
						}>;
					};
					
					// Prepare record object and field mappings
					const fields: Record<string, any> = {};
					let fieldMetadata: Record<string, any> = {};
					let nameToIdMap: Record<string, string> = {};
					
					// Fetch field metadata if requested
					if (fetchFields) {
						try {
							const metadataEndpoint = `/fusion/v1/datasheets/${datasheetId}/fields`;
							
							this.logger.info('Fetching field metadata from Aitable API');
							
							const metadataResponse = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'aitableApi',
								{
									method: 'GET',
									url: metadataEndpoint,
									baseURL: 'https://aitable.ai',
									headers: {
										'Content-Type': 'application/json',
									},
								},
							);
							
							if (metadataResponse.success === true && metadataResponse.data && metadataResponse.data.fields) {
								// Process field metadata
								fieldMetadata = metadataResponse.data.fields.reduce((acc: Record<string, any>, field: any) => {
									acc[field.id] = field;
									return acc;
								}, {});
								
								// Create mapping from field names to field IDs
								nameToIdMap = metadataResponse.data.fields.reduce((acc: Record<string, string>, field: any) => {
									acc[field.name.toLowerCase()] = field.id;
									return acc;
								}, {});
								
								this.logger.info(`Successfully fetched metadata for ${Object.keys(fieldMetadata).length} fields`);
							}
						} catch (error) {
							this.logger.error('Error fetching field metadata: ' + error.message);
							// Continue without metadata, but warn the user
							throw new NodeOperationError(
								this.getNode(),
								`Failed to fetch field metadata: ${error.message}. Disable "Fetch Fields" or check your connection to Aitable.`,
								{ itemIndex }
							);
						}
					}
					
					// Process field values from UI
					if (fieldsUi.fieldValues && fieldsUi.fieldValues.length > 0) {
						for (const field of fieldsUi.fieldValues) {
							const { fieldName, fieldType, fieldValue } = field;
							
							if (!fieldName) {
								continue; // Skip if no field name is provided
							}
							
							// Determine field key (name or ID based on useFieldNames)
							let fieldKey = fieldName;
							
							// If using field names but we have a name->ID mapping from fetched metadata, use it
							if (!useFieldNames || (fetchFields && nameToIdMap[fieldName.toLowerCase()])) {
								if (fetchFields && nameToIdMap[fieldName.toLowerCase()]) {
									// If we fetched metadata and found a matching field name, use its ID
									fieldKey = nameToIdMap[fieldName.toLowerCase()];
								}
								// Otherwise, assume fieldName is already an ID
							}
							
							// Process field based on type
							let processedValue;
							switch (fieldType) {
								case 'text':
									processedValue = fieldValue;
									break;
								case 'number':
									processedValue = fieldValue === '' ? null : Number(fieldValue);
									break;
								case 'checkbox':
									processedValue = fieldValue.toLowerCase() === 'true';
									break;
								case 'select':
									processedValue = fieldValue;
									break;
								case 'multiSelect':
									processedValue = fieldValue.split(',').map(option => option.trim()).filter(Boolean);
									break;
								case 'date':
									// If the value looks like a timestamp, use it as is
									if (/^\d+$/.test(fieldValue)) {
										processedValue = Number(fieldValue);
									} else {
										// Otherwise, treat it as an ISO string
										processedValue = fieldValue;
									}
									break;
								case 'link':
								case 'twoWayLink':
									// For linked records, handle null vs populated vs empty
									if (fieldValue.toLowerCase() === 'null') {
										// Use an actual null value, not a string
										processedValue = null;
									} else if (fieldValue === '') {
										// For empty strings, skip this field entirely
										// This prevents accidental clearing from automation
										continue;
									} else {
										// For linked records, we need an array of record IDs
										processedValue = fieldValue.split(',').map(id => id.trim()).filter(Boolean);
									}
									break;
								default:
									processedValue = fieldValue;
							}
							
							fields[fieldKey] = processedValue;
						}
					}
					
					// Create the record
					try {
						const recordsEndpoint = `/fusion/v1/datasheets/${datasheetId}/records`;
						const recordsData: Record<string, any> = {
							records: [
								{
									fields,
								},
							],
						};
						
						// If using field names, specify fieldKey as "name"
						if (useFieldNames) {
							recordsData.fieldKey = 'name';
						}
						
						const recordsResponse = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'aitableApi',
							{
								method: 'POST',
								url: recordsEndpoint,
								baseURL: 'https://aitable.ai',
								headers: {
									'Content-Type': 'application/json',
								},
								body: recordsData,
							},
						);
						
						if (recordsResponse.success === true && recordsResponse.data && recordsResponse.data.records) {
							// Return the created record
							const createdRecord = recordsResponse.data.records[0];
							returnData.push({
								json: {
									...createdRecord,
									datasheetId,
								},
								pairedItem: itemIndex,
							});
						} else {
							// If no record was created or there was an issue with the response
							returnData.push({
								json: {
									success: false,
									message: 'Record creation failed or error occurred',
									response: recordsResponse,
								},
								pairedItem: itemIndex,
							});
						}
					} catch (error) {
						this.logger.error('Error creating record: ' + error.message);
						
						if (this.continueOnFail()) {
							returnData.push({
								json: {
									success: false,
									message: `Error creating record: ${error.message}`,
									datasheetId,
								},
								pairedItem: itemIndex,
							});
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`Error creating record in datasheet ${datasheetId}: ${error.message}`,
								{ itemIndex }
							);
						}
					}
				} else if (operation === 'editRecord') {
					// Get parameters specific to editRecord operation
					const datasheetId = this.getNodeParameter('datasheetId', itemIndex) as string;
					const recordId = this.getNodeParameter('recordId', itemIndex) as string;
					const useFieldNames = this.getNodeParameter('useFieldNames', itemIndex, true) as boolean;
					const fetchFields = this.getNodeParameter('fetchFields', itemIndex, false) as boolean;
					const fieldsUi = this.getNodeParameter('fieldsUi', itemIndex, {}) as {
						fieldValues?: Array<{
							fieldName: string;
							fieldType: string;
							fieldValue: string;
						}>;
					};
					
					// Prepare record object and field mappings
					const fields: Record<string, any> = {};
					let fieldMetadata: Record<string, any> = {};
					let nameToIdMap: Record<string, string> = {};
					
					// Fetch field metadata if requested
					if (fetchFields) {
						try {
							const metadataEndpoint = `/fusion/v1/datasheets/${datasheetId}/fields`;
							
							this.logger.info('Fetching field metadata from Aitable API');
							
							const metadataResponse = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'aitableApi',
								{
									method: 'GET',
									url: metadataEndpoint,
									baseURL: 'https://aitable.ai',
									headers: {
										'Content-Type': 'application/json',
									},
								},
							);
							
							if (metadataResponse.success === true && metadataResponse.data && metadataResponse.data.fields) {
								// Process field metadata
								fieldMetadata = metadataResponse.data.fields.reduce((acc: Record<string, any>, field: any) => {
									acc[field.id] = field;
									return acc;
								}, {});
								
								// Create mapping from field names to field IDs
								nameToIdMap = metadataResponse.data.fields.reduce((acc: Record<string, string>, field: any) => {
									acc[field.name.toLowerCase()] = field.id;
									return acc;
								}, {});
								
								this.logger.info(`Successfully fetched metadata for ${Object.keys(fieldMetadata).length} fields`);
							}
						} catch (error) {
							this.logger.error('Error fetching field metadata: ' + error.message);
							// Continue without metadata, but warn the user
							throw new NodeOperationError(
								this.getNode(),
								`Failed to fetch field metadata: ${error.message}. Disable "Fetch Fields" or check your connection to Aitable.`,
								{ itemIndex }
							);
						}
					}
					
					// Process field values from UI
					if (fieldsUi.fieldValues && fieldsUi.fieldValues.length > 0) {
						for (const field of fieldsUi.fieldValues) {
							const { fieldName, fieldType, fieldValue } = field;
							
							if (!fieldName) {
								continue; // Skip if no field name is provided
							}
							
							// Determine field key (name or ID based on useFieldNames)
							let fieldKey = fieldName;
							
							// If using field names but we have a name->ID mapping from fetched metadata, use it
							if (!useFieldNames || (fetchFields && nameToIdMap[fieldName.toLowerCase()])) {
								if (fetchFields && nameToIdMap[fieldName.toLowerCase()]) {
									// If we fetched metadata and found a matching field name, use its ID
									fieldKey = nameToIdMap[fieldName.toLowerCase()];
								}
								// Otherwise, assume fieldName is already an ID
							}
							
							// Process field based on type
							let processedValue;
							switch (fieldType) {
								case 'text':
									processedValue = fieldValue;
									break;
								case 'number':
									processedValue = fieldValue === '' ? null : Number(fieldValue);
									break;
								case 'checkbox':
									processedValue = fieldValue.toLowerCase() === 'true';
									break;
								case 'select':
									processedValue = fieldValue;
									break;
								case 'multiSelect':
									processedValue = fieldValue.split(',').map(option => option.trim()).filter(Boolean);
									break;
								case 'date':
									// If the value looks like a timestamp, use it as is
									if (/^\d+$/.test(fieldValue)) {
										processedValue = Number(fieldValue);
									} else {
										// Otherwise, treat it as an ISO string
										processedValue = fieldValue;
									}
									break;
								case 'link':
								case 'twoWayLink':
									// For linked records, handle null vs populated vs empty
									if (fieldValue.toLowerCase() === 'null') {
										// Use an actual null value, not a string
										processedValue = null;
									} else if (fieldValue === '') {
										// For empty strings, skip this field entirely
										// This prevents accidental clearing from automation
										continue;
									} else {
										// For linked records, we need an array of record IDs
										processedValue = fieldValue.split(',').map(id => id.trim()).filter(Boolean);
									}
									break;
								default:
									processedValue = fieldValue;
							}
							
							fields[fieldKey] = processedValue;
						}
					}
					
					// Create the record
					try {
						const recordsEndpoint = `/fusion/v1/datasheets/${datasheetId}/records`;
						const recordsData: Record<string, any> = {
							records: [
								{
									recordId,
									fields,
								},
							],
						};
						
						// If using field names, specify fieldKey as "name"
						if (useFieldNames) {
							recordsData.fieldKey = 'name';
						}
						
						const recordsResponse = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'aitableApi',
							{
								method: 'PATCH',
								url: recordsEndpoint,
								baseURL: 'https://aitable.ai',
								headers: {
									'Content-Type': 'application/json',
								},
								body: recordsData,
							},
						);
						
						if (recordsResponse.success === true && recordsResponse.data && recordsResponse.data.records) {
							// Return the updated record
							const updatedRecord = recordsResponse.data.records[0];
							returnData.push({
								json: {
									...updatedRecord,
									datasheetId,
								},
								pairedItem: itemIndex,
							});
						} else {
							// If no record was updated or there was an issue with the response
							returnData.push({
								json: {
									success: false,
									message: 'Record update failed or error occurred',
									response: recordsResponse,
								},
								pairedItem: itemIndex,
							});
						}
					} catch (error) {
						this.logger.error('Error updating record: ' + error.message);
						
						if (this.continueOnFail()) {
							returnData.push({
								json: {
									success: false,
									message: `Error updating record: ${error.message}`,
									datasheetId,
								},
								pairedItem: itemIndex,
							});
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`Error updating record in datasheet ${datasheetId}: ${error.message}`,
								{ itemIndex }
							);
						}
					}
				} else if (operation === 'deleteRecord') {
					// Get parameters specific to deleteRecord operation
					const datasheetId = this.getNodeParameter('datasheetId', itemIndex) as string;
					const recordId = this.getNodeParameter('recordId', itemIndex) as string;
					
					// Validate datasheetId and recordId
					if (!datasheetId) {
						throw new NodeOperationError(this.getNode(), 'Datasheet ID is required', { itemIndex });
					}
					
					if (!recordId) {
						throw new NodeOperationError(this.getNode(), 'Record ID is required', { itemIndex });
					}
					
					// Delete the record
					try {
						const recordsEndpoint = `/fusion/v1/datasheets/${datasheetId}/records`;
						
						// Use query parameters instead of body for record IDs
						const recordsResponse = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'aitableApi',
							{
								method: 'DELETE',
								url: recordsEndpoint,
								baseURL: 'https://aitable.ai',
								headers: {
									'Content-Type': 'application/json',
								},
								qs: {
									recordIds: recordId,
								},
							},
						);
						
						if (recordsResponse.success === true) {
							// Return success response
							returnData.push({
								json: {
									success: true,
									message: 'Record deleted successfully',
									recordId,
									datasheetId,
									response: recordsResponse,
								},
								pairedItem: itemIndex,
							});
						} else {
							// If record deletion failed or there was an issue with the response
							returnData.push({
								json: {
									success: false,
									message: 'Record deletion failed or error occurred',
									response: recordsResponse,
								},
								pairedItem: itemIndex,
							});
						}
					} catch (error) {
						this.logger.error('Error deleting record: ' + error.message);
						
						if (this.continueOnFail()) {
							returnData.push({
								json: {
									success: false,
									message: `Error deleting record: ${error.message}`,
									recordId,
									datasheetId,
								},
								pairedItem: itemIndex,
							});
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`Error deleting record from datasheet ${datasheetId}: ${error.message}`,
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
