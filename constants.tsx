
import { Article, Category, Comment, Reader, Author, Champion, HallOfFame } from './types';

export const NBA_TEAMS = [
  "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets", "Chicago Bulls",
  "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets", "Detroit Pistons", "Golden State Warriors",
  "Houston Rockets", "Indiana Pacers", "LA Clippers", "Los Angeles Lakers", "Memphis Grizzlies",
  "Miami Heat", "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks",
  "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns", "Portland Trail Blazers",
  "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors", "Utah Jazz", "Washington Wizards"
];

// Dicionário de informações das tags para o Tooltip
export const TAG_INFO: Record<string, string> = {
  'NBA': 'National Basketball Association - A liga de elite do basquete mundial.',
  'DINASTIA': 'Equipes que dominaram a liga por múltiplos anos consecutivos.',
  'TÁTICA': 'Análises profundas sobre sistemas ofensivos e defensivos.',
  'LEGADO': 'O impacto duradouro de jogadores e times na história do esporte.',
  'DRAFT': 'O evento anual de recrutamento de novos talentos para a liga.',
  'PROSPECTOS': 'Jovens promessas que estão prestes a entrar no cenário profissional.',
  'FUTURO': 'Tendências e expectativas para as próximas temporadas.',
  'FIBA': 'Federação Internacional de Basquete - Regras do jogo internacional.',
  'REGRAS': 'Esclarecimentos sobre as normas vigentes nas quadras.',
  'PASSO ZERO': 'A regra que revolucionou a mobilidade e o drible moderno.',
  'FUNDAMENTOS': 'Técnicas essenciais como arremesso, passe e controle de bola.',
  'ORIGENS': 'A história por trás da criação do Antas Basketball em 2017.',
  'COMUNIDADE': 'O coração do nosso blog: os leitores e jogadores locais.',
  'RACHA': 'O clássico basquete de rua onde o Antas nasceu.',
  'BASQUETE AMADOR': 'A celebração do jogo praticado por paixão, fora das grandes ligas.',
  'MODA': 'Cultura sneaker, uniformes e o estilo de vida do basquete.',
  'SQUAD': 'Informações sobre os membros ativos do elenco Antas.',
  'COLEÇÃO': 'Lançamentos exclusivos de vestuário e acessórios.',
  'UNIFORME': 'O manto sagrado que vestimos nas competições.'
};

export const CHAMPIONS: Champion[] = [
  { year: '2023', team: 'Antas Alpha', mvp: 'Jhow "The Wall"', score: '102 - 98' },
  { year: '2022', team: 'Antas Beta', mvp: 'Ane 3-Points', score: '88 - 85' },
  { year: '2021', team: 'Squad Antas', mvp: 'Léo Dunker', score: '110 - 104' },
  { year: '2020', team: 'Antas Prime', mvp: 'Mestre Splinter', score: '95 - 90' },
  { year: '2019', team: 'Legendary Antas', mvp: 'Vini "The Flash"', score: '105 - 100' },
  { year: '2018', team: 'Antas Original', mvp: 'Gui Rebound', score: '82 - 80' },
  { year: '2017', team: 'Os Fundadores', mvp: 'Equipe Antas', score: '70 - 68' },
];

export const HALL_OF_FAME: HallOfFame[] = [
  { 
    name: 'Jhow "The Wall"', 
    year: 'Induzido 2023', 
    role: 'Pivô Dominante', 
    achievement: 'Recorde de tocos em uma única temporada (84).',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jhow'
  },
  { 
    name: 'Ane Cesta de Três', 
    year: 'Induzido 2022', 
    role: 'Gatilho Rápido', 
    achievement: '58% de aproveitamento do perímetro em 200 jogos.',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ane'
  },
  { 
    name: 'Professor Arnaldo', 
    year: 'Induzido 2020', 
    role: 'Técnico Lendário', 
    achievement: 'Criador do sistema defensivo "Anta Manca".',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arnaldo'
  },
  { 
    name: 'Léo "The Beast"', 
    year: 'Induzido 2018', 
    role: 'Ala-Pivô', 
    achievement: 'Primeiro MVP da história do Antas Basketball.',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo'
  },
];

