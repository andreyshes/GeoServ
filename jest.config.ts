import type { Config } from "jest";

const config: Config = {
	testEnvironment: "jsdom",
	transform: {
		"^.+\\.(t|j)sx?$": "babel-jest",
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
		"\\.(css|scss|sass)$": "identity-obj-proxy",
	},
	transformIgnorePatterns: [
		"node_modules/(?!(@react-email|lucide-react|framer-motion|shadcn-ui)/)",
	],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
	testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default config;
