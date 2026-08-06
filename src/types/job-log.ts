export interface JobLog {
  id: number
  jobId?: number
  jobName?: string
  jobKey?: string
  invokeTarget?: string
  status: string
  message?: string
  exceptionInfo?: string
  startTime?: string
  endTime?: string
  costMs?: number
}
