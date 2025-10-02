export interface Content {
  id: string;
  type: 'video' | 'playlist' | 'notes';
  title: string;
  url: string;
  thumbnail?: string;
  description?: string;
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  order: number;
  content: Content[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  chapters?: Chapter[];
}

export interface Year {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  subjects?: Subject[];
}

export interface Course {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  years?: Year[];
} 