import type {
  AgentReadToolName,
} from './agentTools.ts'

export const AGENT_WRITE_TOOL_NAMES = [
  'create_goal',
  'update_goal',
  'create_routine',
  'update_routine',
  'prepare_focus_session',
  'change_daily_goal',
] as const

export type AgentWriteToolName =
  (typeof AGENT_WRITE_TOOL_NAMES)[number]

export type AgentAction =
  | {
      kind: 'read'
      tool: AgentReadToolName
    }
  | {
      kind: 'write'
      tool: AgentWriteToolName
    }

export function requiresUserConfirmation(
  action: AgentAction,
): boolean {
  return action.kind === 'write'
}
