
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
  userId?: string;
  author: string;
  avatar: string;
  content: string;
  date: string;
  editedAt?: string;
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
  bio?: string;
}



export interface HallOfFame {
  id: string;
  name: string;
  year_inducted: string;
  role: string;
  achievement?: string;
  image_url: string;
  manager_id?: string;
  manager?: { id: string; name: string; image_url: string };
}

export type ChampionRow = Champion;
export type HallOfFameRow = HallOfFame;

export interface TeamRow {
  id: string;
  name: string;
  gm_name: string;
  logo_url?: string;
  description?: string;
  manager_id?: string | null;
  manager?: { id: string; name: string; image_url: string };
  is_active?: boolean;
}

export interface TagDefinitionRow {
  slug: string;
  label: string;
  description: string;
}

export interface FeaturedReaderRow {
  id: string;
  name: string;
  avatar_url: string;
  rank_label: string;
  posts_read: number;
  comments_made: number;
  likes_given: number;
  is_verified: boolean;
  sort_order: number;
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
  subcategory?: string;
  video_url?: string;
  isFeatured?: boolean;
}

export type SortOption = 'RECENTES' | 'CURTIDOS' | 'COMENTADOS' | 'ANTIGOS' | 'SALVOS';

export type ViewState = 'HOME' | 'SEARCH' | 'STORY' | 'PODCAST' | 'STATUS';

export type HistoriaSubTab = 'ARTIGOS' | 'CAMPEOES' | 'HALL_OF_FAME' | 'AWARDS' | 'TRADES';

export type RegrasSubTab = 'ARTIGOS' | 'TRADES' | 'INATIVIDADE' | 'DIVISOES' | 'DRAFT';
export interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface SubcategoryRow {
  id: string;
  category_id: string;
  slug: string;
  label: string;
  sort_order: number;
}

export interface Team {
  id: string;
  name: string;
  gm_name: string;
  logo_url?: string;
  manager_id?: string | null;
  is_active?: boolean;
}

export interface ManagerHistory {
  id: string;
  manager_id: string;
  team_id?: string;
  year: string;
  team?: Team;
  manager?: Manager;
}

export interface Manager {
  id: string;
  name: string;
  image_url: string;
  teams_managed?: string; // Legacy
  teams_managed_ids?: string[]; // Legacy array
  bio?: string;
  is_active?: boolean;
  individual_titles?: string; // Manual extras
}

export interface Award {
  id: string;
  year: string;
  category: string;
  winner_name: string;
  team_id?: string;
  team?: Team;
  manager_id?: string; // New
  manager?: { id: string; name: string; image_url: string };
  description?: string;
}

export interface Trade {
  id: string;
  season: string;
  date: string;
  team_a_id?: string;
  team_b_id?: string;
  team_a?: Team;
  team_b?: Team;
  description: string;
}

export type AwardRow = Award;
export type TradeRow = Trade;

export interface RecordItem {
  id: string;
  title: string;
  description: string;
  order: number;
  year?: string;
  value?: string | number;
  holder?: string;
  type?: 'TEAM' | 'INDIVIDUAL' | 'AUTOMATIC';
  team_id?: string | null;
  manager_id?: string | null;
  team_ids?: string[];
  manager_ids?: string[];
}

export interface Season {
  id: string;
  year: string;
  summary: string;
}

export interface SeasonStanding {
  id: string;
  season_id: string;
  team_id: string;
  wins: number;
  losses: number;
  ties: number;
  trades_count: number;
  position: number;
  highlight_players?: string; // New
  team_achievements?: string; // New
  team?: Team; // Join
}

// Updated Champion with manager_id and historic_players
export interface Champion {
  id: string;
  year: string;
  team: string;
  mvp: string; // Keep for backward compatibility or display text
  manager_id?: string;
  manager?: { id: string; name: string; image_url: string }; // Join
  score: string;
  logo_url?: string;
  team_id?: string;
  runner_up_team_id?: string;
  runner_up_team?: { id: string; name: string; logo_url?: string }; // Join
  runner_up_manager_id?: string;
  runner_up_manager?: { id: string; name: string; image_url: string };
  historic_players?: { name: string; icon?: string }[];
}


