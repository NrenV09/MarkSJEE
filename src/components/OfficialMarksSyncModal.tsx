/**
 * OfficialMarksSyncModal.tsx
 * Interactive modal to connect directly with the official MARKS (MathonGo) platform (web.getmarks.app)
 * Allows users to link their MARKS JWT token, verify their profile, and fetch chapter questions
 * directly from production.getmarks.app into local IndexedDB.
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  HelpCircle,
  Copy,
  Check,
  Download,
  Terminal,
  UserCheck
} from 'lucide-react';
import { 
  verifyMarksSession, 
  fetchMarksChapterQuestions, 
  MarksUserProfile 
} from '../services/marksOfficialApi';
import { bulkInsertQuestionsChunk } from '../db/db';

interface OfficialMarksSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsIngested: () => void;
}

const JEE_SUBJECT_CHAPTERS = {
  physics: [
    { id: 'kinematics', title: 'Kinematics (1D & 2D)' },
    { id: 'laws-of-motion', title: 'Laws of Motion & Friction' },
    { id: 'work-power-energy', title: 'Work, Power & Energy' },
    { id: 'rotational-motion', title: 'Rotational Motion' },
    { id: 'electrostatics', title: 'Electrostatics & Gauss Law' },
    { id: 'current-electricity', title: 'Current Electricity' },
    { id: 'magnetic-effects-of-current', title: 'Magnetic Effects of Current' },
    { id: 'electromagnetic-induction', title: 'Electromagnetic Induction & AC' },
    { id: 'optics', title: 'Ray & Wave Optics' },
    { id: 'modern-physics', title: 'Modern Physics & Dual Nature' }
  ],
  chemistry: [
    { id: 'some-basic-concepts-of-chemistry', title: 'Mole Concept & Stoichiometry' },
    { id: 'atomic-structure', title: 'Atomic Structure' },
    { id: 'chemical-bonding-and-molecular-structure', title: 'Chemical Bonding' },
    { id: 'chemical-thermodynamics', title: 'Thermodynamics & Energetics' },
    { id: 'chemical-and-ionic-equilibrium', title: 'Chemical & Ionic Equilibrium' },
    { id: 'coordination-compounds', title: 'Coordination Compounds' },
    { id: 'p-block-elements', title: 'p-Block Elements' },
    { id: 'general-organic-chemistry', title: 'General Organic Chemistry (GOC)' },
    { id: 'hydrocarbons', title: 'Hydrocarbons' },
    { id: 'aldehydes-ketones-and-carboxylic-acids', title: 'Aldehydes, Ketones & Acids' }
  ],
  maths: [
    { id: 'sets-relations-and-functions', title: 'Sets, Relations & Functions' },
    { id: 'complex-numbers-and-quadratic-equations', title: 'Complex Numbers & Quadratics' },
    { id: 'matrices-and-determinants', title: 'Matrices & Determinants' },
    { id: 'permutations-and-combinations', title: 'Permutations & Combinations' },
    { id: 'binomial-theorem', title: 'Binomial Theorem' },
    { id: 'limits-continuity-and-differentiability', title: 'Limits, Continuity & Differentiability' },
    { id: 'application-of-derivatives', title: 'Application of Derivatives' },
    { id: 'indefinite-and-definite-integrals', title: 'Integrals (Definite & Indefinite)' },
    { id: 'differential-equations', title: 'Differential Equations' },
    { id: 'coordinate-geometry-straight-lines', title: 'Coordinate Geometry (Lines & Circles)' },
    { id: 'vectors-and-3d-geometry', title: 'Vector Algebra & 3D Geometry' }
  ]
};

export const OfficialMarksSyncModal: React.FC<OfficialMarksSyncModalProps> = ({
  isOpen,
  onClose,
  onQuestionsIngested
}) => {
  const [token, setToken] = useState<string>('');
  const [userProfile, setUserProfile] = useState<MarksUserProfile | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // Ingestion settings
  const [selectedSubject, setSelectedSubject] = useState<'physics' | 'chemistry' | 'maths'>('maths');
  const [selectedChapter, setSelectedChapter] = useState<string>('matrices-and-determinants');
  const [customChapterSlug, setCustomChapterSlug] = useState<string>('');
  const [fetchLimit, setFetchLimit] = useState<number>(25);

  // Sync progress
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState<number>(0);

  // Load saved token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('marks_official_token');
    if (savedToken) {
      setToken(savedToken);
      verifyMarksSession(savedToken)
        .then(profile => setUserProfile(profile))
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('marks_official_token');
        });
    }
  }, []);

  if (!isOpen) return null;

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setAuthError('Please paste your MARKS auth token first.');
      return;
    }

    setIsValidating(true);
    setAuthError(null);

    try {
      const profile = await verifyMarksSession(token);
      setUserProfile(profile);
      localStorage.setItem('marks_official_token', token.trim());
    } catch (err: any) {
      setUserProfile(null);
      setAuthError(err.message || 'Verification failed. Please check your token.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDisconnect = () => {
    setUserProfile(null);
    setToken('');
    localStorage.removeItem('marks_official_token');
  };

  const copyScriptSnippet = () => {
    const code = "copy(localStorage.getItem('token'))";
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleFetchQuestions = async () => {
    if (!token.trim()) {
      setAuthError('Authentication token is required to fetch questions.');
      return;
    }

    setIsFetching(true);
    setFetchStatus('Connecting to production.getmarks.app...');
    setFetchCount(0);

    const chapterId = customChapterSlug.trim() || selectedChapter;

    try {
      setFetchStatus(`Querying MARKS for ${selectedSubject.toUpperCase()} / ${chapterId}...`);
      const result = await fetchMarksChapterQuestions({
        token,
        subjectId: selectedSubject,
        chapterId,
        limit: fetchLimit
      });

      if (result.questions.length === 0) {
        setFetchStatus('No questions found for this chapter on MARKS servers.');
        setIsFetching(false);
        return;
      }

      setFetchStatus(`Inserting ${result.questions.length} questions into local IndexedDB...`);
      await bulkInsertQuestionsChunk(result.questions);
      setFetchCount(result.questions.length);
      setFetchStatus(`Successfully imported ${result.questions.length} questions from MARKS!`);
      onQuestionsIngested();
    } catch (err: any) {
      setFetchStatus(`Fetch failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Official MARKS (MathonGo) Sync</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50 uppercase tracking-wider font-semibold">
                  API v4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Retrieve official JEE questions directly from web.getmarks.app servers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Profile / Connection Card */}
          {userProfile ? (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-emerald-200 flex items-center gap-2">
                    <span>Connected to MARKS</span>
                    {userProfile.isPremium && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300">{userProfile.name} {userProfile.email ? `(${userProfile.email})` : ''}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Category: {userProfile.examCategory || 'Engineering (JEE)'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/50 rounded-lg hover:bg-rose-900/50 transition font-medium"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>MARKS Auth Bearer Token</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelper(!showHelper)}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] underline"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>How to get your token</span>
                </button>
              </div>

              {/* Instructions Guide */}
              {showHelper && (
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 space-y-2.5 text-xs animate-in fade-in">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>How to retrieve your MARKS Token (30 seconds):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    <li>
                      Open and log in to{' '}
                      <a 
                        href="https://web.getmarks.app" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        web.getmarks.app <ExternalLink className="w-2.5 h-2.5 inline" />
                      </a>
                    </li>
                    <li>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px]">F12</kbd> or right-click &gt; Inspect &gt; Console tab.</li>
                    <li>
                      Run this snippet to copy your token to clipboard:
                      <div className="mt-1 flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                        <code>copy(localStorage.getItem('token'))</code>
                        <button
                          onClick={copyScriptSnippet}
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 text-[10px]"
                        >
                          {copiedSnippet ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </li>
                    <li>Paste the copied token in the box below and click Verify.</li>
                  </ol>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste JWT token (e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6...)"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  disabled={isValidating || !token.trim()}
                  onClick={handleVerifyToken}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}
            </div>
          )}

          {/* Question Retrieval Settings */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Fetch & Cache Questions into IndexedDB</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    const sub = e.target.value as 'physics' | 'chemistry' | 'maths';
                    setSelectedSubject(sub);
                    setSelectedChapter(JEE_SUBJECT_CHAPTERS[sub][0].id);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="maths">Mathematics</option>
                </select>
              </div>

              {/* Questions Count */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">Batch Size</label>
                <select
                  value={fetchLimit}
                  onChange={(e) => setFetchLimit(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={25}>25 Questions</option>
                  <option value={50}>50 Questions</option>
                  <option value={100}>100 Questions</option>
                </select>
              </div>
            </div>

            {/* Chapter Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Select Official MARKS Chapter</label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {JEE_SUBJECT_CHAPTERS[selectedSubject].map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                ))}
              </select>
            </div>

            {/* Custom Chapter Slug override */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Or custom MARKS chapter ID / slug (optional):</label>
              <input
                type="text"
                placeholder="e.g. rotation, thermodynamics, electrostatics"
                value={customChapterSlug}
                onChange={(e) => setCustomChapterSlug(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              />
            </div>

            {/* Action Button */}
            <button
              disabled={isFetching || !token.trim()}
              onClick={handleFetchQuestions}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              {isFetching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Fetching from production.getmarks.app...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Fetch Official Questions & Cache Offline</span>
                </>
              )}
            </button>

            {/* Status Message */}
            {fetchStatus && (
              <div className={`p-3 rounded-xl text-xs font-mono border ${
                fetchCount > 0 
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}>
                {fetchStatus}
              </div>
            )}
          </div>

          {/* Pre-Bundled Archive Note */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-indigo-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Offline Question Archive (Already Included)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Don't have a MARKS account? MarksJEE already ships with an authentic offline JEE Main archive covering Physics, Chemistry, and Mathematics from 2002–2026 with full LaTeX math formulas, chapter breakdown, and CBT mock exam mode. You can load it anytime with <strong>One-Click Local Sync</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Official API: <code className="text-slate-300 font-mono text-[10px]">production.getmarks.app/api/v4</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
