import { getAllPosts } from '@/lib/posts';
import { buildGraphData } from '@/lib/graph';
import UniverseGraph from '@/components/universe/UniverseGraph';
import UniverseShell from '@/components/universe/UniverseShell';

export const metadata = { title: 'universe | sevin.dev' };

export default function UniversePage() {
  const posts = getAllPosts();
  const graphData = buildGraphData(posts);
  return (
    <UniverseShell>
      {/* Navbar 높이(84px) 아래부터 전체 뷰포트 차지 */}
      <div style={{ position: 'fixed', top: 84, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
        <UniverseGraph data={graphData} />
      </div>
    </UniverseShell>
  );
}
