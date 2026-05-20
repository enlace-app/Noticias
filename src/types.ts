/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NewsSource {
  title: string;
  url: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  publishedAt: string;
  importance: 'breaking' | 'high' | 'medium' | 'low';
  sources: NewsSource[];
  hasLiveStream?: boolean;
  reporter: string;
  imageUrl?: string;
  reads?: number;
  likes?: number;
}

export interface LiveTicket {
  id: string;
  text: string;
  timestamp: string;
  type: 'breaking' | 'info' | 'alert';
}

export interface LiveChatComment {
  id: string;
  username: string;
  comment: string;
  timestamp: string;
  avatarUrl?: string;
}
