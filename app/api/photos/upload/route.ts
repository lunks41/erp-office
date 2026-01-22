import { existsSync } from "fs"
import { mkdir, readdir, unlink, writeFile } from "fs/promises"
import { join } from "path"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const photoType = formData.get("photoType") as string // "employee" or "profile"
    const _userId = formData.get("userId") as string
    const userName = formData.get("userName") as string

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!photoType || !["employee", "profile"].includes(photoType)) {
      return NextResponse.json({ error: "Invalid photo type" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create directory path based on photo type
    let uploadDir: string
    let relativePath: string

    if (photoType === "employee") {
      uploadDir = join(process.cwd(), "public", "uploads", "employee")
      relativePath = "/uploads/employee"
    } else {
      // profile type
      uploadDir = join(process.cwd(), "public", "uploads", "avatars")
      relativePath = "/uploads/avatars"
    }

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // For profile pictures, remove existing files for this user before uploading new one
    if (photoType === "profile" && userName) {
      try {
        // Sanitize userName the same way as in filename generation
        const sanitizedUserName = userName
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .replace(/\s+/g, "_")
          .toLowerCase()
          .substring(0, 50)
        
        const files = await readdir(uploadDir)
        for (const file of files) {
          // Skip default.png and delete files that match pattern: {timestamp}-{sanitizedUserName}.{ext}
          if (file !== "default.png") {
            // Check if file matches the pattern (starts with digits, has dash, then sanitized userName)
            const pattern = new RegExp(`^\\d+-${sanitizedUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.`)
            if (pattern.test(file)) {
              const filePath = join(uploadDir, file)
              try {
                await unlink(filePath)
              } catch (err) {
                console.error(`Error deleting file ${file}:`, err)
              }
            }
          }
        }
      } catch (err) {
        console.error("Error reading directory:", err)
        // Continue with upload even if deletion fails
      }
    }

    // Create file path with better naming
    const originalName = file.name
    const extension = originalName.split(".").pop()?.toLowerCase() || "jpg"
    
    let fileName: string
    
    if (photoType === "profile" && userName) {
      // For profile pictures, use format: {timestamp}-{userName}.{extension}
      const timestamp = Date.now()
      // Sanitize userName to make it a valid filename
      const sanitizedUserName = userName
        .replace(/[^a-zA-Z0-9_-]/g, "_") // Replace special chars with underscore
        .replace(/\s+/g, "_") // Replace spaces with underscore
        .toLowerCase()
        .substring(0, 50) // Limit length
      fileName = `${timestamp}-${sanitizedUserName}.${extension}`
    } else {
      // For employee photos or when userName is not provided, use timestamp
      const timestamp = Date.now()
      const baseName = originalName.replace(`.${extension}`, "")
      fileName = `${timestamp}-${baseName}.${extension}`
    }
    
    const filePath = join(uploadDir, fileName)

    // Save file
    await writeFile(filePath, buffer)

    // Return success response with file path
    const fullRelativePath = `${relativePath}/${fileName}`

    return NextResponse.json({
      success: true,
      filePath: fullRelativePath,
      fileName: originalName,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      photoType: photoType,
    })
  } catch (error) {
    console.error("Photo upload error:", error)
    return NextResponse.json(
      { error: "Error uploading photo" },
      { status: 500 }
    )
  }
}
