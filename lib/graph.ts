import { PostMeta } from './posts';

export interface GraphNode {
  id: string;
  title: string;
  tags: string[];
  date: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  sharedTags: string[];
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraphData(posts: PostMeta[]): GraphData {
  const nodes: GraphNode[] = posts.map((p) => ({
    id: p.slug,
    title: p.title,
    tags: p.tags,
    date: p.date,
  }));

  const edges: GraphEdge[] = [];
  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const shared = posts[i].tags.filter((t) => posts[j].tags.includes(t));
      if (shared.length > 0) {
        edges.push({ source: posts[i].slug, target: posts[j].slug, sharedTags: shared });
      }
    }
  }

  return { nodes, edges };
}