export const READERS: Reader[] = [
  { 
    id: '1', 
    name: 'Jhow', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jhow', 
    rank: 'MVP', 
    stats: { postsRead: 450, commentsMade: 120, likesGiven: 890 },
    isVerified: true 
  },
  { 
    id: '2', 
    name: 'Ane', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ane', 
    rank: 'ALL-STAR', 
    stats: { postsRead: 320, commentsMade: 85, likesGiven: 600 },
    isVerified: true 
  },
  { 
    id: '3', 
    name: 'Léo', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo', 
    rank: 'VETERANO', 
    stats: { postsRead: 210, commentsMade: 45, likesGiven: 310 },
    isVerified: true 
  },
  { 
    id: '4', 
    name: 'Bia', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bia', 
    rank: 'ROOKIE', 
    stats: { postsRead: 95, commentsMade: 12, likesGiven: 80 } 
  },
  { 
    id: '5', 
    name: 'Gui', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gui', 
    rank: 'CALOURO', 
    stats: { postsRead: 42, commentsMade: 5, likesGiven: 22 } 
  },
];

export const AUTHORS: Author[] = [
  { 
    id: 'a1', 
    name: 'EQUIPE ANTAS', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AntasTeam', 
    role: 'FUNDADORES', 
    isVerified: true 
  },
  { 
    id: 'a2', 
    name: 'REDAÇÃO', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Redacao', 
    role: 'EDITORES', 
    isVerified: true 
  },
  { 
    id: 'a3', 
    name: 'ARBITRAGEM', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ref', 
    role: 'ESPECIALISTAS', 
    isVerified: true 
  }
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    author: 'Jhow do Basquete',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    content: 'O Antas sempre trazendo a melhor visão do jogo! Esse time de 2017 era embaçado demais.',
    date: '2h atrás',
    likes: 12,
    reactions: [{ emoji: '🔥', count: 5 }, { emoji: '🏀', count: 3 }]
  },
  {
    id: 'c2',
    author: 'Cesta de Três',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ane',
    content: 'Análise técnica de alto nível. Parabéns pelo blog!',
    date: '5h atrás',
    likes: 8,
    reactions: [{ emoji: '👏', count: 2 }]
  }
];

