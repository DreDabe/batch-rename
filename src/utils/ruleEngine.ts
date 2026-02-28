import type { FileItem } from '../types'
import type { RenamePreview, RenameRule } from '../types/rules'
import { applyRule, generatePreview } from './ruleEvaluator'
import { detectConflicts, validatePattern } from './conflictDetector'

export * from './ruleParser'
export * from './ruleEvaluator'
export * from './conflictDetector'
export * from './tagManager'

export class RenameEngine {
  private rule: RenameRule

  constructor(rule?: Partial<RenameRule>) {
    this.rule = {
      pattern: rule?.pattern ?? '',
      expressions: rule?.expressions ?? [],
      replaces: rule?.replaces ?? [],
      tags: rule?.tags ?? [],
    }
  }

  setPattern(pattern: string): void {
    this.rule.pattern = pattern
  }

  getPattern(): string {
    return this.rule.pattern
  }

  validate(): { valid: boolean; error?: string } {
    return validatePattern(this.rule.pattern)
  }

  preview(files: FileItem[]): RenamePreview[] {
    const rawPreviews = generatePreview(files, this.rule.pattern)
    const conflictResult = detectConflicts(rawPreviews)

    return rawPreviews.map((preview) => {
      const conflict = conflictResult.conflicts.find(
        (c) => c.file === preview.originalName
      )

      return {
        ...preview,
        hasConflict: !!conflict,
        conflictType: conflict?.type,
      }
    })
  }

  apply(file: FileItem, index: number): string {
    return applyRule(file, this.rule.pattern, index)
  }

  canExecute(files: FileItem[]): boolean {
    const previews = this.preview(files)
    return !previews.some((p) => p.hasConflict)
  }

  getExecutionPlan(files: FileItem[]): { oldPath: string; newPath: string }[] {
    const previews = this.preview(files)
    return previews
      .filter((p) => !p.hasConflict)
      .map((p) => ({
        oldPath: p.originalPath,
        newPath: p.newPath,
      }))
  }
}

export function createRenameEngine(rule?: Partial<RenameRule>): RenameEngine {
  return new RenameEngine(rule)
}
