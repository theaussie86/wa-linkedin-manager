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
 * Content Input Types
 */
export enum ContentInputType {
  YOUTUBE = 'youtube',
  BLOG = 'blog',
  MEMO = 'memo',
}

/**
 * Call-to-Action Types
 */
export enum CTAType {
  COMMENT = 'comment',
  VISIT_WEBSITE = 'visit_website',
  FOLLOW = 'follow',
  CONNECT = 'connect',
}

/**
 * Generated Post Structure
 */
export interface GeneratedPost {
  id: string;
  title: string;
  contentType: 'story_based' | 'insight_focused' | 'engagement_focused';
  imageUrl?: string;
  status: string;
}

/**
 * Content Generation Payload
 */
export interface ContentGenerationPayload {
  generatedPostId: string;
  inputType?: ContentInputType | 'youtube' | 'blog' | 'memo';
  inputUrl?: string; // For YouTube/Blog
  inputText?: string; // For Memo
  generateImage?: boolean;
  generateSlideshow?: boolean;
  customInstructions?: string;
  customImageInstructions?: string;
  cta?: CTAType | 'comment' | 'visit_website' | 'follow' | 'connect';
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
  | ({
      action: WebhookAction.GENERATE_CONTENT;
    } & ContentGenerationPayload);

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
  generatedPosts?: GeneratedPost[];
  slideshowUrl?: string;
  message?: string;
}

/**
 * Master Webhook Response - Union type based on action
 */
export type MasterWebhookResponse =
  | CompanyResearchResponse
  | ReferencePostScrapingResponse
  | ContentGenerationResponse;

