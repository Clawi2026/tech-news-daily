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

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      // 优先加载最新数据，如果没有则用静态生成的
      const response = await fetch('/data/latest.json');
      if (response.ok) {
        const data = await response.json();
        setNews(data);
        setLastUpdate(new Date(data[0]?.fetchedAt).toLocaleString('zh-CN'));
      }
    } catch (error) {
      console.error('加载新闻失败:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN');
  }

  function getSourceColor(source: string) {
    const colors: Record<string, string> = {
      'TechCrunch': 'bg-green-100 text-green-800',
      'HackerNews': 'bg-orange-100 text-orange-800',
      'The Verge': 'bg-purple-100 text-purple-800',
      'Ars Technica': 'bg-blue-100 text-blue-800',
      'BBC Technology': 'bg-red-100 text-red-800',
      '36Kr': 'bg-yellow-100 text-yellow-800',
      '虎嗅': 'bg-indigo-100 text-indigo-800',
      '少数派': 'bg-pink-100 text-pink-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载全球科技新闻中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🌍 全球科技日报</h1>
              <p className="text-gray-600 mt-1">每日更新 · 自动翻译 · 覆盖全球</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">最后更新</p>
              <p className="text-lg font-semibold text-indigo-600">{lastUpdate}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-4 flex-wrap">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-gray-600">今日新闻</span>
            <span className="ml-2 text-2xl font-bold text-indigo-600">{news.length}</span>
            <span className="ml-1 text-gray-500">条</span>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-gray-600">新闻源</span>
            <span className="ml-2 text-2xl font-bold text-green-600">
              {new Set(news.map(n => n.source)).size}
            </span>
            <span className="ml-1 text-gray-500">个</span>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-gray-600">覆盖地区</span>
            <span className="ml-2 text-2xl font-bold text-blue-600">全球</span>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          {news.map((item, index) => (
            <article
              key={item.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
            >
              <div className="p-5">
                {/* Source Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceColor(item.source)}`}>
                    {item.source}
                  </span>
                  <span className="text-xs text-gray-500">{formatTime(item.publishedAt)}</span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h2>

                {/* Original Title (if translated) */}
                {item.language !== 'zh' && item.originalTitle !== item.title && (
                  <p className="text-xs text-gray-400 mb-2 line-clamp-1">
                    {item.originalTitle}
                  </p>
                )}

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {item.description || '点击阅读详情 →'}
                </p>

                {/* Link */}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  阅读原文
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>

        {news.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无新闻，请稍后再试</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>🌐 全球科技日报 · 每日自动更新</p>
          <p className="mt-1">新闻来源：TechCrunch, HackerNews, The Verge, 36Kr, 虎嗅等全球媒体</p>
        </div>
      </footer>
    </div>
  );
}
