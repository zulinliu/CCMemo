export interface ApiResponse<T> {
  status: string
  data: T
}

export interface Session {
  session_id: string
  project_id: string
  auto_title: string
  custom_title: string | null
  status: 'active' | 'completed' | 'interrupted' | 'unrecoverable'
  started_at: string
  ended_at: string | null
  total_input_tokens: number
  total_output_tokens: number
  model: string | null
  file_count: number
  tool_call_count: number
  error_count: number
  tags: string | null
  branch: string | null
  file_path: string
}

export interface PaginatedResult<T> {
  items: T[]
  next_cursor: string | null
  has_more: boolean
}

export interface TimelineEvent {
  id: string
  session_id: string
  sequence: number
  event_type: string
  timestamp: string
  file_offset: number
  byte_length: number
  preview: string | null
  raw_json_hash: string | null
}

export interface ToolCall {
  id: string
  event_id: string
  session_id: string
  tool_name: string
  file_path: string | null
  input_summary: string | null
  output_summary: string | null
}

export interface Project {
  id: string
  name: string
  real_path: string
  normalized_path: string
  encoded_folder: string
  git_remote: string | null
  last_active_at: string
}

export interface Stats {
  session_count: number
  project_count: number
  event_count: number
  tool_call_count: number
}
