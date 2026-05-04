import { PostMeta } from './posts';

export type NodeType = 'category' | 'tag' | 'post';

export interface GraphNode {
  id: string;
  title: string;
  type: NodeType;
  tags: string[];
  category: string;
  date: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'category-tag' | 'tag-post';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraphData(posts: PostMeta[]): GraphData {
  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  const allTags = [...new Set(posts.flatMap((p) => p.tags))];

  const categoryNodes: GraphNode[] = categories.map((cat) => ({
    id: `cat:${cat}`,
    title: cat,
    type: 'category',
    tags: [],
    category: '',
    date: '',
  }));

  const tagNodes: GraphNode[] = allTags.map((tag) => ({
    id: `tag:${tag}`,
    title: `#${tag}`,
    type: 'tag',
    tags: [],
    category: '',
    date: '',
  }));

  const postNodes: GraphNode[] = posts.map((p) => ({
    id: p.slug,
    title: p.title,
    type: 'post',
    tags: p.tags,
    category: p.category,
    date: p.date,
  }));

  const edges: GraphEdge[] = [];

  // Category → Tag: tag가 연결될 카테고리는 해당 태그를 가진 포스트의 카테고리 기준
  const tagCategories: Record<string, Set<string>> = {};
  posts.forEach((post) => {
    if (!post.category) return;
    post.tags.forEach((tag) => {
      if (!tagCategories[tag]) tagCategories[tag] = new Set();
      tagCategories[tag].add(post.category);
    });
  });

  Object.entries(tagCategories).forEach(([tag, cats]) => {
    cats.forEach((cat) => {
      edges.push({ source: `cat:${cat}`, target: `tag:${tag}`, type: 'category-tag' });
    });
  });

  // Tag → Post
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      edges.push({ source: `tag:${tag}`, target: post.slug, type: 'tag-post' });
    });
  });

  return { nodes: [...categoryNodes, ...tagNodes, ...postNodes], edges };
}
