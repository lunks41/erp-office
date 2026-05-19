"use client"

import { useMemo } from "react"
import type { IUserGroupHierarchy } from "@/interfaces/admin"

interface TreeNode {
  groupId: number
  groupCode: string
  groupName: string
  children: TreeNode[]
}

function buildTree(rows: IUserGroupHierarchy[]): TreeNode[] {
  const nodeMap = new Map<number, TreeNode>()

  for (const row of rows) {
    nodeMap.set(row.groupId, {
      groupId: row.groupId,
      groupCode: row.groupCode,
      groupName: row.groupName,
      children: [],
    })
  }

  const roots: TreeNode[] = []

  for (const row of rows) {
    const node = nodeMap.get(row.groupId)!
    if (row.groupId === row.parentGroupId) {
      roots.push(node)
    } else {
      const parent = nodeMap.get(row.parentGroupId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  }

  return roots
}

function TreeNodeItem({
  node,
  isLast,
  prefix,
}: {
  node: TreeNode
  isLast: boolean
  prefix: string
}) {
  const connector = isLast ? "└─ " : "├─ "
  const childPrefix = prefix + (isLast ? "   " : "│  ")

  return (
    <div>
      <div className="flex items-center gap-1.5 py-0.5 font-mono text-xs">
        <span className="whitespace-pre text-muted-foreground">
          {prefix}{connector}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground font-medium">
          {node.groupCode}
        </span>
        <span className="text-foreground">{node.groupName}</span>
      </div>
      {node.children.map((child, i) => (
        <TreeNodeItem
          key={child.groupId}
          node={child}
          isLast={i === node.children.length - 1}
          prefix={childPrefix}
        />
      ))}
    </div>
  )
}

export function HierarchyTree({ data }: { data: IUserGroupHierarchy[] }) {
  const roots = useMemo(() => buildTree(data), [data])

  if (roots.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic p-2">
        No hierarchy data available.
      </p>
    )
  }

  return (
    <div className="overflow-auto rounded-md border bg-background p-3">
      {roots.map((root, i) => (
        <TreeNodeItem
          key={root.groupId}
          node={root}
          isLast={i === roots.length - 1}
          prefix=""
        />
      ))}
    </div>
  )
}
