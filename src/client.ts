import type { ConnectOptions, PlatformClient } from "@hcengineering/api-client";
import { connect, NodeWebSocketFactory } from "@hcengineering/api-client";
import { loadConfig } from "./config.js";

let clientInstance: PlatformClient | null = null;
let clientPromise: Promise<PlatformClient> | null = null;

export async function getClient(): Promise<PlatformClient> {
	if (clientInstance) {
		return clientInstance;
	}
	if (clientPromise) {
		return clientPromise;
	}

	clientPromise = (async () => {
		const config = loadConfig();

		const options: ConnectOptions = {
			socketFactory: NodeWebSocketFactory,
			connectionTimeout: 30000,
			workspace: config.workspace,
			...(config.token ? { token: config.token } : getAuthConfig(config)),
		};

		clientInstance = await connect(config.url, options);
		clientPromise = null;
		return clientInstance;
	})();

	return clientPromise;
}

function getAuthConfig(config: {
	token?: string;
	email?: string;
	password?: string;
}): ConnectOptions {
	if (config.email && config.password) {
		return { email: config.email, password: config.password };
	}
	throw new Error("Either token or both email and password must be provided");
}

export async function closeClient(): Promise<void> {
	if (clientInstance) {
		await clientInstance.close();
		clientInstance = null;
	}
	clientPromise = null;
}
