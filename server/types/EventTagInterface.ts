export interface EventTagAttributes {
  eventId: string;
  tagId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventTagInput {
  eventId: string;
  tagId: string;
} 