import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

var jwt = require('jsonwebtoken');

export class AppStoreJWTNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AppStore JWT Node',
		name: 'appStoreJWTNode',
		icon: 'fa:fingerprint',
		group: ['transform'],
		version: 1,
		description: 'Generate JWT Token for AppStore Connect',
		defaults: {
			name: 'AppStore JWT Node',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'appStoreJWTSecret',
				required: true,
			},
		],
		properties: [],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('appStoreJWTSecret');
		let audience = credentials.audience as string;
		let apiKey = credentials.apiKey as string;
		let issuerId = credentials.issuerId as string;
		let privateKey = credentials.privateKey;
	
	
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const tokenExpiresInSeconds = 1200
				const NOW = Math.round((new Date()).getTime() / 1000);
		
				const PAYLOAD = {
						'iss': issuerId,
						'iat': NOW,
						'exp': NOW + tokenExpiresInSeconds,
						'aud': audience
				};
		
				const SIGN_OPTS = {
						'algorithm': 'ES256',
						'header': {
								'alg': 'ES256',
								'kid': apiKey,
								'typ': 'JWT'
						}
				};
		
				const bearerToken = jwt.sign(
						PAYLOAD,
						privateKey,
						SIGN_OPTS
				);
				
				returnData.push({
					json: {
						token: bearerToken,
					},
					pairedItem: itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
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

		return this.prepareOutputData(returnData);
	}
}
