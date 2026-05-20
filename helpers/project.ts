/** M_JobStatus.JobStatusId — Confirmed (lock + invoice preview) */
export const JOB_STATUS_ID_CONFIRMED = 2

/** M_JobStatus.JobStatusId — Posted (post to accounting) */
export const JOB_STATUS_ID_POSTED = 6

export type JobStatusInput =
  | string
  | {
      jobStatusId?: number
      jobStatusName?: string | null
    }
  | null
  | undefined

function resolveStatus(input: JobStatusInput) {
  if (input == null) {
    return { jobStatusId: undefined, jobStatusName: undefined }
  }
  if (typeof input === "string") {
    return { jobStatusId: undefined, jobStatusName: input }
  }
  return {
    jobStatusId: input.jobStatusId,
    jobStatusName: input.jobStatusName ?? undefined,
  }
}

export const isStatusConfirmed = (status?: JobStatusInput) => {
  const { jobStatusId, jobStatusName } = resolveStatus(status)
  if (jobStatusId === JOB_STATUS_ID_CONFIRMED) return true
  return jobStatusName?.toLowerCase() === "confirmed"
}

export const isStatusPosted = (status?: JobStatusInput) => {
  const { jobStatusId, jobStatusName } = resolveStatus(status)
  if (jobStatusId === JOB_STATUS_ID_POSTED) return true
  return jobStatusName?.toLowerCase() === "posted"
}

/** Ser_JobOrderHd / Ser_TallyService IsPost — invoice posted to AR */
export const isInvoicePosted = (isPost?: boolean) => isPost === true

/** Lock header and service lines when confirmed or posted */
export const isJobLocked = (status?: JobStatusInput) =>
  isStatusConfirmed(status) || isStatusPosted(status)

/** Lock Job Status autocomplete only when posted (IsPost or status Posted) */
export const isJobStatusLocked = (
  status?: JobStatusInput,
  isPost?: boolean
) => isStatusPosted(status) || isInvoicePosted(isPost)

/** Confirmed (not yet posted to accounting): show invoice preview */
export const canShowInvoicePreview = (status?: JobStatusInput) =>
  isStatusConfirmed(status)

/** Confirmed and invoice not posted yet: show generate/post invoice */
export const canShowInvoicePost = (
  status?: JobStatusInput,
  isPost?: boolean
) =>
  isStatusConfirmed(status) &&
  !isStatusPosted(status) &&
  !isInvoicePosted(isPost)

/** Invoice posted or job status Posted: job summary / invoice prints */
export const canShowJobSummaryPrint = (
  status?: JobStatusInput,
  isPost?: boolean
) => isStatusPosted(status) || isInvoicePosted(isPost)

/** Checklist list: Confirmed + IsPost or status Posted displays as Posted */
export const getChecklistJobDisplayStatus = (job: {
  jobStatusId?: number
  jobStatusName?: string | null
  isPost?: boolean
}): string => {
  if (
    isStatusPosted(job) ||
    (isInvoicePosted(job.isPost) && isStatusConfirmed(job))
  ) {
    return "Posted"
  }
  return job.jobStatusName?.trim() || "-"
}

export const isChecklistPostedJob = (job: {
  jobStatusId?: number
  jobStatusName?: string | null
  isPost?: boolean
}): boolean => getChecklistJobDisplayStatus(job) === "Posted"
