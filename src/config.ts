export interface HulyConfig {
	url: string;
	token?: string;
	email?: string;
	password?: string;
	workspace: string;
}

export function loadConfig(): HulyConfig {
	const url = process.env.HULY_URL ?? "https://huly.app";
	const workspace = process.env.HULY_WORKSPACE ?? "";
	const token = process.env.HULY_TOKEN;
	const email = process.env.HULY_EMAIL;
	const password = process.env.HULY_PASSWORD;

	if (!workspace) {
		throw new Error(
			"HULY_WORKSPACE environment variable is required. " +
				'Set it to your workspace identifier (e.g., "my-company").',
		);
	}

	if (!token && (!email || !password)) {
		throw new Error(
			"Either HULY_TOKEN or both HULY_EMAIL and HULY_PASSWORD must be set.",
		);
	}

	return {
		url,
		workspace,
		...(token ? { token } : { email, password }),
	};
}
