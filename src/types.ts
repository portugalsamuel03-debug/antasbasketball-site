
export enum Category {
  INICIO = 'INÍCIO',
  NOTICIAS = 'NOTÍCIAS',
  HISTORIA = 'HISTÓRIA',
  REGRAS = 'REGRAS',
  PODCAST = 'PODCAST',
  STATUS = 'STATUS'
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  date: string;
  likes: number;
  reactions: Reaction[];
}

export interface Reader {
  id: string;
  name: string;
  avatar: string;
  rank: string;
  stats: {
    postsRead: number;
    commentsMade: number;
    likesGiven: number;
  };
  isVerified?: boolean;
}

export interface Author {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isVerified?: boolean;
}

export interface Champion {
  year: string;
  team: string;
  mvp: string;
  score: string;
}

export interface HallOfFame {
  name: string;
  year: string;
  role: string;
  achievement: string;
  imageUrl: string;
}

export interface Article {
  id: string;
  authorId: string;
  category: Category;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  likes: number;
  reactions: Reaction[];
  commentsCount: number;
  readTime: string;
  author: string;
  date: string;
  comments: Comment[];
  tags: string[];
}

export type SortOption = 'RECENTES' | 'CURTIDOS' | 'COMENTADOS' | 'ANTIGOS' | 'SALVOS';

export type ViewState = 'HOME' | 'SEARCH' | 'STORY' | 'PODCAST' | 'STATUS';

export type HistoriaSubTab = 'ARTIGOS' | 'CAMPEOES' | 'HALL_OF_FAME';

export type RegrasSubTab = 'ARTIGOS' | 'TRADES' | 'INATIVIDADE' | 'DIVISOES' | 'DRAFT';
