import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { join } from "path"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    // Join path segments and decode URL-encoded characters
    const filePath = path.map((segment) => decodeURIComponent(segment)).join("/")
    const fullPath = join(process.cwd(), "public", "documents", filePath)

    // Security check - ensure path is within documents directory
    if (!fullPath.startsWith(join(process.cwd(), "public", "documents"))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(fullPath)

    // Get file extension for MIME type
    const extension = filePath.split(".").pop()?.toLowerCase()
    let contentType = "application/octet-stream"

    switch (extension) {
      case "pdf":
        contentType = "application/pdf"
        break
      case "doc":
        contentType = "application/msword"
        break
      case "docx":
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        break
      case "xls":
        contentType = "application/vnd.ms-excel"
        break
      case "xlsx":
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        break
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg"
        break
      case "png":
        contentType = "image/png"
        break
      case "gif":
        contentType = "image/gif"
        break
      case "txt":
        contentType = "text/plain"
        break
    }

    // Get file name for Content-Disposition header (sanitize for safe display)
    const fileName = filePath.split("/").pop() || "document"
    // Encode filename for Content-Disposition header to handle special characters
    const encodedFileName = encodeURIComponent(fileName)

    // Return file with no-cache headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Content-Disposition": `inline; filename*=UTF-8''${encodedFileName}`,
      },
    })
  } catch (error) {
    console.error("Error serving document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
