import { describe, expect, it } from "vitest";
import { clampEndToNow, resolveRange, sanitizeNextToken } from "../../src/mcp-server";

describe("sanitizeNextToken", () => {
	it("ignora la basura que algunos modelos meten en el campo opcional", () => {
		for (const junk of [" ", ": ", ".*", "1", ")}", "The user supplied a detailed background context but", ""]) {
			expect(sanitizeNextToken(junk)).toBeUndefined();
		}
		expect(sanitizeNextToken(undefined)).toBeUndefined();
	});

	it("deja pasar un token real de WHOOP", () => {
		expect(sanitizeNextToken(" MTIzOjEyMzEyMw== ")).toBe("MTIzOjEyMzEyMw==");
		expect(sanitizeNextToken("eyJ0cyI6MTcyNzU2Nzg5MH0")).toBe("eyJ0cyI6MTcyNzU2Nzg5MH0");
	});
});

describe("clampEndToNow", () => {
	const now = new Date("2026-09-29T07:30:00.000Z");
	it("recorta un end futuro a ahora", () => {
		expect(clampEndToNow("2026-09-29T22:00:00.000Z", now)).toBe(now.toISOString());
	});
	it("respeta un end pasado y la ausencia de end", () => {
		expect(clampEndToNow("2026-09-28T22:00:00.000Z", now)).toBe("2026-09-28T22:00:00.000Z");
		expect(clampEndToNow(undefined, now)).toBeUndefined();
	});
});

describe("resolveRange", () => {
	const now = new Date("2026-10-16T06:00:30.000Z");
	it("lee un end de solo fecha como el día entero (start = end = hoy daba 400)", () => {
		expect(resolveRange("2026-10-16", "2026-10-16", now)).toEqual({
			start: "2026-10-16T00:00:00.000Z",
			end: now.toISOString(),
		});
		expect(resolveRange("2026-10-14", "2026-10-15", now)).toEqual({
			start: "2026-10-14T00:00:00.000Z",
			end: "2026-10-16T00:00:00.000Z",
		});
	});
	it("descarta un end que no queda después de start", () => {
		expect(resolveRange("2026-10-16T05:00:00Z", "2026-10-16T05:00:00Z", now)).toEqual({
			start: "2026-10-16T05:00:00.000Z",
			end: undefined,
		});
		expect(resolveRange("2026-10-16T05:00:00Z", "2026-10-15T05:00:00Z", now).end).toBeUndefined();
	});
	it("respeta un rango normal con hora", () => {
		expect(resolveRange("2026-10-15T20:00:00Z", "2026-10-16T04:00:00Z", now)).toEqual({
			start: "2026-10-15T20:00:00.000Z",
			end: "2026-10-16T04:00:00.000Z",
		});
		expect(resolveRange(undefined, undefined, now)).toEqual({ start: undefined, end: undefined });
	});
});
