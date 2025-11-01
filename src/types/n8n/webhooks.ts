/**
 * n8n Master Webhook Types
 * 
 * Defines the type system for the master webhook endpoint that routes
 * different actions to their respective handlers.
 */

/**
 * Available webhook actions
 */
export enum WebhookAction {
  COMPANY_RESEARCH = 'company-research',
  SCRAPE_REFERENCE_POST = 'scrape-reference-post',
  GENERATE_CONTENT = 'generate-content',
}

/**
 * Company Research Payload
 */
export interface CompanyResearchPayload {
  companyId: string;
}

/**
 * Reference Post Scraping Payload
 */
export interface ReferencePostScrapingPayload {
  companyId: string;
  linkedinUrl: string;
}

/**
 * Content Generation Payload
 */
export interface ContentGenerationPayload {
  generatedPostId: string;
  generateImage?: boolean;
}

/**
 * Master Webhook Request - Discriminated Union based on action
 */
export type MasterWebhookRequest =
  | {
      action: WebhookAction.COMPANY_RESEARCH;
      companyId: string;
    }
  | {
      action: WebhookAction.SCRAPE_REFERENCE_POST;
      companyId: string;
      linkedinUrl: string;
    }
  | {
      action: WebhookAction.GENERATE_CONTENT;
      generatedPostId: string;
      generateImage?: boolean;
    };

/**
 * Company Research Response
 */
export interface CompanyResearchResponse {
  success: boolean;
  action: WebhookAction.COMPANY_RESEARCH;
  companyId: string;
  message?: string;
}

/**
 * Reference Post Scraping Response
 */
export interface ReferencePostScrapingResponse {
  success: boolean;
  action: WebhookAction.SCRAPE_REFERENCE_POST;
  referencePostId?: string;
  message?: string;
  duplicate?: boolean;
}

/**
 * Content Generation Response
 */
export interface ContentGenerationResponse {
  success: boolean;
  action: WebhookAction.GENERATE_CONTENT;
  generatedPostId: string;
  message?: string;
}

/**
 * Master Webhook Response - Union type based on action
 */
export type MasterWebhookResponse =
  | CompanyResearchResponse
  | ReferencePostScrapingResponse
  | ContentGenerationResponse;

