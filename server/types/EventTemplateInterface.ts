export interface TemplateInput {
  name: string;
  label: string;
  type: 'text' | 'date' | 'textarea';
  placeholder?: string;
}

export interface OutcomesStructure {
  type: 'FIXED' | 'DYNAMIC_CHOICE' | 'DYNAMIC_RANGE';
  options?: { title: string }[]; // For FIXED type
  min?: number; // For DYNAMIC_CHOICE and DYNAMIC_RANGE types
  max?: number; // For DYNAMIC_CHOICE and DYNAMIC_RANGE types
  placeholder?: string; // For DYNAMIC types
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