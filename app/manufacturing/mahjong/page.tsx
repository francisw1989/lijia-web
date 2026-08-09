import { redirect } from 'next/navigation';
import { getMahjongPageData, MAHJONG_BASE } from '@/lib/mahjong';

/** 默认进入第一个 Tab 独立页 */
export default async function MahjongIndexPage() {
  const { defaultTabId } = await getMahjongPageData();
  redirect(`${MAHJONG_BASE}/${defaultTabId}`);
}
