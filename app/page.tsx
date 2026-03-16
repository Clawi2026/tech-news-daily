'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  originalTitle: string;
  description: string;
  link: string;
  source: string;
  category: string;
  language: string;
  publishedAt: string;
  fetchedAt: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchNews();
    // 每 5 分钟检查一次更新
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNews() {
    try {
      const response = await fetch('/data/latest.json', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded news:', data?.length, 'items');
        if (data && data.length > 0) {
          setNews(data);
          setLastUpdate(new Date(data[0]?.fetchedAt).toLocaleString('zh-CN'));
          setError('');
        } else {
          setError('暂无新闻数据');
        }
      } else {
        console.error('Response not OK:', response.status);
        setError('加载失败 (HTTP ' + response.status + ')');
      }
    } catch (err) {
      setError('加载出错：' + (err as Error).message);
      console.error('加载新闻失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  function getSourceColor(source: string) {
    const colors: Record<string, string> = {
      'TechCrunch': 'bg-emerald-500',
      'HackerNews': 'bg-orange-500',
      'The Verge': 'bg-violet-500',
      'Ars Technica': 'bg-sky-500',
      'BBC Technology': 'bg-rose-500',
      '36Kr': 'bg-amber-500',
      '虎嗅': 'bg-indigo-500',
      '少数派': 'bg-pink-500'
    };
    return colors[source] || 'bg-slate-500';
  }

  function getCategoryIcon(category: string) {
    const icons: Record<string, string> = {
      '人工智能': '🤖',
      '科技创业': '🚀',
      '安全': '🔒',
      '机器人': '🦾',
      '硬件': '💻',
      '社交媒体': '📱',
      '交通出行': '🚗',
      '媒体娱乐': '🎬',
      '初创企业': '💡',
      '政府与政策': '🏛️'
    };
    return icons[category] || '📰';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500/30 border-t-purple-400 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
          </div>
          <p className="mt-6 text-purple-200 text-lg font-medium">加载全球科技新闻中...</p>
          <p className="mt-2 text-purple-400 text-sm">从世界各地获取最新资讯</p>
        </div>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">加载失败</h2>
          <p className="text-purple-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-purple-600/30"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/10 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">🌍</span>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">全球科技日报</h1>
                  <p className="text-purple-300 mt-1 text-sm sm:text-base">Global Tech Daily · 实时追踪全球科技创新</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm">
              <div className="text-right">
                <p className="text-xs text-purple-300 uppercase tracking-wide">最后更新</p>
                <p className="text-lg font-bold text-white">{lastUpdate || '刚刚'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-xl">🕐</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">📰</div>
              <div>
                <p className="text-purple-300 text-xs">今日新闻</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{news.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xl">🌐</div>
              <div>
                <p className="text-purple-300 text-xs">新闻源</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{new Set(news.map(n => n.source)).size}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl">🏷️</div>
              <div>
                <p className="text-purple-300 text-xs">分类</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{new Set(news.map(n => n.category)).size}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200 col-span-3 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl">🔄</div>
              <div>
                <p className="text-purple-300 text-xs">更新频率</p>
                <p className="text-lg sm:text-xl font-bold text-white">每小时</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item, index) => (
            <article
              key={item.id}
              className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Source Header */}
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white ${getSourceColor(item.source)}`}>
                      {item.source}
                    </span>
                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                  </div>
                  <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-lg">
                    {formatTime(item.publishedAt)}
                  </span>
                </div>

                {/* Category */}
                <p className="text-xs text-purple-400 mb-2">{item.category}</p>

                {/* Title */}
                <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors duration-200">
                  {item.title}
                </h2>

                {/* Original Title (if translated) */}
                {item.language !== 'zh' && item.originalTitle !== item.title && (
                  <p className="text-xs text-purple-400 mb-3 line-clamp-1 italic">
                    &ldquo;{item.originalTitle}&rdquo;
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="px-5 pb-4">
                <p className="text-purple-200 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {item.description || '点击阅读完整报道...'}
                </p>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-white/5 border-t border-white/10">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 text-sm font-semibold transition-all duration-200 group/link"
                >
                  <span>阅读原文</span>
                  <svg className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>

        {news.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-purple-300 text-lg">暂无新闻，请稍后再试</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-white/5 border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌍</span>
              <div>
                <p className="text-white font-semibold">全球科技日报</p>
                <p className="text-purple-400 text-sm">Global Tech Daily</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-purple-300 text-sm">每小时自动更新 · AI 翻译</p>
              <p className="text-purple-500 text-xs mt-1">TechCrunch · HackerNews · The Verge · 36Kr · 虎嗅</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
