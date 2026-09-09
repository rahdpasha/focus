import type { ApiContext, ApiResponse, FocusApi, FocusDataResource } from './types'

/**
 * Provider-neutral API boundary.
 *
 * Phase 20 intentionally does not connect to a backend. The application can
 * depend on this contract later while Supabase, a custom API, or another
 * provider remains an implementation detail.
 */
export class UnconfiguredFocusApi implements FocusApi {
  async getFocusData(context: ApiContext): Promise<ApiResponse<FocusDataResource>> {
    throw new Error(`Focus API is not configured for user ${context.user.id}`)
  }

  async saveFocusData(
    context: ApiContext,
    data: FocusDataResource,
  ): Promise<ApiResponse<FocusDataResource>> {
    throw new Error(
      `Focus API is not configured for user ${context.user.id}; received ${data.sessions.length} sessions`,
    )
  }
}
