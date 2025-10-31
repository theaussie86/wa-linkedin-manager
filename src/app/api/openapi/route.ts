/**
 * OpenAPI Specification Endpoint
 * GET /api/openapi
 * Returns the OpenAPI 3.1 specification for the API
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'

let cachedSpec: any = null

function loadOpenAPISpec() {
  if (cachedSpec) {
    return cachedSpec
  }

  try {
    // Load the OpenAPI spec from the contracts directory
    const specPath = join(process.cwd(), 'specs/001-data-model/contracts/openapi.yaml')
    const specContent = readFileSync(specPath, 'utf-8')
    
    // Parse YAML
    cachedSpec = yaml.load(specContent) as any
    
    // Update server URLs based on environment
    if (cachedSpec.servers) {
      cachedSpec.servers = cachedSpec.servers.map((server: any) => {
        if (server.url === 'http://localhost:3000/api') {
          // Update with actual server URL if available
          const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
          server.url = `${baseUrl}/api`
        }
        return server
      })
    }
    
    return cachedSpec
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const spec = loadOpenAPISpec()
    
    if (!spec) {
      return NextResponse.json(
        { error: 'OpenAPI specification not found' },
        { status: 500 }
      )
    }

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Cache-Control', 'public, max-age=3600') // Cache for 1 hour

    return NextResponse.json(spec, { headers })
  } catch (error) {
    console.error('Error serving OpenAPI spec:', error)
    return NextResponse.json(
      { error: 'Failed to load OpenAPI specification' },
      { status: 500 }
    )
  }
}

