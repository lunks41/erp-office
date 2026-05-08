import { NextRequest, NextResponse } from "next/server"

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL

// Helper function to get secure headers from session and cookies
async function getSecureHeaders(request: NextRequest) {
  // Get auth token from cookies
  const authToken = request.cookies.get("auth-token")?.value
  // Get company ID from session-based header only
  const companyId = request.headers.get("X-Company-Id") || ""

  // Extract user ID from JWT token
  let userId = "0"
  if (authToken) {
    try {
      const tokenPayload = JSON.parse(atob(authToken.split(".")[1]))
      userId = tokenPayload.userId || tokenPayload.sub || "0"
    } catch (error) {
      console.error("Error parsing auth token:", error)
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Reg-Id": process.env.NEXT_PUBLIC_DEFAULT_REGISTRATION_ID || "",
    "X-User-Id": userId,
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  // Do not forward an empty company header; some endpoints reject it.
  if (companyId) {
    headers["X-Company-Id"] = companyId
  }

  return headers
}

// Helper function to build query string from request parameters
function buildQueryString(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryParams = new URLSearchParams()

  // Add all query parameters to the backend request
  searchParams.forEach((value, key) => {
    if (value) {
      queryParams.append(key, value)
    }
  })

  return queryParams.toString()
}

// Handle errors
function handleError(error: unknown) {
  console.error("Proxy error:", error)
  return NextResponse.json(
    { message: "Internal server error" },
    { status: 500 }
  )
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const pathParam =
      request.nextUrl.pathname.split("/proxy/")[1]?.replace(/\/+/g, "/") || ""

    // Build query string from request parameters
    const queryString = buildQueryString(request)
    const url = queryString
      ? `${BACKEND_API_URL}/${pathParam}?${queryString}`
      : `${BACKEND_API_URL}/${pathParam}`

    const headers = await getSecureHeaders(request)

    const response = await fetch(url, { headers })

    // Check if response is ok
    if (!response.ok) {
      const text = await response.text()
      console.error(
        "GET request failed:",
        response.status,
        text.substring(0, 200)
      )
      return NextResponse.json(
        { result: 0, message: `Server error: ${response.status}`, data: [] },
        { status: response.status }
      )
    }

    const responseText = await response.text()
    if (!responseText || responseText.trim() === "") {
      return NextResponse.json({
        result: 0,
        message: "Empty response",
        data: [],
      })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error(
        "GET JSON parse error:",
        jsonError,
        responseText.substring(0, 200)
      )
      return NextResponse.json(
        { result: 0, message: "Invalid JSON response", data: [] },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("GET Error:", error)
    return handleError(error)
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const pathParam =
      request.nextUrl.pathname.split("/proxy/")[1]?.replace(/\/+/g, "/") || ""
    const url = `${BACKEND_API_URL}/${pathParam}`
    const body = await request.json()
    const headers = await getSecureHeaders(request)

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(
        "POST request failed:",
        response.status,
        text.substring(0, 200)
      )
      return NextResponse.json(
        { result: 0, message: `Server error: ${response.status}` },
        { status: response.status }
      )
    }

    const responseText = await response.text()
    if (!responseText || responseText.trim() === "") {
      return NextResponse.json({ result: 1, message: "Success" })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error(
        "POST JSON parse error:",
        jsonError,
        responseText.substring(0, 200)
      )
      return NextResponse.json(
        { result: 0, message: "Invalid JSON response" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("POST Error:", error)
    return handleError(error)
  }
}

// PUT handler
export async function PUT(request: NextRequest) {
  try {
    const pathParam =
      request.nextUrl.pathname.split("/proxy/")[1]?.replace(/\/+/g, "/") || ""
    const url = `${BACKEND_API_URL}/${pathParam}`
    const body = await request.json()
    const headers = await getSecureHeaders(request)

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(
        "PUT request failed:",
        response.status,
        text.substring(0, 200)
      )
      return NextResponse.json(
        { result: 0, message: `Server error: ${response.status}` },
        { status: response.status }
      )
    }

    const responseText = await response.text()
    if (!responseText || responseText.trim() === "") {
      return NextResponse.json({ result: 1, message: "Success" })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error(
        "PUT JSON parse error:",
        jsonError,
        responseText.substring(0, 200)
      )
      return NextResponse.json(
        { result: 0, message: "Invalid JSON response" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("PUT Error:", error)
    return handleError(error)
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  try {
    const pathParam =
      request.nextUrl.pathname.split("/proxy/")[1]?.replace(/\/+/g, "/") || ""
    const url = `${BACKEND_API_URL}/${pathParam}`
    const headers = await getSecureHeaders(request)

    console.log("DELETE request to:", url)

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    })

    console.log("DELETE response status:", response.status)

    // Check if response is ok
    if (!response.ok) {
      console.error("DELETE request failed with status:", response.status)
      const text = await response.text()
      console.error("Response body:", text.substring(0, 500))
      return NextResponse.json(
        {
          result: 0,
          message: `Server returned error: ${response.status}`,
          error: text.substring(0, 200),
        },
        { status: response.status }
      )
    }

    // Check if there's content to parse
    const contentType = response.headers.get("content-type")
    const responseText = await response.text()

    console.log("DELETE response content-type:", contentType)
    console.log("DELETE response text:", responseText.substring(0, 200))

    // Handle empty responses
    if (!responseText || responseText.trim() === "") {
      console.log("Empty response, returning success")
      return NextResponse.json({ result: 1, message: "Deleted successfully" })
    }

    // Try to parse as JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError)
      console.error("Response text:", responseText.substring(0, 500))
      return NextResponse.json(
        {
          result: 0,
          message: "Invalid response from server",
          error: "Not valid JSON",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("DELETE Error:", error)
    return handleError(error)
  }
}
