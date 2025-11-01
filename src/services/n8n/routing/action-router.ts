/**
 * Action Router Service
 * 
 * Routes webhook requests to appropriate action handlers based on the action type.
 * Uses TypeScript discriminated unions for type-safe routing.
 */

import type {
  MasterWebhookRequest,
  MasterWebhookResponse,
  CompanyResearchResponse,
  ReferencePostScrapingResponse,
  ContentGenerationResponse,
  WebhookAction,
} from '../../types/n8n';

/**
 * Type-safe action handler function signature
 */
export type ActionHandler<T extends WebhookAction> = (
  request: Extract<MasterWebhookRequest, { action: T }>,
) => Promise<MasterWebhookResponse>;

/**
 * Handler registry type
 */
interface HandlerRegistry {
  [WebhookAction.COMPANY_RESEARCH]?: ActionHandler<WebhookAction.COMPANY_RESEARCH>;
  [WebhookAction.SCRAPE_REFERENCE_POST]?: ActionHandler<WebhookAction.SCRAPE_REFERENCE_POST>;
  [WebhookAction.GENERATE_CONTENT]?: ActionHandler<WebhookAction.GENERATE_CONTENT>;
}

/**
 * Action Router class
 */
export class ActionRouter {
  private handlers: HandlerRegistry = {};

  /**
   * Register a handler for a specific action
   */
  register<T extends WebhookAction>(
    action: T,
    handler: ActionHandler<T>,
  ): void {
    this.handlers[action] = handler as ActionHandler<WebhookAction>;
  }

  /**
   * Lookup handler for a specific action
   */
  getHandler<T extends WebhookAction>(
    action: T,
  ): ActionHandler<T> | undefined {
    return this.handlers[action] as ActionHandler<T> | undefined;
  }

  /**
   * Route a webhook request to the appropriate handler
   */
  async routeWebhookAction(
    request: MasterWebhookRequest,
  ): Promise<MasterWebhookResponse> {
    const handler = this.getHandler(request.action);

    if (!handler) {
      throw new Error(`No handler registered for action: ${request.action}`);
    }

    // TypeScript discriminated union ensures type safety here
    return handler(request);
  }

  /**
   * Check if a handler is registered for an action
   */
  hasHandler(action: WebhookAction): boolean {
    return this.handlers[action] !== undefined;
  }

  /**
   * Get list of registered actions
   */
  getRegisteredActions(): WebhookAction[] {
    return Object.keys(this.handlers) as WebhookAction[];
  }
}

/**
 * Default action router instance
 * Handlers should be registered during application initialization
 */
export const actionRouter = new ActionRouter();

