import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AitableApi implements ICredentialType {
	name = 'aitableApi';
	displayName = 'Aitable API';
	documentationUrl = 'https://developers.aitable.ai/api/reference/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API Token for Aitable authentication. You can get your API Token from your Aitable account.',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{ "Bearer " + $credentials.apiToken }}',
			},
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://aitable.ai',
			url: '/fusion/v1/spaces',
			method: 'GET',
		},
	};
}