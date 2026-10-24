export type Language = 'en' | 'bn';

export interface SourceItem {
  name: string;
  url: string;
  snippet?: string;
  title?: string;
}

export interface StatPoint {
  metric_name: string;
  value: string;
  source_org: string;
  context: string;
}

export interface ConstitutionalCitation {
  article_number: string;
  article_title_bn: string;
  article_title_en: string;
  legal_relevance: string;
}

export interface WrittenExamPrompt {
  marks: number;
  prompt_text_bn: string;
  prompt_text_en: string;
  model_outline_points: string[];
}

export interface PyqReference {
  pyq_id: string;
  bcs_batch: string;
  subject: string;
  question_snippet: string;
  relevance_score: number;
}

export interface SyllabusMapping {
  paper_code: string;
  subject: string;
  microtheme: string;
  full_breadcrumb: string;
}

export interface QuestionBreakdown {
  question: string;
  anchor_points: string[];
}

export interface DailyBuzzItem {
  title_bn: string;
  title_en: string;
  summary_bn: string;
  summary_en: string;
  lead_bn?: string;
  lead_en?: string;
  bullets_bn?: string[];
  bullets_en?: string[];
  details_bn?: string;
  details_en?: string;
  impact_bn?: string;
  impact_en?: string;
  why_it_matters_bn?: string;
  why_it_matters_en?: string;
  interest_categories?: string[];
  read_time_seconds?: number;
  published_at?: string;
}

export interface BcsProItem {
  syllabus_mapping?: SyllabusMapping;
  bcs_subject_area?: string;
  why_in_the_news_bn?: string;
  why_in_the_news_en?: string;
  question_breakdowns?: QuestionBreakdown[];
  data_stats?: StatPoint[];
  constitutional_articles?: ConstitutionalCitation[];
  challenges?: string[];
  way_forward?: string[];
  government_initiatives?: string[];
  conclusion?: string;
  analytical_breakdown_bn?: string;
  analytical_breakdown_en?: string;
  written_exam_prompt?: WrittenExamPrompt;
  linked_pyqs?: PyqReference[];
}

export interface CapsuleStory {
  story_id: string;
  primary_category: string;
  interest_categories: string[];
  tags: string[];
  image_url?: string | null;
  image_caption?: string | null;
  published_at?: string;
  is_bcs_pro_selected: boolean;
  importance_score?: number;
  rank_score?: number;
  sources: SourceItem[];
  daily_buzz: DailyBuzzItem;
  bcs_pro?: BcsProItem | null;
}

export interface DailyCapsule {
  edition_date: string;
  created_at: string;
  status: string;
  bcs_pro_preset_story_ids: string[];
  stories: CapsuleStory[];
  total_stories: number;
}

export type TabType = 'top_stories' | 'current_affairs' | 'discover' | 'saved' | 'settings' | 'editorial_dashboard';
