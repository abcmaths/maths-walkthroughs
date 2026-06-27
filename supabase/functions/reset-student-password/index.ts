import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    }})
  }

  try {
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: profile } = await callerClient
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['teacher','admin'].includes(profile.role))
      return json({ error: 'Forbidden' }, 403)

    const { userId, newPassword } = await req.json()
    if (!userId || !newPassword) return json({ error: 'Missing userId or newPassword' }, 400)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) return json({ error: error.message }, 400)

    return json({ success: true })
  } catch(e) {
    return json({ error: e.message }, 500)
  }
})

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
