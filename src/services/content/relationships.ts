/**
 * Content Relationships Service
 * 
 * Documents and manages relationships between content entities and other entities.
 * Provides helper functions for querying and managing content relationships.
 */

/**
 * Content-Company Relationships
 * 
 * Both GeneratedPost and ReferencePost have required company relationships.
 * Campaign also has a required company relationship.
 */
export interface ContentCompanyRelationship {
  contentId: string
  contentType: 'generated-post' | 'reference-post' | 'campaign'
  companyId: string
}

/**
 * Content-User Relationships
 * 
 * GeneratedPost has optional reviewedBy relationship.
 * Campaign has required createdBy relationship.
 */
export interface ContentUserRelationship {
  contentId: string
  contentType: 'generated-post' | 'campaign'
  userId: string
  relationshipType: 'reviewer' | 'creator'
}

/**
 * Content-Campaign Relationships
 * 
 * Campaign has many-to-many relationships with GeneratedPost and ReferencePost.
 */
export interface ContentCampaignRelationship {
  contentId: string
  contentType: 'generated-post' | 'reference-post'
  campaignId: string
}

/**
 * Content-Analytics Relationships
 * 
 * GeneratedPost has one-to-many relationship with PostAnalytics.
 */
export interface ContentAnalyticsRelationship {
  contentId: string
  contentType: 'generated-post'
  analyticsId: string
}

/**
 * Get all content for a specific company
 * 
 * @param payload - Payload instance
 * @param companyId - Company ID
 * @param contentType - Type of content to retrieve
 * @returns Content items for the company
 */
export async function getCompanyContent(
  payload: any,
  companyId: string,
  contentType: 'generated-post' | 'reference-post' | 'both' = 'both',
): Promise<{
  generatedPosts?: any[]
  referencePosts?: any[]
}> {
  const result: {
    generatedPosts?: any[]
    referencePosts?: any[]
  } = {}

  if (contentType === 'generated-post' || contentType === 'both') {
    const generatedResult = await payload.find({
      collection: 'generated-posts',
      where: {
        company: {
          equals: companyId,
        },
      },
      limit: 100,
    })
    result.generatedPosts = generatedResult.docs
  }

  if (contentType === 'reference-post' || contentType === 'both') {
    const referenceResult = await payload.find({
      collection: 'reference-posts',
      where: {
        company: {
          equals: companyId,
        },
      },
      limit: 100,
    })
    result.referencePosts = referenceResult.docs
  }

  return result
}

/**
 * Get all content reviewed or created by a specific user
 * 
 * @param payload - Payload instance
 * @param userId - User ID
 * @param relationshipType - Type of relationship
 * @returns Content items for the user
 */
export async function getUserContent(
  payload: any,
  userId: string,
  relationshipType: 'reviewer' | 'creator' | 'both' = 'both',
): Promise<{
  reviewedPosts?: any[]
  createdCampaigns?: any[]
}> {
  const result: {
    reviewedPosts?: any[]
    createdCampaigns?: any[]
  } = {}

  if (relationshipType === 'reviewer' || relationshipType === 'both') {
    const reviewedResult = await payload.find({
      collection: 'generated-posts',
      where: {
        reviewedBy: {
          equals: userId,
        },
      },
      limit: 100,
    })
    result.reviewedPosts = reviewedResult.docs
  }

  if (relationshipType === 'creator' || relationshipType === 'both') {
    const campaignsResult = await payload.find({
      collection: 'campaigns',
      where: {
        createdBy: {
          equals: userId,
        },
      },
      limit: 100,
    })
    result.createdCampaigns = campaignsResult.docs
  }

  return result
}

/**
 * Get all content in a specific campaign
 * 
 * @param payload - Payload instance
 * @param campaignId - Campaign ID
 * @returns Content items in the campaign
 */
export async function getCampaignContent(
  payload: any,
  campaignId: string,
): Promise<{
  generatedPosts?: any[]
  referencePosts?: any[]
}> {
  // Get campaign first
  const campaign = await payload.findByID({
    collection: 'campaigns',
    id: campaignId,
  })

  const result: {
    generatedPosts?: any[]
    referencePosts?: any[]
  } = {}

  // Get generated posts
  if (campaign.generatedPosts && campaign.generatedPosts.length > 0) {
    const generatedIds = campaign.generatedPosts.map((gp: any) =>
      typeof gp === 'string' ? gp : gp.id,
    )

    const generatedResult = await payload.find({
      collection: 'generated-posts',
      where: {
        id: {
          in: generatedIds,
        },
      },
      limit: 100,
    })
    result.generatedPosts = generatedResult.docs
  }

  // Get reference posts
  if (campaign.referencePosts && campaign.referencePosts.length > 0) {
    const referenceIds = campaign.referencePosts.map((rp: any) =>
      typeof rp === 'string' ? rp : rp.id,
    )

    const referenceResult = await payload.find({
      collection: 'reference-posts',
      where: {
        id: {
          in: referenceIds,
        },
      },
      limit: 100,
    })
    result.referencePosts = referenceResult.docs
  }

  return result
}

