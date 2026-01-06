import * as z from "zod"

export const geolocationSchema = z.object({
  geoLocationId: z.number(),
  geoLocationCode: z
    .string()
    .min(1, { message: "GeoLocation code is required" })
    .max(50, { message: "GeoLocation code cannot exceed 50 characters" }),
  geoLocationName: z
    .string()
    .min(2, { message: "GeoLocation name must be at least 2 characters" })
    .max(150, { message: "GeoLocation name cannot exceed 150 characters" }),
  portId: z.number().min(1, { message: "Port is required" }),
  latitude: z
    .string()
    .max(50, { message: "Latitude cannot exceed 50 characters" })
    .optional(),
  longitude: z
    .string()
    .max(50, { message: "Longitude cannot exceed 50 characters" })
    .optional(),
  remarks: z
    .string()
    .max(255, { message: "Remarks cannot exceed 255 characters" })
    .optional(),
  isActive: z.boolean(),
})

export type GeoLocationSchemaType = z.infer<typeof geolocationSchema>

export const geolocationFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type GeoLocationFiltersValues = z.infer<typeof geolocationFiltersSchema>
