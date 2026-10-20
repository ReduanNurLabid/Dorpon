import { collection, getDocs, doc, getDoc, limit, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { CapsuleStory, DailyCapsule } from '../types';

const FIRESTORE_REST_BASE = 'https://firestore.googleapis.com/v1/projects/dorpon-a99a6/databases/(default)/documents';

function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const list = val.arrayValue.values || [];
    return list.map((item: any) => decodeFirestoreValue(item));
  }
  if ('mapValue' in val) {
    const fields = val.mapValue.fields || {};
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = decodeFirestoreValue(v);
    }
    return res;
  }
  if ('nullValue' in val) return null;
  return val;
}

function decodeFirestoreDoc(doc: any): any {
  const fields = doc.fields || {};
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    res[k] = decodeFirestoreValue(v);
  }
  return res;
}

async function fetchFirestoreRest(collectionName: string, pageSize: number = 40): Promise<any[]> {
  try {
    const res = await fetch(`${FIRESTORE_REST_BASE}/${collectionName}?pageSize=${pageSize}`);
    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      return docs.map((d: any) => decodeFirestoreDoc(d));
    }
  } catch (err) {
    console.warn(`Firestore REST fallback failed for ${collectionName}:`, err);
  }
  return [];
}

async function fetchFirestoreDocRest(collectionName: string, docId: string): Promise<any | null> {
  try {
    const res = await fetch(`${FIRESTORE_REST_BASE}/${collectionName}/${docId}`);
    if (res.ok) {
      const data = await res.json();
      return decodeFirestoreDoc(data);
    }
  } catch (err) {
    console.warn(`Firestore REST doc fallback failed for ${collectionName}/${docId}:`, err);
  }
  return null;
}

function normalizeStory(data: any): CapsuleStory {
  const buzz = data.daily_buzz || data.dailyBuzz || {};
  const bcs = data.bcs_pro || data.bcsPro || null;

  return {
    story_id: data.story_id || data.storyId || Math.random().toString(36).substring(7),
    primary_category: data.primary_category || data.primaryCategory || 'general',
    interest_categories: data.interest_categories || data.interestCategories || [],
    tags: data.tags || [],
    image_url: data.image_url || data.imageUrl || null,
    image_caption: data.image_caption || data.imageCaption || null,
    published_at: data.published_at || data.publishedAt || buzz.published_at || data.created_at || new Date().toISOString(),
    is_bcs_pro_selected: Boolean(data.is_bcs_pro_selected || data.isBcsProSelected || bcs),
    importance_score: data.importance_score ?? 2.0,
    rank_score: data.rank_score ?? 1.0,
    sources: data.sources || [],
    daily_buzz: {
      title_bn: buzz.title_bn || buzz.titleBn || '',
      title_en: buzz.title_en || buzz.titleEn || '',
      summary_bn: buzz.summary_bn || buzz.summaryBn || '',
      summary_en: buzz.summary_en || buzz.summaryEn || '',
      lead_bn: buzz.lead_bn || buzz.leadBn || '',
      lead_en: buzz.lead_en || buzz.leadEn || '',
      bullets_bn: buzz.bullets_bn || buzz.bulletsBn || buzz.key_takeaways_bn || [],
      bullets_en: buzz.bullets_en || buzz.bulletsEn || buzz.key_takeaways_en || [],
      details_bn: buzz.details_bn || buzz.detailsBn || '',
      details_en: buzz.details_en || buzz.detailsEn || '',
      impact_bn: buzz.impact_bn || buzz.impactBn || '',
      impact_en: buzz.impact_en || buzz.impactEn || '',
      why_it_matters_bn: buzz.why_it_matters_bn || buzz.whyItMattersBn || '',
      why_it_matters_en: buzz.why_it_matters_en || buzz.whyItMattersEn || '',
      interest_categories: buzz.interest_categories || buzz.interestCategories || [],
      read_time_seconds: buzz.read_time_seconds || buzz.readTimeSeconds || 60,
      published_at: buzz.published_at || data.published_at,
    },
    bcs_pro: bcs ? {
      syllabus_mapping: bcs.syllabus_mapping,
      bcs_subject_area: bcs.bcs_subject_area || 'Global & National Affairs',
      why_in_the_news_bn: bcs.why_in_the_news_bn || '',
      why_in_the_news_en: bcs.why_in_the_news_en || '',
      question_breakdowns: bcs.question_breakdowns || [],
      data_stats: bcs.data_stats || [],
      constitutional_articles: bcs.constitutional_articles || [],
      challenges: bcs.challenges || [],
      way_forward: bcs.way_forward || [],
      government_initiatives: bcs.government_initiatives || [],
      conclusion: bcs.conclusion || '',
      analytical_breakdown_bn: bcs.analytical_breakdown_bn || '',
      analytical_breakdown_en: bcs.analytical_breakdown_en || '',
      written_exam_prompt: bcs.written_exam_prompt,
      linked_pyqs: bcs.linked_pyqs || [],
    } : null,
  };
}

