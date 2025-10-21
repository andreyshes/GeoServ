import "@testing-library/jest-dom";

// ✅ define TextEncoder/TextDecoder BEFORE anything else
import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// ✅ polyfill fetch APIs for the jsdom environment
import "whatwg-fetch";

const { Request, Response, Headers, fetch } = globalThis;
(global as any).Request = Request;
(global as any).Response = Response;
(global as any).Headers = Headers;
(global as any).fetch = fetch;

// ✅ mock Next.js Response
class MockNextResponse {
	body: any;
	status: number;

	constructor(body?: any, init?: { status?: number }) {
		this.body = body;
		this.status = init?.status ?? 200;
	}

	static json(data: any, init?: { status?: number }) {
		return new MockNextResponse(data, init);
	}

	async json() {
		return this.body;
	}

	async text() {
		return typeof this.body === "string"
			? this.body
			: JSON.stringify(this.body);
	}
}

jest.mock("next/server", () => ({
	NextResponse: MockNextResponse,
}));

// ✅ mock resend API
jest.mock("resend", () => ({
	Resend: jest.fn().mockImplementation(() => ({
		emails: { send: jest.fn().mockResolvedValue({ id: "test-email" }) },
	})),
}));

const mockBooking = {
	create: jest.fn(),
	findUnique: jest.fn(),
	findMany: jest.fn(),
	findFirst: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
};

const mockService = {
	findFirst: jest.fn(),
	findMany: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
};

jest.mock("@/lib/db", () => ({
	db: {
		service: mockService,
		booking: mockBooking,
	},
}));

beforeEach(() => {
	Object.values(mockBooking).forEach((fn) => fn.mockReset());
	Object.values(mockService).forEach((fn) => fn.mockReset());
});

// ✅ silence React act() warnings
const originalError = console.error;
console.error = (...args) => {
	if (/not wrapped in act/.test(args[0])) return;
	originalError.call(console, ...args);
};
