import { describe, it, expect } from "vitest";
import { buildQueryParams, jsonText } from "../src/utils/formatters.js";
import { formatError } from "../src/utils/errors.js";

describe("buildQueryParams", () => {
  it("drops undefined and null values", () => {
    const out = buildQueryParams({ a: 1, b: undefined, c: null, d: "x" });
    expect(out).toEqual({ a: 1, d: "x" });
  });

  it("joins arrays with commas, drops empty arrays", () => {
    const out = buildQueryParams({ a: ["x", "y"], b: [] });
    expect(out).toEqual({ a: "x,y" });
  });

  it("preserves booleans", () => {
    const out = buildQueryParams({ flag: false });
    expect(out).toEqual({ flag: false });
  });
});

describe("jsonText", () => {
  it("returns text content type with pretty JSON", () => {
    const out = jsonText({ x: 1 });
    expect(out.type).toBe("text");
    expect(out.text).toBe('{\n  "x": 1\n}');
  });
});

describe("formatError", () => {
  it("formats Error", () => {
    expect(formatError(new Error("nope"))).toBe("Error: nope");
  });

  it("formats string", () => {
    expect(formatError("bad")).toBe("Error: bad");
  });

  it("stringifies objects", () => {
    expect(formatError({ a: 1 })).toBe('Error: {"a":1}');
  });
});
