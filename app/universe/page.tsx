import { getAllPosts } from '@/lib/posts';
import { buildGraphData } from '@/lib/graph';
import UniverseGraph from '@/components/universe/UniverseGraph';

export const metadata = { title: '우주 | sevin.dev' };

export default function UniversePage() {
  const posts = getAllPosts();
  const graphData = buildGraphData(posts);
  return <UniverseGraph data={graphData} />;
}