export async function fetchDailyBuzzFeed(): Promise<CapsuleStory[]> {
  // 1. Try Firebase Firestore SDK
  try {
    const q = query(collection(db, 'daily_buzz'), limit(40));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const items: CapsuleStory[] = [];
      snapshot.forEach(doc => {
        items.push(normalizeStory(doc.data()));
      });
      if (items.length > 0) return items;
    }
  } catch (err) {
    console.warn('Firestore SDK buzz feed read error, falling back:', err);
  }

  // 2. Try Firestore REST API
  try {
    const restItems = await fetchFirestoreRest('daily_buzz', 40);
    if (restItems.length > 0) {
      return restItems.map(item => normalizeStory(item));
    }
  } catch (err) {
    console.warn('Firestore REST buzz error:', err);
  }

  // 3. Fallback to bundled static snapshot
  try {
    const res = await fetch('/data/top_stories_latest.json');
    if (res.ok) {
      const json = await res.json();
      const stories: any[] = json.stories || [];
      return stories.map(s => normalizeStory(s));
    }
  } catch (err) {
    console.error('Static top_stories fallback error:', err);
  }

  return [];
}

export async function fetchCurrentAffairsFeed(): Promise<CapsuleStory[]> {
  // 1. Try Firestore SDK
  try {
    const dRef = doc(db, 'current_affairs_published', 'latest');
    const snap = await getDoc(dRef);
    if (snap.exists()) {
      const data = snap.data();
      const stories: any[] = data.stories || [];
      if (stories.length > 0) {
        return stories.map(s => normalizeStory(s));
      }
    }
  } catch (err) {
    console.warn('Firestore SDK current affairs error, falling back:', err);
  }

  // 2. Try Firestore REST
  try {
    const data = await fetchFirestoreDocRest('current_affairs_published', 'latest');
    if (data && data.stories && data.stories.length > 0) {
      return (data.stories as any[]).map(s => normalizeStory(s));
    }
  } catch (err) {
    console.warn('Firestore REST current affairs error:', err);
  }

  // 3. Fallback to bundled snapshot
  try {
    const res = await fetch('/data/current_affairs_latest.json');
    if (res.ok) {
      const json = await res.json();
      const stories: any[] = json.stories || [];
      return stories.map(s => normalizeStory(s));
    }
  } catch (err) {
    console.error('Static current_affairs fallback error:', err);
  }

  return [];
}

export async function fetchHourlyWiresFeed(): Promise<CapsuleStory[]> {
  // 1. Try Firestore SDK
  try {
    const q = query(collection(db, 'hourly_buzz'), limit(25));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: CapsuleStory[] = [];
      snap.forEach(doc => {
        list.push(normalizeStory(doc.data()));
      });
      if (list.length > 0) return list;
    }
  } catch (err) {
    console.warn('Firestore SDK hourly buzz error, falling back:', err);
  }

  // 2. Try Firestore REST
  try {
    const restItems = await fetchFirestoreRest('hourly_buzz', 25);
    if (restItems.length > 0) {
      return restItems.map(item => normalizeStory(item));
    }
  } catch (err) {
    console.warn('Firestore REST hourly error:', err);
  }

  // 3. Fallback to bundled snapshot
  try {
    const res = await fetch('/data/hourly_buzz_latest.json');
    if (res.ok) {
      const json = await res.json();
      const stories: any[] = json.stories || [];
      return stories.map(s => normalizeStory(s));
    }
  } catch (err) {
    console.error('Static hourly_buzz fallback error:', err);
  }

  return [];
}
