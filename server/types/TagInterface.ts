export interface TagAttributes {
  id: string;
  name: string;
  description: string | null;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTagInput {
  name: string;
  description?: string;
}

export interface UpdateTagInput {
  name?: string;
  description?: string;
} 