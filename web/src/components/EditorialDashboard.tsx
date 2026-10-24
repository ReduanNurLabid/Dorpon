import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useApp } from '../context/AppContext';
import { CapsuleStory } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  LogOut, 
  Save, 
  RefreshCw, 
  Search, 
  FileEdit, 
  Trash2, 
  PlusCircle, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  BarChart2,
  Sliders,
  Layers,
  ArrowLeft
} from 'lucide-react';

const AUTHORIZED_EMAILS = ['nurreduan.pp@gmail.com', 'reduannurlabid@gmail.com'];

export const WEBSITE_CATEGORY_DESKS = [
  { value: 'governance_law', label: 'Governance & Law (শাসনব্যবস্থা ও রাজনীতি)' },
  { value: 'economy_business', label: 'Economy & Business (অর্থনীতি ও বাণিজ্য)' },
  { value: 'world_diplomacy', label: 'World & Geopolitics (আন্তর্জাতিক ও কূটনীতি)' },
  { value: 'tech_infrastructure', label: 'Technology & AI (প্রযুক্তি ও উদ্ভাবন)' },
  { value: 'climate_delta', label: 'Climate & Environment (পরিবেশ ও জলবায়ু)' },
  { value: 'society_education', label: 'Society & Education (সমাজ ও শিক্ষা)' },
  { value: 'sports_fitness', label: 'Sports & Fitness (খেলাধুলা)' },
  { value: 'infrastructure_energy', label: 'Infrastructure & Energy (অবকাঠামো ও জ্বালানি)' },
  { value: 'national', label: 'National Affairs (জাতীয় বিষয়াবলী)' },
  { value: 'pop_culture', label: 'Culture & Entertainment (সংস্কৃতি ও বিনোদন)' },
];

// Helper to recursively remove undefined values before writing to Firestore
function cleanForFirestore(val: any): any {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map((item) => cleanForFirestore(item));
  }
  if (typeof val === 'object' && !(val instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      const v = val[key];
      if (v !== undefined) {
        cleaned[key] = cleanForFirestore(v);
      }
    }
    return cleaned;
  }
  return val;
}

// Web Broadsheet Scoring and Placement Calculator
export function computeWebStoryScore(story: CapsuleStory): {
  baseScore: number;
  finalRankScore: number;
  breakdown: string[];
  suggestedSlot: 'Hero (Center Fold)' | 'Column 1 (Left)' | 'Column 3 (Wire Desk)' | 'Inside Broadsheet Grid';
} {
  let base = story.importance_score ?? 2.0;
  const breakdown: string[] = [`Base: ${base.toFixed(1)}`];

  const title = ((story.daily_buzz?.title_bn || '') + ' ' + (story.daily_buzz?.title_en || '')).toLowerCase();
  const summary = ((story.daily_buzz?.summary_bn || '') + ' ' + (story.daily_buzz?.summary_en || '')).toLowerCase();
  const text = `${title} ${summary}`;

  if (/constitution|সংবিধান|supreme court|সুপ্রিম কোর্ট|high court|হাইকোর্ট|chief adviser|প্রধান উপদেষ্টা|prime minister|প্রধানমন্ত্রী|cabinet|মন্ত্রিসভা|election commission|নির্বাচন কমিশন|ordinance|অধ্যাদেশ/i.test(text)) {
    base += 3.5;
    breakdown.push('Gov/State (+3.5)');
  }

  if (/bangladesh bank|বাংলাদেশ ব্যাংক|repo rate|রেপো রেট|inflation|মুদ্রাস্ফীতি|মূল্যস্ফীতি|forex reserve|রিজার্ভ|budget|বাজেট|nbr|রাজস্ব|imf|world bank/i.test(text)) {
    base += 3.0;
    breakdown.push('Economy (+3.0)');
  }

  if (/tarique|তারেক|remittance|প্রবাসী|rohingya|রোহিঙ্গা|arrest|আটক|গ্রেপ্তার|murder|হামলা/i.test(text)) {
    base += 2.0;
    breakdown.push('Politics/Law (+2.0)');
  }

  if (story.is_bcs_pro_selected || story.bcs_pro) {
    base += 2.0;
    breakdown.push('Current Affairs (+2.0)');
  }

  const srcCount = story.sources?.length || 1;
  if (srcCount > 1) {
    const mult = 1.0 + Math.min(0.5, (srcCount - 1) * 0.25);
    base *= mult;
    breakdown.push(`Sources ×${mult.toFixed(2)}`);
  }

  // Time decay
  let finalRank = base;
  if (story.published_at) {
    const pubTime = new Date(story.published_at).getTime();
    if (!isNaN(pubTime)) {
      const ageHours = Math.max(0, (Date.now() - pubTime) / (3600 * 1000));
      let decay = Math.pow(ageHours + 2.0, 1.3);
      if (ageHours > 30) {
        decay *= Math.pow(1.0 + (ageHours - 30), 2.0);
      }
      finalRank = base / decay;
    }
  }

  // Determine slot placement on web broadsheet
  let suggestedSlot: 'Hero (Center Fold)' | 'Column 1 (Left)' | 'Column 3 (Wire Desk)' | 'Inside Broadsheet Grid' = 'Inside Broadsheet Grid';
  if (finalRank >= 1.5 || (story.importance_score && story.importance_score >= 4.0)) {
    suggestedSlot = 'Hero (Center Fold)';
  } else if (finalRank >= 0.8) {
    suggestedSlot = 'Column 1 (Left)';
  } else if (finalRank >= 0.3) {
    suggestedSlot = 'Column 3 (Wire Desk)';
  }

  return {
    baseScore: Number(base.toFixed(2)),
    finalRankScore: Number(finalRank.toFixed(3)),
    breakdown,
    suggestedSlot
  };
}