/**
 * Get all analytics for a specific generated post
 * 
 * @param payload - Payload instance
 * @param postId - Generated post ID
 * @returns Analytics records for the post
 */
export async function getPostAnalytics(
  payload: any,
  postId: string,
): Promise<any[]> {
  const result = await payload.find({
    collection: 'post-analytics',
    where: {
      generatedPost: {
        equals: postId,
      },
    },
    limit: 100,
    sort: '-date',
  })

  return result.docs
}

/**
 * Get relationship statistics for content
 * 
 * @param payload - Payload instance
 * @param companyId - Optional company ID to filter by
 * @returns Statistics about content relationships
 */
export async function getRelationshipStatistics(
  payload: any,
  companyId?: string,
): Promise<{
  totalGeneratedPosts: number
  totalReferencePosts: number
  totalCampaigns: number
  totalAnalytics: number
  postsByCompany: Record<string, number>
  postsByStatus: Record<string, number>
}> {
  const where = companyId
    ? {
        company: {
          equals: companyId,
        },
      }
    : {}

  // Get generated posts
  const generatedResult = await payload.find({
    collection: 'generated-posts',
    where,
    limit: 1000,
  })

  // Get reference posts
  const referenceResult = await payload.find({
    collection: 'reference-posts',
    where,
    limit: 1000,
  })

  // Get campaigns
  const campaignsWhere = companyId
    ? {
        company: {
          equals: companyId,
        },
      }
    : {}
  const campaignsResult = await payload.find({
    collection: 'campaigns',
    where: campaignsWhere,
    limit: 1000,
  })

  // Get analytics
  const analyticsResult = await payload.find({
    collection: 'post-analytics',
    where: {},
    limit: 1000,
  })

  // Count posts by company
  const postsByCompany: Record<string, number> = {}
  generatedResult.docs.forEach((post: any) => {
    const companyId = typeof post.company === 'string' ? post.company : post.company?.id
    if (companyId) {
      postsByCompany[companyId] = (postsByCompany[companyId] || 0) + 1
    }
  })

  // Count posts by status
  const postsByStatus: Record<string, number> = {}
  generatedResult.docs.forEach((post: any) => {
    const status = post.status || 'draft'
    postsByStatus[status] = (postsByStatus[status] || 0) + 1
  })

  return {
    totalGeneratedPosts: generatedResult.totalDocs,
    totalReferencePosts: referenceResult.totalDocs,
    totalCampaigns: campaignsResult.totalDocs,
    totalAnalytics: analyticsResult.totalDocs,
    postsByCompany,
    postsByStatus,
  }
}

/**
 * Verify all required relationships exist for a content item
 * 
 * @param payload - Payload instance
 * @param contentType - Type of content
 * @param contentId - Content ID
 * @returns Verification result
 */
export async function verifyContentRelationships(
  payload: any,
  contentType: 'generated-post' | 'reference-post' | 'campaign',
  contentId: string,
): Promise<{
  valid: boolean
  missingRelationships?: string[]
  errors?: string[]
}> {
  const errors: string[] = []
  const missingRelationships: string[] = []

  try {
    const collection =
      contentType === 'generated-post'
        ? 'generated-posts'
        : contentType === 'reference-post'
          ? 'reference-posts'
          : 'campaigns'

    const content = await payload.findByID({
      collection,
      id: contentId,
    })

    // Check company relationship (required for all)
    if (!content.company) {
      missingRelationships.push('company')
      errors.push('Missing required company relationship')
    }

    // Check content-specific relationships
    if (contentType === 'generated-post') {
      // GeneratedPost: company is required, referencePost is optional
      // No additional required relationships
    } else if (contentType === 'reference-post') {
      // ReferencePost: company is required
      // No additional required relationships
    } else if (contentType === 'campaign') {
      // Campaign: company and createdBy are required
      if (!content.createdBy) {
        missingRelationships.push('createdBy')
        errors.push('Missing required createdBy relationship')
      }
    }

    return {
      valid: errors.length === 0,
      missingRelationships: missingRelationships.length > 0 ? missingRelationships : undefined,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Failed to verify relationships: ${error.message}`],
    }
  }
}

