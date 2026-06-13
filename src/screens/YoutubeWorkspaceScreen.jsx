import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Play, 
  Loader2, 
  Video,
  AlertCircle,
  Sparkles,
  Zap,
  Activity,
  Copy,
  Check,
  FileText
} from 'lucide-react';

const YoutubeIcon = ({ className = '', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

export default function YoutubeWorkspaceScreen() {
  const {
    currentWorkspaceId,
    workspaces,
    getWorkspaceLinks,
    saveWorkspaceMetadata,
    navigateToWorkspaces,
    showConfirm
  } = useStore();

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  const links = getWorkspaceLinks(currentWorkspaceId);

  const [newLink, setNewLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Advanced interactive states
  const [sortBy, setSortBy] = useState('newest');
  const [expandedNotesId, setExpandedNotesId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [localNotes, setLocalNotes] = useState('');
  const [activeNotesId, setActiveNotesId] = useState(null);

  // Clear states when workspace changes
  useEffect(() => {
    setActiveVideoId(null);
    setNewLink('');
    setSearchQuery('');
    setErrorMsg(null);
    setExpandedNotesId(null);
    setCopiedId(null);
    setActiveNotesId(null);
  }, [currentWorkspaceId]);

  // Extract YouTube ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Fetch oEmbed details
  const fetchVideoMetadata = async (url) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;

    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (res.ok) {
        const data = await res.json();
        return {
          id: `${videoId}-${Date.now()}`,
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: data.title || `YouTube Video`,
          authorName: data.author_name || 'YouTube Channel',
          thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          addedAt: new Date().toISOString(),
          watched: false,
          notes: '',
          customTag: ''
        };
      }
    } catch (e) {
      console.warn('YouTube oEmbed API failed, using fallback:', e);
    }

    return {
      id: `${videoId}-${Date.now()}`,
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: `YouTube Video (${videoId})`,
      authorName: 'YouTube',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      addedAt: new Date().toISOString(),
      watched: false,
      notes: '',
      customTag: ''
    };
  };

  const handleAddVideo = async (urlToUse) => {
    const targetUrl = urlToUse || newLink;
    if (!targetUrl.trim()) return;

    const videoId = getYouTubeVideoId(targetUrl);
    if (!videoId) {
      setErrorMsg('Invalid YouTube URL. Paste a valid watch link or short URL.');
      return;
    }

    if (links.some(link => link.videoId === videoId) && !urlToUse) {
      setErrorMsg('This video is already in your feed.');
      return;
    }

    setIsAdding(true);
    setErrorMsg(null);

    const videoMetadata = await fetchVideoMetadata(targetUrl);
    if (videoMetadata) {
      const updatedLinks = [videoMetadata, ...links];
      await saveWorkspaceMetadata(currentWorkspaceId, 'youtube', updatedLinks);
      if (!urlToUse) setNewLink('');
    } else {
      setErrorMsg('Failed to retrieve video details. Please try again.');
    }
    setIsAdding(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleAddVideo();
  };

  const handleRemoveVideo = (idToRemove) => {
    const video = links.find(link => link.id === idToRemove);
    showConfirm({
      title: 'Remove Video',
      message: `Are you sure you want to remove "${video?.title || 'this video'}" from this workspace feed?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        const updatedLinks = links.filter(link => link.id !== idToRemove);
        await saveWorkspaceMetadata(currentWorkspaceId, 'youtube', updatedLinks);
        if (activeVideoId === idToRemove) {
          setActiveVideoId(null);
        }
      }
    });
  };

  // Functional Mutators

  // Local state notes buffer
  const handleNotesFocus = (id, currentVal) => {
    setActiveNotesId(id);
    setLocalNotes(currentVal || '');
  };

  const handleNotesBlur = (id) => {
    handleUpdateNotes(id, localNotes);
    setActiveNotesId(null);
  };

  // Clipboard Copier
  const handleCopyLink = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Template videos to seed an empty workspace
  const seedTemplates = [
    { title: 'Lofi Hip Hop Radio', desc: 'Chill beats to study or relax to', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
    { title: 'Space/Nebula Exploration', desc: 'Cosmic views & ambient sounds', url: 'https://www.youtube.com/watch?v=w331Zf-Eab4' },
    { title: 'Learn React in 10 Minutes', desc: 'Quick introductory crash course', url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8' },
    { title: 'Nature Relaxation 4K', desc: 'Forest birds and rain ambience', url: 'https://www.youtube.com/watch?v=IPUQXKzpHZ8' }
  ];

  const handleUpdateNotes = async (id, notesText) => {
    const updatedLinks = links.map(link => 
      link.id === id ? { ...link, notes: notesText } : link
    );
    await saveWorkspaceMetadata(currentWorkspaceId, 'youtube', updatedLinks);
  };

  displayLinks.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.addedAt) - new Date(a.addedAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.addedAt) - new Date(b.addedAt);
    }
    return 0;
  });

  let displayLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentWorkspace) return null;

  return (
    <div className="w-full h-full overflow-y-auto bg-transparent text-text p-6 flex flex-col font-sans relative">
      
      {/* CSS Animations */}
      <style>{`
        @keyframes cardEntry {
          0% { opacity: 0; transform: scale(0.99) translateY(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .animate-card { animation: cardEntry 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        
        .mesh-bg {
          background-image: radial-gradient(circle at 50% 15%, rgba(239, 68, 68, 0.08) 0%, transparent 65%);
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 0;
        }
      `}</style>

      {/* Decorative BG Mesh */}
      <div className="mesh-bg" />

      {/* Top Controls Bar */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-8 border-b border-border/80 pb-6">
        
        {/* Workspace Title Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={navigateToWorkspaces}
            className="p-2.5 bg-surface/40 hover:bg-surface border border-border/60 hover:border-accent/30 text-text-muted hover:text-text rounded-xl transition-all duration-200 cursor-pointer active:scale-90 shadow-md"
            title="Back to board"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-text via-text/90 to-red-400 bg-clip-text text-transparent">
              {currentWorkspace.name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] bg-red-500/10 border border-red-500/35 text-red-500 font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                <YoutubeIcon className="w-3 h-3 fill-red-500 text-red-500" />
                Live Feed
              </span>
              <span className="text-xs text-text-muted font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" /> {links.length} items loaded
              </span>
            </div>
          </div>
        </div>

        {/* Input & Search Interface */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-stretch">
          
          {/* Sorting Controls */}
          {links.length > 0 && (
            <div className="flex gap-2.5 flex-1 md:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface/50 border border-border/80 hover:border-accent/30 text-xs text-text-muted hover:text-text rounded-xl px-3 py-2 outline-none cursor-pointer transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          )}

          {/* Live Search */}
          {links.length > 0 && (
            <div className="relative flex-1 md:w-48">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Filter index..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface/50 backdrop-blur-md border border-border/80 focus:border-accent rounded-xl pl-10 pr-4 py-2 text-xs text-text placeholder-text-muted outline-none transition-all duration-200 focus:shadow-lg focus:shadow-accent/5 focus:bg-surface/85"
              />
            </div>
          )}

          {/* Add Link Glowing Form */}
          <form onSubmit={handleFormSubmit} className="flex gap-2 flex-1 md:flex-initial">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                placeholder="Paste Youtube link (e.g. watch, short, channel)..."
                value={newLink}
                onChange={(e) => {
                  setNewLink(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`w-full bg-surface/50 backdrop-blur-md border ${
                  errorMsg 
                    ? 'border-red-500 focus:border-red-500 animate-pulse' 
                    : 'border-border/85 focus:border-accent'
                } rounded-xl px-4 py-2 text-xs text-text placeholder-text-muted outline-none transition-all duration-200 focus:shadow-lg focus:shadow-accent/5 focus:bg-surface/80`}
              />
            </div>
            
            <button
              type="submit"
              disabled={isAdding || !newLink.trim()}
              className="py-2 px-4 bg-text hover:opacity-90 disabled:bg-surface/40 disabled:text-text-muted text-bg text-xs font-extrabold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-lg cursor-pointer border-none select-none"
            >
              {isAdding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Ingest</span>
            </button>
          </form>
        </div>
      </div>

      {/* Error Announcement */}
      {errorMsg && (
        <div className="relative z-10 mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-xs text-red-400 max-w-2xl animate-in slide-in-from-top-2 duration-300 shadow-lg shadow-red-950/25">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Empty State Grid */}
      {links.length === 0 ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-12 px-4 max-w-3xl mx-auto text-center">
          
          <div className="w-20 h-20 bg-surface/60 border border-border/80 hover:border-red-500 rounded-3xl flex items-center justify-center mb-6 text-red-500 shadow-2xl cursor-pointer hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all duration-200">
            <YoutubeIcon className="w-10 h-10 text-red-500 fill-current" />
          </div>
          
          <h2 className="text-xl font-black text-text mb-2 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            Initialize Your Workspace
          </h2>
          
          <p className="text-xs text-text-muted max-w-md mb-10 leading-relaxed font-medium">
            No video streams registered. Input a YouTube link above or choose one of the quick launchpad options below to seed immediately!
          </p>

          <div className="w-full bg-surface/25 border border-border/60 rounded-2xl p-6 backdrop-blur-sm shadow-inner">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-4 flex items-center justify-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Seed Nodes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {seedTemplates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleAddVideo(tpl.url)}
                  disabled={isAdding}
                  className="p-4 bg-surface/40 hover:bg-surface/90 border border-border/80 hover:border-red-500/60 rounded-xl text-left hover:-translate-y-1 active:scale-98 transition-all duration-300 cursor-pointer flex flex-col group relative overflow-hidden shadow-md"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/2 rounded-full -mr-8 -mt-8 group-hover:bg-red-500/10 transition-colors" />
                  <span className="text-xs font-extrabold text-text group-hover:text-red-500 transition-colors flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    {tpl.title}
                  </span>
                  <span className="text-[10px] text-text-muted mt-1.5 font-medium leading-normal">{tpl.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : displayLinks.length === 0 ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-16 text-center">
          <span className="text-xs text-text-muted uppercase tracking-wider font-extrabold">Filter returned 0 items</span>
          <p className="text-[10px] text-text-muted mt-1 font-medium">Try another term or clear search.</p>
        </div>
      ) : (
        /* Video Grid Feed */
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayLinks.map((link, idx) => (
            <YoutubeVideoCard
              key={link.id}
              link={link}
              idx={idx}
              activeVideoId={activeVideoId}
              setActiveVideoId={setActiveVideoId}
              expandedNotesId={expandedNotesId}
              setExpandedNotesId={setExpandedNotesId}
              activeNotesId={activeNotesId}
              localNotes={localNotes}
              setLocalNotes={setLocalNotes}
              handleNotesFocus={handleNotesFocus}
              handleNotesBlur={handleNotesBlur}
              handleCopyLink={handleCopyLink}
              copiedId={copiedId}
              handleRemoveVideo={handleRemoveVideo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function YoutubeVideoCard({
  link,
  idx,
  activeVideoId,
  setActiveVideoId,
  expandedNotesId,
  setExpandedNotesId,
  activeNotesId,
  localNotes,
  setLocalNotes,
  handleNotesFocus,
  handleNotesBlur,
  handleCopyLink,
  copiedId,
  handleRemoveVideo
}) {
  const cardRef = useRef(null);
  const isNotesExpanded = expandedNotesId === link.id;

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Spotlight tracking only — no 3D tilt
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        animationDelay: `${idx * 0.05}s`,
      }}
      className="animate-card opacity-0 bg-card border border-border/70 hover:border-accent/30 rounded-2xl shadow-xl hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 flex flex-col overflow-hidden group premium-card"
    >
      <div className="card-glare-overlay" />
      
      {/* Media Player Container */}
      <div className="aspect-video w-full relative bg-black overflow-hidden border-b border-border/80">
        {activeVideoId === link.id ? (
          <iframe
            title={link.title}
            src={`https://www.youtube-nocookie.com/embed/${link.videoId}?autoplay=1`}
            className="absolute inset-0 w-full h-full border-0 z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          /* Video Thumbnail w/ Play Overlay */
          <div 
            onClick={() => setActiveVideoId(link.id)}
            className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden group/thumb z-10"
          >
            <img
              src={link.thumbnailUrl}
              alt={link.title}
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${link.videoId}/mqdefault.jpg`;
              }}
            />
            
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover/thumb:via-black/25 transition-colors" />
            
            {/* Pulsing Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Dial frame */}
                <div className="absolute w-16 h-16 rounded-full border border-dashed border-red-500/40 opacity-0 group-hover/thumb:opacity-100 group-hover/thumb:scale-110 group-hover/thumb:rotate-45 transition-all duration-300" />
                
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-105 group-hover/thumb:bg-red-500 transition-all duration-300 relative z-10 shadow-red-950/50">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            </div>


          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-3.5 bg-surface/20 relative z-10 transform translate-z-[15px]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2.5">
            <h3 className="font-extrabold text-xs md:text-sm text-text leading-snug line-clamp-2 group-hover:text-red-400 transition-colors duration-200">
              {link.title}
            </h3>
          </div>

          <p className="text-[10px] text-text-dim font-bold mt-1.5 truncate flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 bg-red-500/70 rounded-full animate-pulse-dot" /> {link.authorName}
          </p>
        </div>

        {/* Expandable Study Notes Panel */}
        <div className="flex flex-col gap-2 font-mono">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpandedNotesId(isNotesExpanded ? null : link.id)}
              className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                link.notes ? 'text-red-400 hover:text-red-300' : 'text-text-muted hover:text-text'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Notes {link.notes ? '(Active)' : ''}</span>
            </button>


          </div>

          {isNotesExpanded && (
            <textarea
              value={activeNotesId === link.id ? localNotes : link.notes || ''}
              onFocus={() => handleNotesFocus(link.id, link.notes)}
              onBlur={() => handleNotesBlur(link.id)}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="Write study notes or timestamps..."
              className="w-full bg-bg/40 border border-border/80 rounded-xl p-2.5 text-xs text-text placeholder-text-dim resize-none h-20 outline-none focus:border-red-500/50 font-sans"
            />
          )}
        </div>

        {/* Footer Controls & Stats */}
        <div className="flex items-center justify-between pt-3.5 border-t border-border/60 mt-auto font-mono">
          <span className="text-[9px] text-text-dim uppercase tracking-widest font-semibold">
            NODE {idx + 1} // {new Date(link.addedAt).toLocaleDateString()}
          </span>
          
          <div className="flex items-center gap-2">
            {/* Copy Link */}
            <button
              onClick={() => handleCopyLink(link.id, link.url)}
              className="p-1.5 bg-surface/30 border border-border/80 hover:border-red-500/40 text-text-muted hover:text-red-400 rounded-xl transition-all duration-200 cursor-pointer active:scale-90"
              title="Copy video link"
            >
              {copiedId === link.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-surface/30 border border-border/80 hover:border-red-500/40 text-text-muted hover:text-red-400 rounded-xl transition-all duration-200 cursor-pointer active:scale-90"
              title="Watch on YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            
            <button
              onClick={() => handleRemoveVideo(link.id)}
              className="p-1.5 bg-surface/30 border border-border/80 hover:border-red-500/50 text-text-muted hover:text-red-400 rounded-xl transition-all duration-200 cursor-pointer active:scale-90"
              title="Delete video"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
