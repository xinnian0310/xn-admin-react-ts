export interface Post {
  id: number
  code: string
  name: string
  sort: number
  status: number
  remark?: string
  builtIn?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PostForm {
  code: string
  name: string
  sort: number
  status: number
  remark?: string
}
