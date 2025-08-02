export interface CommentAttributes {
  id?: string;
  userId?: string;
  eventId?: string;
  content?: string;
  isEdited?: boolean;
  editedAt?: Date | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCommentInput {
  eventId: string;
  content: string;
}

export interface UpdateCommentInput {
  content?: string;
}

export interface CommentWithUser {
  id: string;
  content: string;
  isEdited: boolean;
  editedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  };
} 