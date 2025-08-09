export interface TemplateInput {
  name: string;
  label: string;
  type: 'text' | 'date' | 'textarea';
}

export interface OutcomesStructure {
  type: 'FIXED' | 'DYNAMIC';
  options?: { title: string }[]; // For FIXED type
  min?: number; // For DYNAMIC type
  max?: number; // For DYNAMIC type
}

export interface TemplateStructure {
  templateType: 'BINARY' | 'COMPETITIVE' | 'HEAD_TO_HEAD';
  titleStructure: string;
  inputs: TemplateInput[];
  outcomes?: { title: string }[]; // Optional for competitive templates
}

export interface EventTemplateAttributes {
  id?: string;
  name?: string;
  description?: string;
  structure?: TemplateStructure;
  outcomesStructure?: OutcomesStructure;
  creatorType?: 'ADMIN' | 'USER' | 'BOTH';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateEventTemplateInput {
  name: string;
  description?: string;
  structure: TemplateStructure;
  outcomesStructure?: OutcomesStructure;
  creatorType?: 'ADMIN' | 'USER' | 'BOTH';
  isActive?: boolean;
}

export interface UpdateEventTemplateInput {
  name?: string;
  description?: string;
  structure?: TemplateStructure;
  outcomesStructure?: OutcomesStructure;
  creatorType?: 'ADMIN' | 'USER' | 'BOTH';
  isActive?: boolean;
} 