export const ARTICLES: Article[] = [
  {
    id: '1',
    authorId: 'a1',
    category: Category.HISTORIA,
    title: 'Dynasty: Os 10 Maiores Times da História',
    description: 'Uma jornada pelos elencos que definiram gerações e mudaram a forma como o jogo é jogado...',
    content: 'O basquete não é apenas sobre talento individual, mas sobre a química que transforma um grupo de atletas em uma dinastia. Desde o Boston Celtics de Bill Russell até o Golden State Warriors de Stephen Curry, exploramos as nuances táticas e a mentalidade vencedora que permitiram a esses times dominarem suas épocas. Analisamos cada posição, do armador ao pivô, e como a evolução do jogo influenciou a montagem dessas equipes lendárias.',
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
    likes: 120,
    reactions: [{ emoji: '🔥', count: 24 }, { emoji: '🏀', count: 18 }],
    commentsCount: 15,
    readTime: '4 MIN',
    author: 'EQUIPE ANTAS',
    date: '2024-03-20',
    comments: MOCK_COMMENTS,
    tags: ['NBA', 'DINASTIA', 'TÁTICA', 'LEGADO']
  },
  {
    id: '2',
    authorId: 'a2',
    category: Category.NOTICIAS,
    title: 'Draft 2024: O que esperar?',
    description: 'Análise completa dos prospectos mais quentes para a próxima temporada da liga.',
    content: 'A classe de 2024 promete ser uma das mais imprevisíveis dos últimos anos. Com talentos internacionais ganhando cada vez mais espaço, o Draft deste ano focará em versatilidade defensiva e capacidade de arremesso de longa distância. Estamos de olho nos prospectos que podem mudar o rumo das franquias que estão em reconstrução.',
    imageUrl: 'https://images.unsplash.com/photo-1519861531473-9200362f46b3?w=400',
    likes: 45,
    reactions: [{ emoji: '👀', count: 12 }],
    commentsCount: 22,
    readTime: '3 MIN',
    author: 'REDAÇÃO',
    date: '2024-03-21',
    comments: MOCK_COMMENTS,
    tags: ['NBA', 'DRAFT', 'PROSPECTOS', 'FUTURO']
  },
  {
    id: '3',
    authorId: 'a3',
    category: Category.REGRAS,
    title: 'Mudanças no Passo: O que mudou?',
    description: 'A FIBA atualizou a interpretação do "passo zero". Entenda como isso afeta o jogo amador.',
    content: 'A regra do "passo zero" ou "gather step" continua sendo motivo de debate nas quadras. Recentemente, a FIBA refinou a interpretação para permitir mais fluidez no ataque, facilitando o drible para o arremesso e bandejas. Explicamos aqui como identificar o momento exato em que o controle da bola é estabelecido e como isso dita a contagem dos passos subsequentes.',
    imageUrl: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=400',
    likes: 210,
    reactions: [{ emoji: '🧠', count: 9 }, { emoji: '🏀', count: 32 }],
    commentsCount: 8,
    readTime: '8 MIN',
    author: 'ARBITRAGEM',
    date: '2024-03-18',
    comments: MOCK_COMMENTS,
    tags: ['FIBA', 'REGRAS', 'PASSO ZERO', 'FUNDAMENTOS']
  },
  {
    id: '4',
    authorId: 'a1',
    category: Category.HISTORIA,
    title: 'O Legado de 2017: Onde Tudo Começou',
    description: 'Revisitando a nossa fundação e os primeiros passos do Antas Basketball no cenário amador.',
    content: 'Em 2017, um grupo de amigos decidiu levar a paixão pelo asfalto para um novo nível. O que começou como rachas de final de semana se transformou no Antas Basketball. Revisitamos as primeiras competições, os uniformes improvisados e a construção da cultura que nos trouxe até aqui. É uma história de resiliência e amor ao esporte.',
    imageUrl: 'https://picsum.photos/seed/nba2/400/300',
    likes: 85,
    reactions: [{ emoji: '❤️', count: 41 }, { emoji: '🔥', count: 28 }],
    commentsCount: 30,
    readTime: '6 MIN',
    author: 'EQUIPE ANTAS',
    date: '2024-03-15',
    comments: MOCK_COMMENTS,
    tags: ['ORIGENS', 'COMUNIDADE', 'RACHA', 'BASQUETE AMADOR']
  },
  {
    id: '5',
    authorId: 'a2',
    category: Category.NOTICIAS,
    title: 'Novos Uniformes Antas: Coleção 2025',
    description: 'Confira as cores e o design que o Squad Antas vai vestir na próxima temporada.',
    content: 'Inspirados na cultura urbana e na elegância do basquete clássico, os novos uniformes de 2025 trazem tecnologia dry-fit de ponta e um design minimalista que celebra nossa trajetória. O logo agora em relevo simboliza a solidez da nossa comunidade.',
    imageUrl: 'https://picsum.photos/seed/uniform/400/300',
    likes: 312,
    reactions: [{ emoji: '🔥', count: 56 }, { emoji: '💯', count: 42 }],
    commentsCount: 45,
    readTime: '2 MIN',
    author: 'REDAÇÃO',
    date: '2024-03-22',
    comments: MOCK_COMMENTS,
    tags: ['MODA', 'SQUAD', 'COLEÇÃO', 'UNIFORME']
  }
];
