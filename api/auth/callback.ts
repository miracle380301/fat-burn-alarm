/**
 * OAuth 콜백 엔드포인트
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error) {
    res.status(400).json({ error: 'Authorization denied' });
    return;
  }

  if (!code) {
    res.status(400).json({ error: 'Missing code' });
    return;
  }

  try {
    // 토큰 교환
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    // Strava 응답 체크
    if (!tokenRes.ok || !tokenData.athlete) {
      console.error('Strava token error:', tokenData);
      res.status(400).json({ error: 'Strava auth failed', details: tokenData });
      return;
    }

    console.log('Strava auth success:', tokenData.athlete.id, tokenData.athlete.firstname);

    // Supabase에 저장
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );

    const { error: dbError } = await supabase.from('users').upsert({
      strava_id: tokenData.athlete.id.toString(),
      strava_nickname: tokenData.athlete.username ||
        `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
    }, { onConflict: 'strava_id' });

    if (dbError) {
      console.error('Supabase error:', dbError);
      res.status(500).json({ error: 'Database save failed', details: dbError.message });
      return;
    }

    console.log('User saved to Supabase:', tokenData.athlete.id);

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>인증 완료</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center;
                 align-items: center; min-height: 100vh; background: #667eea; }
          .card { background: white; padding: 2rem; border-radius: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🔥 인증 완료!</h1>
          <p>${tokenData.athlete.firstname}님, Strava 연결되었습니다.</p>
          <p>이제 운동을 완료하면 자동으로 Fat Burn Report가 추가됩니다.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).json({ error: 'Authorization failed' });
  }
}
