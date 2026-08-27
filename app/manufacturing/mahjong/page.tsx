import { redirect } from 'next/navigation';
import { MAHJONG_HOME } from '@/lib/mahjong';

/** 入口直接进入 Mahjong Tiles */
export default function MahjongIndexPage() {
  redirect(MAHJONG_HOME);
}
