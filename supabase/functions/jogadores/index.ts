// Hollow Table · contas dos jogadores, criadas pelo Mestre dentro do app.
// A chave secreta nunca sai do Supabase: ela vem do ambiente da função.
// Quem chama precisa estar logado e ser o dono da mesa; as leituras usam a sessão dele (com as regras de acesso do banco).
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const SB_URL = Deno.env.get('SUPABASE_URL') ?? '';
function keysFrom(listVar: string, legacyVar: string): string[] {
  const out: string[] = [];
  try {
    const j = JSON.parse(Deno.env.get(listVar) ?? '{}');
    if (j && typeof j.default === 'string' && j.default) out.push(j.default);
  } catch (_e) { /* sem as chaves novas: usa a antiga */ }
  const legacy = Deno.env.get(legacyVar);
  if (legacy) out.push(legacy);
  return out;
}
const SECRETS = keysFrom('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
const PUBLISHABLE = keysFrom('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY')[0] ?? '';
const NOPERSIST = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
const ADMINS = SECRETS.map((k) => createClient(SB_URL, k, { auth: NOPERSIST }));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// senha provisória legível: 12 letras e números sem os que se confundem (0/O, 1/l/I), em 3 grupos
function tempPassword(): string {
  const low = 'abcdefghjkmnpqrstuvwxyz', all = low + low.toUpperCase() + '23456789';
  for (;;) {
    const b = new Uint32Array(12);
    crypto.getRandomValues(b);
    const s = Array.from(b, (x) => all[x % all.length]).join('');
    if (/[a-z]/.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s)) return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8);
  }
}
// a primeira chave que o servidor de contas aceitar (a nova; se não houver, a antiga)
// deno-lint-ignore no-explicit-any
async function withAdmin<T>(fn: (a: any) => Promise<{ data: T; error: any }>): Promise<{ data: T; error: any }> {
  // deno-lint-ignore no-explicit-any
  let last: any = { data: null, error: { message: 'Sem chave de servidor.' } };
  for (const a of ADMINS) {
    last = await fn(a);
    const st = last.error && (last.error.status ?? 0);
    if (st === 401 || (last.error && /api key|invalid jwt/i.test(String(last.error.message)))) continue;
    return last;
  }
  return last;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply(405, { message: 'Use POST.' });
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return reply(401, { message: 'Entre na sua conta.' });
    // quem está pedindo (o servidor de contas confere o token)
    const { data: who, error: whoErr } = await withAdmin((a) => a.auth.getUser(token));
    // deno-lint-ignore no-explicit-any
    const me = (who as any)?.user;
    if (whoErr || !me) return reply(401, { message: 'Sua sessão expirou. Entre de novo.' });

    // deno-lint-ignore no-explicit-any
    let body: any = {};
    try { body = await req.json(); } catch (_e) { return reply(400, { message: 'Pedido inválido.' }); }
    const cid = String(body.cid ?? '');
    if (!UUID.test(cid)) return reply(400, { message: 'Mesa inválida.' });

    // leituras com a sessão do próprio Mestre: o banco só mostra o que ele pode ver
    const asMe = createClient(SB_URL, PUBLISHABLE, { global: { headers: { Authorization: 'Bearer ' + token } }, auth: NOPERSIST });
    const { data: camp } = await asMe.from('campaigns').select('id, owner').eq('id', cid).maybeSingle();
    if (!camp || camp.owner !== me.id) return reply(403, { message: 'Só o Mestre desta mesa pode fazer isso.' });

    if (body.action === 'criar') {
      const email = String(body.email ?? '').trim().toLowerCase();
      const name = String(body.name ?? '').trim().slice(0, 40);
      if (!EMAIL.test(email) || email.length > 200) return reply(400, { message: 'Confira o e-mail.' });
      if (!name) return reply(400, { message: 'Escreva o nome do jogador na mesa.' });
      if (email === String(me.email ?? '').toLowerCase()) return reply(400, { message: 'Esse é o seu e-mail de Mestre.' });
      const password = tempPassword();
      const { data: cu, error: ce } = await withAdmin((a) => a.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { created_by: me.id } }));
      // deno-lint-ignore no-explicit-any
      const made = ce ? null : (cu as any)?.user;
      if (ce && !(ce.code === 'email_exists' || /already|registered|exists/i.test(String(ce.message)))) {
        console.error('criar conta', ce.status, ce.code, ce.message);
        return reply(400, { message: 'Não consegui criar a conta: ' + ce.message });
      }
      // entra na mesa pela função do banco, com a sessão do Mestre (ela confere de novo que ele é o dono)
      const { data: am, error: ae } = await asMe.rpc('add_member', { cid, em: email, nm: name });
      if (ae) {
        if (made) await withAdmin((a) => a.auth.admin.deleteUser(made.id));
        console.error('add_member', ae.message);
        return reply(400, { message: ae.message });
      }
      // deno-lint-ignore no-explicit-any
      return reply(200, { created: !!made, user_id: (am as any)?.user_id ?? made?.id ?? null, password: made ? password : null });
    }

    if (body.action === 'senha') {
      const uid = String(body.uid ?? '');
      if (!UUID.test(uid)) return reply(400, { message: 'Jogador inválido.' });
      const { data: mem } = await asMe.from('members').select('user_id').eq('campaign_id', cid).eq('user_id', uid).maybeSingle();
      if (!mem) return reply(404, { message: 'Esse jogador não está nesta mesa.' });
      const { data: tu, error: te } = await withAdmin((a) => a.auth.admin.getUserById(uid));
      // deno-lint-ignore no-explicit-any
      const target = (tu as any)?.user;
      if (te || !target) return reply(404, { message: 'Não encontrei essa conta.' });
      // só contas que este Mestre criou pelo app: ninguém troca a senha de uma conta alheia só por tê-la posto na mesa
      if ((target.app_metadata ?? {}).created_by !== me.id) return reply(403, { message: 'Essa conta não foi criada por você aqui no app. A senha dela só muda pelo painel do Supabase ou pelo próprio jogador, no Perfil.' });
      const password = tempPassword();
      const { error: ue } = await withAdmin((a) => a.auth.admin.updateUserById(uid, { password }));
      if (ue) { console.error('nova senha', ue.status, ue.message); return reply(400, { message: 'Não consegui trocar a senha: ' + ue.message }); }
      return reply(200, { password });
    }
    return reply(400, { message: 'Ação desconhecida.' });
  } catch (e) {
    console.error('jogadores', e);
    return reply(500, { message: 'Algo deu errado no servidor. Tente de novo.' });
  }
});
