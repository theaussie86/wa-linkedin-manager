/**
 * Payload CMS API Client Types
 * 
 * Types for interacting with Payload CMS REST API from n8n workflows
 */

/**
 * Payload CMS API Error Response
 */
export interface PayloadAPIErrorResponse {
  errors: Array<{
    message: string;
    data?: unknown;
  }>;
}

/**
 * Payload CMS API Success Response
 */
export interface PayloadAPISuccessResponse<T = unknown> {
  docs?: T[];
  doc?: T;
  totalDocs?: number;
  limit?: number;
  totalPages?: number;
  page?: number;
  pagingCounter?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  prevPage?: number | null;
  nextPage?: number | null;
}

/**
 * Company Research Status
 */
export type CompanyResearchStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Generated Post Status
 */
export type GeneratedPostStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected';

/**
 * RichText format (Lexical format used by Payload CMS)
 */
export interface RichText {
  root: {
    type: string;
    children: Array<{
      type: string;
      version: number;
      [key: string]: unknown;
    }>;
    direction: 'ltr' | 'rtl' | null;
    format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
    indent: number;
    version: number;
  };
  [key: string]: unknown;
}

/**
 * Company Update Data for Research
 */
export interface CompanyResearchUpdateData {
  businessOverview?: RichText;
  idealCustomerProfile?: RichText;
  valueProposition?: RichText;
  researchStatus: CompanyResearchStatus;
  lastResearchAt?: string;
}

/**
 * Reference Post Creation Data
 */
export interface ReferencePostCreationData {
  company: string | number;
  title?: string;
  content: RichText;
  linkedinUrl: string;
  author?: string;
  authorProfile?: string;
  postType: 'text' | 'image' | 'video' | 'article' | 'poll';
  likes?: number;
  comments?: number;
  shares?: number;
  engagementRate?: number;
  publishedAt: string;
  scrapedAt: string;
}

/**
 * Generated Post Update Data
 */
export interface GeneratedPostUpdateData {
  title?: string;
  content?: RichText;
  status?: GeneratedPostStatus;
  aiPrompt?: string;
  aiModel?: string;
  generatedAt?: string;
  images?: Array<{
    image: string | number;
  }>;
}

