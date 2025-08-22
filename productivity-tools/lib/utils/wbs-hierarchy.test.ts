import { describe, it, expect } from "vitest";
import {
  generateHierarchyNumber,
  getNextSiblingNumber,
  recalculateHierarchyNumbers,
  insertTaskBetween,
} from "./wbs-hierarchy";
import type { WBSTask } from "../db/types";

describe("WBS Hierarchy Number System", () => {
  describe("generateHierarchyNumber", () => {
    it("should generate root level number", () => {
      const parentNumber = null;
      const siblingCount = 0;
      expect(generateHierarchyNumber(parentNumber, siblingCount)).toBe("1");
    });

    it("should generate second root level number", () => {
      const parentNumber = null;
      const siblingCount = 1;
      expect(generateHierarchyNumber(parentNumber, siblingCount)).toBe("2");
    });

    it("should generate child number", () => {
      const parentNumber = "1";
      const siblingCount = 0;
      expect(generateHierarchyNumber(parentNumber, siblingCount)).toBe("1.1");
    });

    it("should generate second child number", () => {
      const parentNumber = "1";
      const siblingCount = 1;
      expect(generateHierarchyNumber(parentNumber, siblingCount)).toBe("1.2");
    });

    it("should generate deep hierarchy number", () => {
      const parentNumber = "1.2.3";
      const siblingCount = 0;
      expect(generateHierarchyNumber(parentNumber, siblingCount)).toBe("1.2.3.1");
    });
  });

  describe("getNextSiblingNumber", () => {
    it("should get next root number", () => {
      const tasks: WBSTask[] = [
        {
          id: "1",
          title: "Task 1",
          hierarchy_number: "1",
          position: 0,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
        {
          id: "2",
          title: "Task 2",
          hierarchy_number: "2",
          position: 1,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
      ];
      expect(getNextSiblingNumber(tasks, null)).toBe(3);
    });

    it("should get next child number", () => {
      const tasks: WBSTask[] = [
        {
          id: "1",
          title: "Parent",
          hierarchy_number: "1",
          position: 0,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
        {
          id: "2",
          title: "Child 1",
          hierarchy_number: "1.1",
          parent_id: "1",
          position: 0,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
        {
          id: "3",
          title: "Child 2",
          hierarchy_number: "1.2",
          parent_id: "1",
          position: 1,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
      ];
      expect(getNextSiblingNumber(tasks, "1")).toBe(3);
    });
  });

  describe("recalculateHierarchyNumbers", () => {
    it("should recalculate hierarchy numbers after insertion", () => {
      const tasks: WBSTask[] = [
        {
          id: "1",
          title: "Task 1",
          hierarchy_number: "1",
          position: 0,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
        {
          id: "3",
          title: "Task 3",
          hierarchy_number: "2",
          position: 1,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
      ];

      const newTask: WBSTask = {
        id: "2",
        title: "Task 2",
        position: 1,
        progress: 0,
        created_at: "",
        updated_at: "",
      };

      const result = recalculateHierarchyNumbers([tasks[0], newTask, tasks[1]]);
      
      expect(result[0].hierarchy_number).toBe("1");
      expect(result[1].hierarchy_number).toBe("2");
      expect(result[2].hierarchy_number).toBe("3");
    });
  });

  describe("insertTaskBetween", () => {
    it("should insert task between two root tasks", () => {
      const tasks: WBSTask[] = [
        {
          id: "1",
          title: "Task 1",
          hierarchy_number: "1",
          position: 0,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
        {
          id: "2",
          title: "Task 2",
          hierarchy_number: "2",
          position: 1,
          progress: 0,
          created_at: "",
          updated_at: "",
        },
      ];

      const newTask: WBSTask = {
        id: "3",
        title: "New Task",
        position: 1,
        progress: 0,
        created_at: "",
        updated_at: "",
      };

      const result = insertTaskBetween(tasks, newTask, 0);
      
      expect(result.length).toBe(3);
      expect(result[1].id).toBe("3");
      expect(result[1].hierarchy_number).toBe("2");
      expect(result[2].hierarchy_number).toBe("3");
    });
  });
});