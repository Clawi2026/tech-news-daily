'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  originalTitle: string;
  description: string;
  url: string;
  link?: string; // 兼容旧字段
  source: string;
  category: string;
  language: string;
  publishedAt: string;
  fetchedAt: string;
}

// 简化翻译提示 - 无插件，纯提示
function TranslateTip() {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 px-4 py-3 max-w-[200px]">
      <p className="text-xs text-gray-600 font-medium">
        🌐 英文内容可使用浏览器翻译
      </p>
      <p className="text-xs text-gray-400 mt-1">
        右键 → "翻译成中文"
      </p>
    </div>
  );
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      const response = await fetch('/data/latest.json');
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const text = await response.text();
      const data = JSON.parse(text);
      
      // 支持两种格式：数组 或 对象 (包含 articles 字段)
      let articles: any[] = [];
      if (Array.isArray(data)) {
        articles = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.articles)) {
        articles = data.articles;
      }
      
      if (!articles || articles.length === 0) {
        throw new Error('数据格式错误');
      }
      
      setNews(articles);
      const firstDate = articles[0]?.fetchedAt || articles[0]?.publishedAt;
      if (firstDate) {
        try {
          setLastUpdate(new Date(firstDate).toLocaleString('zh-CN'));
        } catch {
          setLastUpdate('刚刚');
        }
      }
      setError('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      setError('加载失败：' + msg);
      console.error('加载新闻失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateString: string) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (isNaN(date.getTime())) return '未知时间';
      if (minutes < 1) return '刚刚';
      if (minutes < 60) return minutes + '分钟前';
      if (hours < 24) return hours + '小时前';
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } catch {
      return '未知时间';
    }
  }

  function getSourceColor(source: string) {
    const colors: Record<string, string> = {
      // 国外媒体 - 更鲜艳的渐变
      'TechCrunch': 'bg-gradient-to-r from-emerald-400 to-cyan-400',
      'The Verge': 'bg-gradient-to-r from-violet-400 to-purple-400',
      'Ars Technica': 'bg-gradient-to-r from-sky-400 to-blue-400',
      'Wired': 'bg-gradient-to-r from-purple-400 to-pink-400',
      'BBC Technology': 'bg-gradient-to-r from-rose-400 to-red-400',
      'CNET': 'bg-gradient-to-r from-blue-400 to-cyan-400',
      'Bloomberg Tech': 'bg-gradient-to-r from-cyan-400 to-teal-400',
      // 国内媒体 - 更鲜艳的渐变
      '36Kr': 'bg-gradient-to-r from-amber-400 to-orange-400',
      '虎嗅': 'bg-gradient-to-r from-indigo-400 to-purple-400',
      '少数派': 'bg-gradient-to-r from-pink-400 to-rose-400'
    };
    return colors[source] || 'bg-gradient-to-r from-slate-400 to-gray-400';
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
      '政府与政策': '🏛️',
      '科技文化': '🎨',
      '深度科技': '🔬',
      '科技趋势': '📈',
      '综合科技': '🌐',
      '数码产品': '📷',
      '科技财经': '💰',
      '中国科技': '🇨🇳',
      '商业科技': '💼',
      '数码生活': '🎧'
    };
    return icons[category] || '📰';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900 animate-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-pink-400/30 border-t-cyan-400 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl animate-float">🌍</span>
            </div>
          </div>
          <p className="mt-8 text-cyan-200 text-xl font-semibold animate-pulse">加载全球科技新闻中...</p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900 animate-gradient flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-7xl mb-6 animate-float">⚠️</div>
          <h2 className="text-3xl font-bold text-white mb-3">哎呀，加载失败了</h2>
          <p className="text-cyan-200 mb-8 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
          >
            🔄 刷新页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-900 animate-gradient">
      {/* 动态背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-glow"></div>
      </div>

      {/* 简化翻译提示 */}
      <TranslateTip />

      {/* Header */}
      <header className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-5xl animate-float">🌍</span>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">全球科技日报</h1>
                  <p className="text-cyan-200 mt-2 text-lg font-medium tracking-wide">Global Tech Daily</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl px-6 py-4 border border-white/20 shadow-lg">
              <div className="text-right">
                <p className="text-sm text-cyan-200 font-medium">最后更新</p>
                <p className="text-xl font-black text-white">{lastUpdate || '刚刚'}</p>
              </div>
              <span className="text-3xl animate-pulse">🕐</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📰</span>
              <p className="text-cyan-200 text-sm font-semibold">今日新闻</p>
            </div>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{news.length}</p>
          </div>
          <div className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📡</span>
              <p className="text-purple-200 text-sm font-semibold">新闻源</p>
            </div>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{new Set(news.map(n => n.source)).size}</p>
          </div>
          <div className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏷️</span>
              <p className="text-pink-200 text-sm font-semibold">分类</p>
            </div>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">{new Set(news.map(n => n.category)).size}</p>
          </div>
          <div className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚡</span>
              <p className="text-amber-200 text-sm font-semibold">更新频率</p>
            </div>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">每 8 小时</p>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item, index) => (
            <article
              key={item.id}
              className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 hover:border-cyan-400/50 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-4 py-2 rounded-full text-xs font-bold text-white ${getSourceColor(item.source)} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    {item.source}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* 语言标签 */}
                    {item.language !== 'zh' && (
                      <span className="text-xs text-amber-200 bg-amber-500/20 px-2 py-1 rounded-lg font-semibold backdrop-blur-sm border border-amber-500/30" title="英文内容，可使用浏览器翻译">
                        🇬🇧 EN
                      </span>
                    )}
                    {item.language === 'zh' && (
                      <span className="text-xs text-red-200 bg-red-500/20 px-2 py-1 rounded-lg font-semibold backdrop-blur-sm border border-red-500/30">
                        🇨🇳 中文
                      </span>
                    )}
                    <span className="text-xs text-cyan-200 bg-cyan-500/20 px-3 py-1.5 rounded-xl font-semibold backdrop-blur-sm border border-cyan-500/30">
                      {formatTime(item.publishedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{getCategoryIcon(item.category)}</span>
                  <p className="text-xs text-purple-300 font-semibold bg-purple-500/20 px-3 py-1 rounded-lg backdrop-blur-sm">{item.category}</p>
                </div>

                <h2 className="text-xl font-black text-white mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-purple-300 transition-all duration-300">
                  {item.title}
                </h2>

                {item.language !== 'zh' && item.originalTitle && item.originalTitle !== item.title && (
                  <p className="text-xs text-purple-400 mb-4 italic font-medium">&ldquo;{item.originalTitle}&rdquo;</p>
                )}

                <p className="text-purple-100 text-sm mb-5 line-clamp-3 leading-relaxed">
                  {item.description || '点击阅读完整报道...'}
                </p>

                <div className="flex items-center gap-3">
                  <a
                    href={item.url || item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
                  >
                    <span>阅读原文</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  {item.language !== 'zh' && (
                    <button
                      onClick={() => alert('提示：在浏览器中右键 → 翻译成中文，或使用 Chrome/Edge 的自动翻译功能')}
                      className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-purple-200 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border border-white/20"
                      title="使用浏览器翻译功能"
                    >
                      <span>🔤</span>
                      <span>翻译</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-white/10 backdrop-blur-xl border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-cyan-200 text-base font-semibold">🌐 全球科技日报 · 每 8 小时自动更新</p>
          <p className="text-purple-300 text-sm mt-2 font-medium">TechCrunch · The Verge · Ars Technica · Wired · 36Kr · 虎嗅 · 少数派</p>
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            <span className="text-xs text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full">🚀 10+ 全球媒体</span>
            <span className="text-xs text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full">🌐 英文内容可用浏览器翻译</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
