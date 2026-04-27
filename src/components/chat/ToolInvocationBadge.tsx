"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

function getBasename(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>,
  isDone: boolean
): string {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = path ? getBasename(path) : "file";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return isDone ? `Created ${filename}` : `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return isDone ? `Edited ${filename}` : `Editing ${filename}`;
      case "view":
        return isDone ? `Read ${filename}` : `Reading ${filename}`;
      case "undo_edit":
        return isDone ? `Reverted ${filename}` : `Reverting ${filename}`;
      default:
        return isDone ? `Edited ${filename}` : `Editing ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "delete":
        return isDone ? `Deleted ${filename}` : `Deleting ${filename}`;
      case "rename": {
        const newPath = typeof args.new_path === "string" ? args.new_path : "";
        const newFilename = newPath ? getBasename(newPath) : "";
        const suffix = newFilename ? ` → ${newFilename}` : "";
        return isDone
          ? `Renamed ${filename}${suffix}`
          : `Renaming ${filename}${suffix}`;
      }
      default:
        return isDone ? `Managed ${filename}` : `Managing ${filename}`;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isDone =
    toolInvocation.state === "result" && !!toolInvocation.result;
  const label = getToolLabel(
    toolInvocation.toolName,
    (toolInvocation.args as Record<string, unknown>) ?? {},
    isDone
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
