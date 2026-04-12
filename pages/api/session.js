import { getPlayerFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  try {
    const player = await getPlayerFromRequest(req);
    if (!player) return res.status(200).json({ player: null });
    res.status(200).json({ player: { id: player.id, avatarName: player.avatar_name, role: player.role } });
  } catch (err) {
    res.status(200).json({ player: null });
  }
}
