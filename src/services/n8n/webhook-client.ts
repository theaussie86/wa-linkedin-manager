/**
 * n8n Webhook Client
 *
 * Utility service for triggering n8n workflows from Payload CMS Collection Hooks.
 * All webhook calls are async/non-blocking (fire-and-forget) with error logging.
 */

import { WebhookAction } from '@/types/n8n/webhooks'
import type { Payload } from 'payload'

/**
 * Trigger Company Research Workflow in n8n
 *
 * @param companyId - The ID of the company to research
 * @param payload - Payload CMS instance for logging
 * @returns Promise that resolves when webhook call completes successfully, rejects on error
 * @throws Error if webhook call fails or N8N_WEBHOOK_URL is not set
 */
export async function triggerCompanyResearch(
  companyId: string,
  payload?: Payload,
): Promise<Response> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    const error = 'N8N_WEBHOOK_URL environment variable is not set'
    if (payload?.logger) {
      payload.logger.error(error)
    } else {
      console.error(error)
    }
    throw new Error(error)
  }

  const url = `${webhookUrl}/webhook-test/wa-linkedin`
  const body = JSON.stringify({ action: WebhookAction.COMPANY_RESEARCH, companyId })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET && {
          'X-WA-KEY': process.env.N8N_WEBHOOK_SECRET,
        }),
      },
      body,
    })

    if (!response.ok) {
      const errorMessage = `Webhook request failed with status ${response.status}: ${response.statusText}`
      if (payload?.logger) {
        payload.logger.error(errorMessage, {
          companyId,
          status: response.status,
          statusText: response.statusText,
        })
      }
      throw new Error(errorMessage)
    }

    return response
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `Failed to trigger company research webhook for company ${companyId}: ${error.message}`
        : `Failed to trigger company research webhook for company ${companyId}: Unknown error`

    if (payload?.logger) {
      payload.logger.error(errorMessage, { companyId, error })
    } else {
      console.error(errorMessage, error)
    }
    throw error instanceof Error ? error : new Error(errorMessage)
  }
}

/**
 * Trigger Reference Post Scraping Workflow in n8n
 *
 * @param companyId - The ID of the company
 * @param linkedinUrl - The LinkedIn URL to scrape
 * @param payload - Payload CMS instance for logging
 * @returns Promise that resolves when webhook call is initiated (not waiting for response)
 */
export async function triggerReferencePostScraping(
  companyId: string,
  linkedinUrl: string,
  payload?: Payload,
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    const error = 'N8N_WEBHOOK_URL environment variable is not set'
    if (payload?.logger) {
      payload.logger.error(error)
    } else {
      console.error(error)
    }
    return
  }

  const url = `${webhookUrl}/webhook-test/wa-linkedin`
  const body = JSON.stringify({
    action: WebhookAction.SCRAPE_REFERENCE_POST,
    companyId,
    linkedinUrl,
  })

  // Fire-and-forget: Don't await the response
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET && {
        'X-WA-KEY': process.env.N8N_WEBHOOK_SECRET,
      }),
    },
    body,
  }).catch((error) => {
    const errorMessage = `Failed to trigger reference post scraping webhook for company ${companyId}: ${error.message}`
    if (payload?.logger) {
      payload.logger.error(errorMessage, { companyId, linkedinUrl, error })
    } else {
      console.error(errorMessage, error)
    }
  })
}

/**
 * Trigger Content Generation Workflow in n8n
 *
 * @param generatedPostId - The ID of the generated post
 * @param generateImage - Optional flag to generate an image (default: false)
 * @param payload - Payload CMS instance for logging
 * @returns Promise that resolves when webhook call is initiated (not waiting for response)
 */
export async function triggerContentGeneration(
  generatedPostId: string,
  generateImage: boolean = false,
  payload?: Payload,
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    const error = 'N8N_WEBHOOK_URL environment variable is not set'
    if (payload?.logger) {
      payload.logger.error(error)
    } else {
      console.error(error)
    }
    return
  }

  const url = `${webhookUrl}/webhook-test/wa-linkedin`
  const body = JSON.stringify({
    action: WebhookAction.GENERATE_CONTENT,
    generatedPostId,
    generateImage,
  })

  // Fire-and-forget: Don't await the response
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET && {
        'X-WA-KEY': process.env.N8N_WEBHOOK_SECRET,
      }),
    },
    body,
  }).catch((error) => {
    const errorMessage = `Failed to trigger content generation webhook for post ${generatedPostId}: ${error.message}`
    if (payload?.logger) {
      payload.logger.error(errorMessage, { generatedPostId, generateImage, error })
    } else {
      console.error(errorMessage, error)
    }
  })
}
