import { describe, it, expect } from "vitest";
import {
  calculateWorkDays,
  isBusinessDay,
  getBusinessDaysBetween,
  addBusinessDays,
} from "./work-days";

describe("Work Days Calculation", () => {
  describe("isBusinessDay", () => {
    it("should return true for Monday to Friday", () => {
      expect(isBusinessDay(new Date("2024-01-01"))).toBe(true); // Monday
      expect(isBusinessDay(new Date("2024-01-02"))).toBe(true); // Tuesday
      expect(isBusinessDay(new Date("2024-01-03"))).toBe(true); // Wednesday
      expect(isBusinessDay(new Date("2024-01-04"))).toBe(true); // Thursday
      expect(isBusinessDay(new Date("2024-01-05"))).toBe(true); // Friday
    });

    it("should return false for Saturday and Sunday", () => {
      expect(isBusinessDay(new Date("2024-01-06"))).toBe(false); // Saturday
      expect(isBusinessDay(new Date("2024-01-07"))).toBe(false); // Sunday
    });
  });

  describe("getBusinessDaysBetween", () => {
    it("should calculate business days between two dates in same week", () => {
      const start = new Date("2024-01-01"); // Monday
      const end = new Date("2024-01-05"); // Friday
      expect(getBusinessDaysBetween(start, end)).toBe(5);
    });

    it("should exclude weekends", () => {
      const start = new Date("2024-01-01"); // Monday
      const end = new Date("2024-01-08"); // Next Monday
      expect(getBusinessDaysBetween(start, end)).toBe(6); // Mon-Fri + Mon = 6 days
    });

    it("should handle single day", () => {
      const start = new Date("2024-01-01"); // Monday
      const end = new Date("2024-01-01"); // Same day
      expect(getBusinessDaysBetween(start, end)).toBe(1);
    });

    it("should handle weekend start/end", () => {
      const start = new Date("2024-01-06"); // Saturday
      const end = new Date("2024-01-08"); // Monday
      expect(getBusinessDaysBetween(start, end)).toBe(1); // Only Monday counts
    });
  });

  describe("calculateWorkDays", () => {
    it("should calculate work days from date strings", () => {
      expect(calculateWorkDays("2024-01-01", "2024-01-05")).toBe(5);
    });

    it("should return null for invalid dates", () => {
      expect(calculateWorkDays("", "2024-01-05")).toBeNull();
      expect(calculateWorkDays("2024-01-01", "")).toBeNull();
      expect(calculateWorkDays(undefined, "2024-01-05")).toBeNull();
    });

    it("should handle end date before start date", () => {
      expect(calculateWorkDays("2024-01-05", "2024-01-01")).toBe(0);
    });
  });

  describe("addBusinessDays", () => {
    it("should add business days skipping weekends", () => {
      const start = new Date("2024-01-01"); // Monday
      const result = addBusinessDays(start, 5);
      expect(result.toISOString().split("T")[0]).toBe("2024-01-08"); // Next Monday
    });

    it("should handle adding 0 days", () => {
      const start = new Date("2024-01-01"); // Monday
      const result = addBusinessDays(start, 0);
      expect(result.toISOString().split("T")[0]).toBe("2024-01-01");
    });

    it("should skip weekends when starting on Friday", () => {
      const start = new Date("2024-01-05"); // Friday
      const result = addBusinessDays(start, 1);
      expect(result.toISOString().split("T")[0]).toBe("2024-01-08"); // Monday
    });
  });
});