import { test, expect, describe, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// getToolLabel — unit tests (no rendering required)
// ---------------------------------------------------------------------------

describe("getToolLabel – str_replace_editor", () => {
  const args = { path: "/components/Card.jsx" };

  test("create in-progress", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "create" }, false)).toBe("Creating Card.jsx");
  });

  test("create done", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "create" }, true)).toBe("Created Card.jsx");
  });

  test("str_replace in-progress", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "str_replace" }, false)).toBe("Editing Card.jsx");
  });

  test("str_replace done", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "str_replace" }, true)).toBe("Edited Card.jsx");
  });

  test("insert in-progress", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "insert" }, false)).toBe("Editing Card.jsx");
  });

  test("insert done", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "insert" }, true)).toBe("Edited Card.jsx");
  });

  test("view in-progress", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "view" }, false)).toBe("Reading Card.jsx");
  });

  test("view done", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "view" }, true)).toBe("Read Card.jsx");
  });

  test("undo_edit in-progress", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "undo_edit" }, false)).toBe("Reverting Card.jsx");
  });

  test("undo_edit done", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "undo_edit" }, true)).toBe("Reverted Card.jsx");
  });

  test("unknown command falls back to editing", () => {
    expect(getToolLabel("str_replace_editor", { ...args, command: "unknown_cmd" }, false)).toBe("Editing Card.jsx");
    expect(getToolLabel("str_replace_editor", { ...args, command: "unknown_cmd" }, true)).toBe("Edited Card.jsx");
  });
});

describe("getToolLabel – file_manager", () => {
  test("delete in-progress", () => {
    expect(getToolLabel("file_manager", { command: "delete", path: "/components/Old.jsx" }, false)).toBe("Deleting Old.jsx");
  });

  test("delete done", () => {
    expect(getToolLabel("file_manager", { command: "delete", path: "/components/Old.jsx" }, true)).toBe("Deleted Old.jsx");
  });

  test("rename in-progress", () => {
    expect(
      getToolLabel("file_manager", { command: "rename", path: "/components/Old.jsx", new_path: "/components/New.jsx" }, false)
    ).toBe("Renaming Old.jsx → New.jsx");
  });

  test("rename done", () => {
    expect(
      getToolLabel("file_manager", { command: "rename", path: "/components/Old.jsx", new_path: "/components/New.jsx" }, true)
    ).toBe("Renamed Old.jsx → New.jsx");
  });

  test("rename without new_path omits arrow", () => {
    expect(
      getToolLabel("file_manager", { command: "rename", path: "/components/Old.jsx" }, false)
    ).toBe("Renaming Old.jsx");
  });

  test("unknown command falls back to managing", () => {
    expect(getToolLabel("file_manager", { command: "unknown", path: "/foo.js" }, false)).toBe("Managing foo.js");
  });
});

describe("getToolLabel – edge cases", () => {
  test("unknown tool name returns the tool name as-is", () => {
    expect(getToolLabel("some_future_tool", { path: "/foo.js" }, false)).toBe("some_future_tool");
    expect(getToolLabel("some_future_tool", { path: "/foo.js" }, true)).toBe("some_future_tool");
  });

  test("missing path falls back to 'file'", () => {
    expect(getToolLabel("str_replace_editor", { command: "create" }, false)).toBe("Creating file");
    expect(getToolLabel("str_replace_editor", { command: "create" }, true)).toBe("Created file");
  });
});

// ---------------------------------------------------------------------------
// ToolInvocationBadge — component rendering tests
// ---------------------------------------------------------------------------

describe("ToolInvocationBadge component", () => {
  test("shows spinner and in-progress label when not done", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={{
          toolCallId: "1",
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "call",
        }}
      />
    );

    expect(screen.getByText("Creating App.jsx")).toBeDefined();
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });

  test("shows green dot and done label when result is present", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={{
          toolCallId: "1",
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: "File created: /App.jsx",
        }}
      />
    );

    expect(screen.getByText("Created App.jsx")).toBeDefined();
    expect(document.querySelector(".animate-spin")).toBeNull();
    expect(document.querySelector(".bg-emerald-500")).not.toBeNull();
  });

  test("renders correctly for file_manager tool", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={{
          toolCallId: "2",
          toolName: "file_manager",
          args: { command: "delete", path: "/components/Old.jsx" },
          state: "result",
          result: { success: true },
        }}
      />
    );

    expect(screen.getByText("Deleted Old.jsx")).toBeDefined();
    expect(document.querySelector(".bg-emerald-500")).not.toBeNull();
  });

  test("treats result=null as in-progress", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={{
          toolCallId: "3",
          toolName: "str_replace_editor",
          args: { command: "str_replace", path: "/index.tsx" },
          state: "result",
          result: null,
        }}
      />
    );

    // result is falsy → treated as in-progress
    expect(screen.getByText("Editing index.tsx")).toBeDefined();
    expect(document.querySelector(".animate-spin")).not.toBeNull();
  });
});