export const EditorialDashboard: React.FC = () => {
  const { setActiveTab, language } = useApp();
  const isBn = language === 'bn';

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [emailInput, setEmailInput] = useState('nurreduan.pp@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [isNewUserMode, setIsNewUserMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Stories Management
  const [activeCollection, setActiveCollection] = useState<'daily_buzz' | 'current_affairs_published' | 'hourly_buzz'>('daily_buzz');
  const [stories, setStories] = useState<CapsuleStory[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStory, setSelectedStory] = useState<CapsuleStory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');

  // Monitor Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const isAuthorized = currentUser && AUTHORIZED_EMAILS.includes(currentUser.email?.toLowerCase() || '');

  // Fetch stories when collection changes
  const loadStories = async () => {
    if (!isAuthorized) return;
    setIsLoadingStories(true);
    setStatusMessage(null);
    try {
      if (activeCollection === 'current_affairs_published') {
        const docSnap = await getDocs(collection(db, 'current_affairs_published'));
        const list: (CapsuleStory & { _docId?: string })[] = [];
        docSnap.forEach((d) => {
          const data = d.data();
          if (data.stories && Array.isArray(data.stories)) {
            data.stories.forEach((s: any, idx: number) => {
              list.push({
                ...s,
                story_id: s.story_id || s.storyId || `${d.id}-${idx}`,
                _docId: d.id,
              });
            });
          } else if (data.story_id || d.id) {
            list.push({
              ...data,
              story_id: data.story_id || data.storyId || d.id,
              _docId: d.id,
            } as CapsuleStory & { _docId?: string });
          }
        });
        setStories(list);
        if (list.length > 0) setSelectedStory(list[0]);
        else setSelectedStory(null);
      } else {
        const q = query(collection(db, activeCollection), orderBy('published_at', 'desc'), limit(150));
        const snap = await getDocs(q);
        const list: (CapsuleStory & { _docId?: string })[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const docId = d.id;
          const story_id = data.story_id || data.storyId || docId;
          list.push({
            ...data,
            story_id,
            _docId: docId,
          } as CapsuleStory & { _docId?: string });
        });
        setStories(list);
        if (list.length > 0) setSelectedStory(list[0]);
        else setSelectedStory(null);
      }
    } catch (err: any) {
      console.error('Error fetching collection:', err);
      setStatusMessage({ text: err.message || 'Failed to load stories from Firestore', type: 'error' });
    } finally {
      setIsLoadingStories(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadStories();
    }
  }, [isAuthorized, activeCollection]);

  // Auth handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthenticating(true);

    const emailTrimmed = emailInput.trim().toLowerCase();
    if (!AUTHORIZED_EMAILS.includes(emailTrimmed)) {
      setAuthError(`Email "${emailTrimmed}" is not authorized to access the Dorpon Editorial Studio.`);
      setIsAuthenticating(false);
      return;
    }

    try {
      if (isNewUserMode) {
        await createUserWithEmailAndPassword(auth, emailTrimmed, passwordInput);
        setAuthSuccess('Account created and logged in successfully!');
      } else {
        await signInWithEmailAndPassword(auth, emailTrimmed, passwordInput);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found') {
        setAuthError('User does not exist yet. Please check "First login: Set initial password".');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Incorrect password. If you forgot your password, use reset password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists. Try signing in directly.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!emailInput.trim()) {
      setAuthError('Please enter your email to receive a password reset link.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, emailInput.trim());
      setAuthSuccess('Password reset link sent to your email. Check your inbox.');
    } catch (err: any) {
      setAuthError(err.message || 'Could not send reset email.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setSelectedStory(null);
    setStories([]);
  };

  // Story editing handlers
  const handleSaveStory = async () => {
    if (!selectedStory) {
      alert('Please select an article first.');
      return;
    }
    if (!isAuthorized) {
      alert('Your email is not authorized to edit live Firestore.');
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const docId = (selectedStory as any)._docId || selectedStory.story_id;
      if (!docId) {
        throw new Error('No document ID available for this story.');
      }

      if (activeCollection === 'current_affairs_published') {
        // Update the current_affairs doc
        const updatedList = stories.map((s) => (s.story_id === selectedStory.story_id ? selectedStory : s));
        const payload = cleanForFirestore({
          stories: updatedList,
          edition_date: new Date().toISOString().split('T')[0],
          published_at: new Date().toISOString(),
          total_stories: updatedList.length,
          status: 'published'
        });
        await setDoc(doc(db, 'current_affairs_published', 'latest'), payload, { merge: true });
        setStories(updatedList);
      } else {
        const payload = cleanForFirestore({
          ...selectedStory,
          story_id: docId,
        });
        delete payload._docId;
        await setDoc(doc(db, activeCollection, docId), payload, { merge: true });
        setStories((prev) =>
          prev.map((s) =>
            s.story_id === selectedStory.story_id || (s as any)._docId === docId ? selectedStory : s
          )
        );
      }
      setStatusMessage({ text: `✓ Saved successfully to live Firestore [${docId.slice(0, 8)}...]`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving story:', err);
      const errMsg = err?.message || 'Failed to save updates to Firestore';
      setStatusMessage({ text: `Save error: ${errMsg}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!selectedStory || !isAuthorized) return;
    if (!window.confirm(`Are you sure you want to delete "${selectedStory.daily_buzz.title_en || selectedStory.story_id}" from live database?`)) {
      return;
    }
    setIsSaving(true);
    try {
      if (activeCollection === 'current_affairs_published') {
        const remaining = stories.filter((s) => s.story_id !== selectedStory.story_id);
        await setDoc(doc(db, 'current_affairs_published', 'latest'), {
          stories: remaining,
          edition_date: new Date().toISOString().split('T')[0],
          published_at: new Date().toISOString(),
          total_stories: remaining.length,
          status: 'published'
        });
        setStories(remaining);
        setSelectedStory(remaining.length > 0 ? remaining[0] : null);
      } else {
        await deleteDoc(doc(db, activeCollection, selectedStory.story_id));
        const remaining = stories.filter((s) => s.story_id !== selectedStory.story_id);
        setStories(remaining);
        setSelectedStory(remaining.length > 0 ? remaining[0] : null);
      }
      setStatusMessage({ text: 'Story successfully removed from Firestore.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to delete story', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewStory = () => {
    const newId = `editorial-${Date.now()}`;
    const newStory: CapsuleStory = {
      story_id: newId,
      primary_category: 'governance_law',
      interest_categories: ['governance_law', 'economy_business'],
      tags: ['#National', '#Policy'],
      importance_score: 3.5,
      is_bcs_pro_selected: false,
      sources: [
        { name: 'Official Gazette', url: 'https://bgp.gov.bd', snippet: 'Executive declaration and policy order' }
      ],
      daily_buzz: {
        title_en: 'New Editorial Dispatch: Headline Summary',
        title_bn: 'নতুন সম্পাদকীয় প্রতিবেদন: শিরোনাম',
        summary_en: 'Concise, high-impact analytical briefing on primary strategic developments.',
        summary_bn: 'কৌশলগত নীতি ও গুরুত্বপূর্ণ ঘটনার সুনির্দিষ্ট সারসংক্ষেপ।',
        details_en: 'Extended context and verified impact assessment across national sectors.',
        details_bn: 'জাতীয় খাত ও নীতিমালার বিস্তারিত প্রেক্ষাপট ও প্রভাব বিশ্লেষণ।',
        published_at: new Date().toISOString()
      }
    };
    setStories([newStory, ...stories]);
    setSelectedStory(newStory);
  };

  // Filtered list
  const filteredStories = stories.filter((s) => {
    const q = searchFilter.toLowerCase();
    const titleEn = s.daily_buzz?.title_en?.toLowerCase() || '';
    const titleBn = s.daily_buzz?.title_bn || '';
    const id = s.story_id?.toLowerCase() || '';
    return titleEn.includes(q) || titleBn.includes(q) || id.includes(q);
  });

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-primary">
          <RefreshCw className="w-5 h-5 animate-spin text-secondary" />
          <span className="font-serif text-sm">Verifying Dorpon Editorial Authentication...</span>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!currentUser || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-3">
            <button
              onClick={() => setActiveTab('top_stories')}
              className="inline-flex items-center gap-1.5 text-xs font-serif text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Digital Broadsheet</span>
            </button>
          </div>
          <div className="w-12 h-12 bg-primary text-background font-display-masthead font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            D
          </div>
          <h2 className="mt-4 text-center font-display-masthead text-2xl sm:text-3xl text-primary font-bold uppercase tracking-tight">
            SondeshX Editorial Studio
          </h2>
          <p className="mt-1 text-center font-serif text-xs text-on-surface-variant max-w-sm mx-auto">
            Authorized central command for web broadsheet article scoring, placement, and direct broadcast.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-surface-container border border-primary/30 p-6 sm:p-8 shadow-md">
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  Editor Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nurreduan.pp@gmail.com"
                    className="w-full bg-background border border-primary/20 text-primary text-xs pl-9 pr-3 py-2.5 focus:border-primary focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-background border border-primary/20 text-primary text-xs pl-9 pr-3 py-2.5 focus:border-primary focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-serif pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isNewUserMode}
                    onChange={(e) => setIsNewUserMode(e.target.checked)}
                    className="rounded border-primary/30 accent-primary"
                  />
                  <span className="text-on-surface-variant font-medium">First login (Set password)</span>
                </label>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-secondary hover:underline cursor-pointer font-semibold"
                >
                  Forgot password?
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-red-950/20 border border-red-500/40 text-red-500 text-xs font-serif flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-green-950/20 border border-green-500/40 text-green-500 text-xs font-serif flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-primary text-background font-sans text-xs font-bold uppercase tracking-wider py-2.5 hover:bg-surface-container-highest hover:text-primary transition-colors border border-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{isNewUserMode ? 'Register & Access Dashboard' : 'Authenticate & Open Studio'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-primary/10 text-center font-serif text-[11px] text-on-surface-variant">
              <span>Restricted to Authorized Chief Editor: <strong>nurreduan.pp@gmail.com</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD
  return (
    <div className="min-h-screen bg-background text-on-surface pb-16">
      {/* 1. TOP STUDIO NAVIGATION BAR */}
      <header className="border-b-2 border-primary bg-surface-container-high sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('top_stories')}
              className="p-1 border border-primary/30 hover:bg-primary hover:text-background transition-colors cursor-pointer"
              title="Return to Public Broadsheet"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display-masthead text-base sm:text-lg font-bold text-primary uppercase">
                  SondeshX Editorial Studio
                </span>
                <span className="inline-flex items-center gap-1 bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 text-[10px] font-mono font-bold rounded">
                  <ShieldCheck className="w-3 h-3" />
                  <span>WEB BROADSHEET COMMAND</span>
                </span>
              </div>
              <p className="font-serif text-[11px] text-on-surface-variant">
                Live placement scoring & direct publishing • Editor: <strong>{currentUser.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-surface border border-primary/30 p-0.5">
              <button
                onClick={() => setPreviewMode('editor')}
                className={`px-3 py-1 font-sans text-xs font-bold uppercase transition-colors cursor-pointer ${
                  previewMode === 'editor'
                    ? 'bg-primary text-background'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setPreviewMode('preview')}
                className={`px-3 py-1 font-sans text-xs font-bold uppercase transition-colors cursor-pointer ${
                  previewMode === 'preview'
                    ? 'bg-primary text-background'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Web Preview
              </button>
            </div>

            <button
              onClick={handleCreateNewStory}
              className="bg-secondary text-on-secondary font-sans text-xs font-bold uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5 border border-secondary hover:opacity-90 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Dispatch</span>
            </button>

            <button
              onClick={loadStories}
              disabled={isLoadingStories}
              className="bg-surface-container border border-primary/30 text-primary font-sans text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 hover:border-primary cursor-pointer"
              title="Refresh stories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStories ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleSignOut}
              className="text-on-surface-variant hover:text-red-500 font-sans text-xs font-semibold px-2 py-1 flex items-center gap-1 cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-COLLECTION TABS & SEARCH */}
      <div className="border-b border-primary/20 bg-surface-container-low px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 sm:space-x-2 font-sans text-xs font-bold uppercase">
            {[
              { id: 'daily_buzz' as const, label: 'Front Page & Buzz (daily_buzz)', count: activeCollection === 'daily_buzz' ? stories.length : undefined },
              { id: 'current_affairs_published' as const, label: 'Current Affairs Dossiers', count: activeCollection === 'current_affairs_published' ? stories.length : undefined },
              { id: 'hourly_buzz' as const, label: 'Live Hourly Wires', count: activeCollection === 'hourly_buzz' ? stories.length : undefined },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCollection(tab.id)}
                className={`px-3 py-1.5 border transition-colors cursor-pointer ${
                  activeCollection === tab.id
                    ? 'bg-primary text-background border-primary shadow-sm'
                    : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count !== 'undefined' && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-secondary text-on-secondary rounded text-[10px] font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center border border-primary/30 px-2.5 py-1 bg-surface-container w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-on-surface-variant mr-2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by headline or ID..."
              className="bg-transparent border-none text-xs text-primary placeholder:text-on-surface-variant focus:outline-none w-full font-serif"
            />
          </div>
        </div>
      </div>

      {/* STATUS NOTIFICATION BAR */}
      {statusMessage && (
        <div className={`px-4 py-2 text-center text-xs font-serif font-bold ${
          statusMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* 3. MAIN WORKSPACE: MASTER / DETAIL SPLIT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: STORY LIST REGISTER */}
        <div className="lg:col-span-5 flex flex-col h-[750px] border border-primary/20 bg-surface-container">
          <div className="p-3 border-b border-primary/20 bg-surface-container-high flex items-center justify-between">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-primary">
              Archived Documents ({filteredStories.length})
            </span>
            <span className="text-[11px] font-mono text-secondary">
              Collection: {activeCollection}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-primary/10">
            {isLoadingStories ? (
              <div className="p-8 text-center text-on-surface-variant font-serif text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-secondary" />
                Loading collection from Firestore...
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-serif text-xs">
                No stories found matching "{searchFilter}".
              </div>
            ) : (
              filteredStories.map((story) => {
                const isSelected = selectedStory?.story_id === story.story_id;
                const title = story.daily_buzz?.title_en || story.daily_buzz?.title_bn || story.story_id;
                const scoreData = computeWebStoryScore(story);

                const slotBadgeColors = {
                  'Hero (Center Fold)': 'bg-amber-500/15 text-amber-500 border-amber-500/30',
                  'Column 1 (Left)': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
                  'Column 3 (Wire Desk)': 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
                  'Inside Broadsheet Grid': 'bg-primary/10 text-primary border-primary/20',
                };

                return (
                  <button
                    key={story.story_id}
                    onClick={() => setSelectedStory(story)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : 'hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono gap-1">
                      <span className="text-secondary font-bold truncate max-w-[170px]">
                        #{story.story_id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-surface-container px-1.5 py-0.5 border border-primary/20 font-bold text-primary" title={`Base Importance: ${scoreData.baseScore} | Decayed Rank: ${scoreData.finalRankScore}`}>
                          Rank: {scoreData.finalRankScore.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-serif text-xs font-bold text-primary line-clamp-2 leading-snug">
                      {title}
                    </h4>

                    <div className="flex items-center justify-between gap-1 text-[10px] pt-1">
                      <span className={`px-2 py-0.5 border text-[10px] font-mono font-bold rounded ${slotBadgeColors[scoreData.suggestedSlot]}`}>
                        {scoreData.suggestedSlot}
                      </span>
                      <span className="text-on-surface-variant font-sans uppercase">
                        {story.published_at ? new Date(story.published_at).toLocaleDateString() : 'Draft'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DIRECT ARTICLE & SCORING EDITOR */}
        <div className="lg:col-span-7 flex flex-col h-[750px] border border-primary/20 bg-surface">
          {selectedStory ? (
            <div className="flex flex-col h-full">
              {/* Header Actions */}
              <div className="p-3 border-b border-primary/20 bg-surface-container-high flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-secondary" />
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-primary">
                    Document Editor • ID: <span className="font-mono">{selectedStory.story_id}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {statusMessage && (
                    <span className={`text-[11px] font-sans font-bold px-2.5 py-1 flex items-center gap-1.5 border shadow-xs ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40'
                    }`}>
                      {statusMessage.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{statusMessage.text}</span>
                    </span>
                  )}

                  <button
                    onClick={handleDeleteStory}
                    disabled={isSaving}
                    className="p-1.5 text-red-500 hover:bg-red-950/20 border border-red-500/30 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Delete story from Firestore"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <button
                    onClick={handleSaveStory}
                    disabled={isSaving}
                    className="bg-primary text-background font-sans text-xs font-bold uppercase px-4 py-1.5 flex items-center gap-1.5 hover:bg-surface-container-highest hover:text-primary transition-colors border border-primary cursor-pointer disabled:opacity-50 shadow-sm active:scale-98"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Saving to Firestore...' : 'Save to Live Firestore'}</span>
                  </button>
                </div>
              </div>

              {/* Form Body vs Live Broadsheet Preview */}
              {previewMode === 'preview' ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
                  <div className="max-w-2xl mx-auto border border-primary/30 p-6 bg-surface shadow-sm">
                    {/* Eyebrow & Slot placement badge */}
                    <div className="flex items-center justify-between border-b border-primary/20 pb-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-secondary text-on-secondary font-label-sm text-label-sm uppercase font-bold">
                          {selectedStory.primary_category?.replace('_', ' ')}
                        </span>
                        {selectedStory.is_bcs_pro_selected && (
                          <span className="px-2 py-0.5 bg-primary text-background font-label-sm text-label-sm uppercase font-bold">
                            Current Affairs Dossier
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-secondary font-bold">
                        Target Slot: {computeWebStoryScore(selectedStory).suggestedSlot}
                      </span>
                    </div>

                    {/* Headline EN / BN */}
                    <h2 className="font-display-headline text-xl sm:text-2xl text-primary font-bold leading-tight mb-2">
                      {isBn
                        ? (selectedStory.daily_buzz?.title_bn || selectedStory.daily_buzz?.title_en)
                        : (selectedStory.daily_buzz?.title_en || selectedStory.daily_buzz?.title_bn)}
                    </h2>

                    {/* Alternative Language Sub-headline */}
                    <h3 className="font-serif text-sm font-semibold text-secondary mb-4 italic">
                      {isBn
                        ? selectedStory.daily_buzz?.title_en
                        : selectedStory.daily_buzz?.title_bn}
                    </h3>

                    {/* Lead Paragraph */}
                    <div className="p-3 bg-surface-container-low border-l-4 border-l-secondary font-serif text-xs sm:text-sm text-primary leading-relaxed mb-4 text-justify">
                      {isBn
                        ? (selectedStory.daily_buzz?.summary_bn || selectedStory.daily_buzz?.summary_en)
                        : (selectedStory.daily_buzz?.summary_en || selectedStory.daily_buzz?.summary_bn)}
                    </div>

                    {/* Key Bullets */}
                    {((selectedStory.daily_buzz?.bullets_bn && selectedStory.daily_buzz.bullets_bn.length > 0) ||
                      (selectedStory.daily_buzz?.bullets_en && selectedStory.daily_buzz.bullets_en.length > 0)) && (
                      <div className="mb-4 p-3 bg-surface-container border border-primary/20">
                        <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-secondary block mb-2">
                          Key Analytical Dispatches
                        </span>
                        <ul className="space-y-1.5 list-disc list-inside text-xs font-serif text-primary">
                          {(isBn
                            ? (selectedStory.daily_buzz?.bullets_bn || selectedStory.daily_buzz?.bullets_en)
                            : (selectedStory.daily_buzz?.bullets_en || selectedStory.daily_buzz?.bullets_bn)
                          )?.map((bullet, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extended Details */}
                    {selectedStory.daily_buzz?.details_en && (
                      <p className="font-serif text-xs text-on-surface-variant leading-relaxed text-justify mb-4">
                        {isBn
                          ? (selectedStory.daily_buzz?.details_bn || selectedStory.daily_buzz?.details_en)
                          : (selectedStory.daily_buzz?.details_en || selectedStory.daily_buzz?.details_bn)}
                      </p>
                    )}

                    {/* Sources footer */}
                    {selectedStory.sources && selectedStory.sources.length > 0 && (
                      <div className="pt-3 border-t border-primary/20 flex flex-wrap items-center gap-2">
                        <span className="font-sans text-[10px] font-bold uppercase text-outline">Verified Sources:</span>
                        {selectedStory.sources.map((src, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 bg-surface-container-high border border-outline-variant text-[10px] font-mono font-bold text-primary">
                            {src.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                  {/* 1. SCORING & EDITORIAL PLACEMENT WEIGHTS */}
                  {(() => {
                    const scoreData = computeWebStoryScore(selectedStory);
                    return (
                      <div className="border border-secondary/30 bg-secondary/5 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between border-b border-secondary/20 pb-2 gap-2">
                          <div className="flex items-center space-x-2 font-sans text-xs font-bold uppercase text-secondary">
                            <Sliders className="w-4 h-4" />
                            <span>Web Broadsheet Placement & Scoring Engine</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-secondary text-on-secondary px-2 py-0.5 text-xs font-mono font-bold rounded">
                              Slot: {scoreData.suggestedSlot}
                            </span>
                          </div>
                        </div>

                        {/* Real dynamic score telemetry */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 font-mono text-xs">
                          <div className="p-2 bg-surface-container border border-primary/20">
                            <span className="text-[10px] text-on-surface-variant uppercase block font-sans">Base Importance</span>
                            <span className="text-sm font-bold text-primary">{scoreData.baseScore}</span>
                          </div>
                          <div className="p-2 bg-surface-container border border-primary/20">
                            <span className="text-[10px] text-on-surface-variant uppercase block font-sans">Final Decayed Rank</span>
                            <span className="text-sm font-bold text-secondary">{scoreData.finalRankScore}</span>
                          </div>
                          <div className="p-2 bg-surface-container border border-primary/20 col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-on-surface-variant uppercase block font-sans">Editorial Signals</span>
                            <div className="text-[10px] text-primary truncate" title={scoreData.breakdown.join(' | ')}>
                              {scoreData.breakdown.join(' • ')}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-serif text-on-surface-variant font-semibold">
                                Editorial Base Override (1.0 to 10.0)
                              </label>
                              <span className="text-xs font-mono font-bold text-primary">
                                {selectedStory.importance_score ?? 2.0}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1.0"
                              max="10.0"
                              step="0.5"
                              value={selectedStory.importance_score ?? 2.0}
                              onChange={(e) =>
                                setSelectedStory({
                                  ...selectedStory,
                                  importance_score: parseFloat(e.target.value)
                                })
                              }
                              className="w-full accent-secondary cursor-pointer"
                            />
                            <span className="text-[10px] text-on-surface-variant font-serif block mt-1">
                              Setting score ≥ 4.0 immediately promotes this dispatch into the Center Hero slot on the website.
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-serif text-on-surface-variant font-semibold">
                              Website Category Desk
                            </label>
                            {(() => {
                              const currentCatLower = (selectedStory.primary_category || '').toLowerCase();
                              const isUnmatched = !WEBSITE_CATEGORY_DESKS.some(
                                (d) => d.value.toLowerCase() === currentCatLower
                              );

                              return (
                                <select
                                  value={selectedStory.primary_category}
                                  onChange={(e) => {
                                    const newCat = e.target.value;
                                    setSelectedStory({
                                      ...selectedStory,
                                      primary_category: newCat,
                                      interest_categories: Array.from(new Set([newCat, ...(selectedStory.interest_categories || [])]))
                                    });
                                  }}
                                  className="w-full bg-surface border border-primary/30 text-xs text-primary p-2 focus:outline-none font-sans font-medium"
                                >
                                  {isUnmatched && selectedStory.primary_category && (
                                    <option value={selectedStory.primary_category}>
                                      {selectedStory.primary_category} (Current Desk)
                                    </option>
                                  )}
                                  {WEBSITE_CATEGORY_DESKS.map((desk) => {
                                    const isCurrent = currentCatLower === desk.value.toLowerCase();
                                    const optionValue = isCurrent ? selectedStory.primary_category : desk.value;
                                    return (
                                      <option key={desk.value} value={optionValue}>
                                        {desk.label}
                                      </option>
                                    );
                                  })}
                                </select>
                              );
                            })()}

                            <label className="flex items-center gap-2 cursor-pointer pt-1 select-none text-xs font-serif">
                              <input
                                type="checkbox"
                                checked={selectedStory.is_bcs_pro_selected}
                                onChange={(e) =>
                                  setSelectedStory({
                                    ...selectedStory,
                                    is_bcs_pro_selected: e.target.checked
                                  })
                                }
                                className="accent-secondary"
                              />
                              <span className="font-semibold text-primary">Current Affairs / BCS Pro Analytical Badge</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* 2. ENGLISH COPYWRITING */}
                <div className="space-y-3">
                  <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-primary border-b border-primary/20 pb-1">
                    English Editorial Text
                  </h5>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1">
                      Headline (Title EN)
                    </label>
                    <input
                      type="text"
                      value={selectedStory.daily_buzz?.title_en || ''}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          daily_buzz: { ...selectedStory.daily_buzz, title_en: e.target.value }
                        })
                      }
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-serif font-bold text-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1">
                      Lead Paragraph / Executive Summary (EN)
                    </label>
                    <textarea
                      rows={3}
                      value={selectedStory.daily_buzz?.summary_en || ''}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          daily_buzz: { ...selectedStory.daily_buzz, summary_en: e.target.value }
                        })
                      }
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-serif text-primary focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1">
                      Deep Analytical Details (EN)
                    </label>
                    <textarea
                      rows={4}
                      value={selectedStory.daily_buzz?.details_en || ''}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          daily_buzz: { ...selectedStory.daily_buzz, details_en: e.target.value }
                        })
                      }
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-serif text-primary focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1">
                      Key Takeaway Bullets (EN) — One bullet point per line
                    </label>
                    <textarea
                      rows={3}
                      value={(selectedStory.daily_buzz?.bullets_en || []).join('\n')}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          daily_buzz: {
                            ...selectedStory.daily_buzz,
                            bullets_en: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                          }
                        })
                      }
                      placeholder="• First analytical point&#10;• Policy decision or statistic&#10;• Strategic consequence"
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-serif text-primary focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* 3. BANGLA COPYWRITING */}
                <div className="space-y-3 pt-3 border-t border-primary/20">
                  <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-primary border-b border-primary/20 pb-1">
                    বাংলা সম্পাদকীয় টেক্সট
                  </h5>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1 font-bangla">
                      শিরোনাম (Title BN)
                    </label>
                    <input
                      type="text"
                      value={selectedStory.daily_buzz?.title_bn || ''}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          daily_buzz: { ...selectedStory.daily_buzz, title_bn: e.target.value }
                        })
                      }
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-serif font-bold text-primary focus:outline-none font-bangla"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1 font-bangla">
                      নির্বাহী সারসংক্ষেপ (Summary BN)
                    </label>
                    <textarea
                      rows={3}
                      value={selectedStory.daily_buzz?.summary_bn || ''}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          daily_buzz: { ...selectedStory.daily_buzz, summary_bn: e.target.value }
                        })
                      }
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-serif text-primary focus:outline-none leading-relaxed font-bangla"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1 font-bangla">
                      বিশ্লেষণাত্মক প্রেক্ষাপট (Details BN)
                    </label>
                    <textarea
                      rows={4}
                      value={selectedStory.daily_buzz?.details_bn || ''}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          daily_buzz: { ...selectedStory.daily_buzz, details_bn: e.target.value }
                        })
                      }
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-serif text-primary focus:outline-none leading-relaxed font-bangla"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1 font-bangla">
                      প্রধান বিশ্লেষণাত্মক বুলেট পয়েন্ট (BN) — প্রতি লাইনে একটি পয়েন্ট
                    </label>
                    <textarea
                      rows={3}
                      value={(selectedStory.daily_buzz?.bullets_bn || []).join('\n')}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          daily_buzz: {
                            ...selectedStory.daily_buzz,
                            bullets_bn: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                          }
                        })
                      }
                      placeholder="• প্রথম গুরুত্বপূর্ণ তথ্য&#10;• নীতিগত প্রেক্ষাপট বা পরিসংখ্যান&#10;• ভবিষ্যৎ প্রভাব"
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-serif text-primary focus:outline-none leading-relaxed font-bangla"
                    />
                  </div>
                </div>

                {/* 4. SOURCES & METADATA */}
                <div className="space-y-3 pt-3 border-t border-primary/20">
                  <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-primary border-b border-primary/20 pb-1">
                    Sources, Image & Timestamp
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1">
                        Hero Photo URL
                      </label>
                      <input
                        type="text"
                        value={selectedStory.image_url || ''}
                        onChange={(e) =>
                          setSelectedStory({
                            ...selectedStory,
                            image_url: e.target.value || null
                          })
                        }
                        placeholder="https://..."
                        className="w-full bg-surface border border-primary/30 p-2 text-xs font-mono text-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1">
                        Publication Timestamp
                      </label>
                      <input
                        type="text"
                        value={selectedStory.published_at || ''}
                        onChange={(e) =>
                          setSelectedStory({
                            ...selectedStory,
                            published_at: e.target.value
                          })
                        }
                        className="w-full bg-surface border border-primary/30 p-2 text-xs font-mono text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-on-surface-variant mb-1">
                      Editorial Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={selectedStory.tags?.join(', ') || ''}
                      onChange={(e) =>
                        setSelectedStory({
                          ...selectedStory,
                          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                        })
                      }
                      className="w-full bg-surface border border-primary/30 p-2 text-xs font-mono text-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <Layers className="w-10 h-10 mb-3 text-secondary/40" />
              <h4 className="font-serif text-base font-bold text-primary mb-1">
                No Article Selected
              </h4>
              <p className="font-serif text-xs max-w-sm">
                Select an archived story from the left register to adjust scoring, edit bilingual copies, or create a new dispatch.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
