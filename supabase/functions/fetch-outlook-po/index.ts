import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_outlook';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OUTLOOK_KEY = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!LOVABLE_API_KEY || !OUTLOOK_KEY) {
      return new Response(
        JSON.stringify({ error: 'ยังไม่ได้เชื่อมต่อบัญชี Microsoft Outlook' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Auth ---
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const maxMessages = Math.min(Number(body?.maxMessages) || 25, 50);

    // --- Settings ---
    const { data: settings } = await admin
      .from('email_import_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const folder: string = (body?.folder || settings?.folder || 'inbox').trim();
    const senderFilter: string = (body?.senderFilter ?? settings?.sender_filter ?? '').trim();
    const subjectFilter: string = (body?.subjectFilter ?? settings?.subject_filter ?? '').trim();

    const gw = (path: string, init: RequestInit = {}) =>
      fetch(`${GATEWAY_URL}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': OUTLOOK_KEY,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });

    // --- Resolve folder path ---
    const wellKnown = ['inbox', 'drafts', 'sentitems', 'deleteditems', 'junkemail', 'archive'];
    let folderSegment = `/me/mailFolders/${encodeURIComponent(folder || 'inbox')}`;
    if (folder && !wellKnown.includes(folder.toLowerCase())) {
      // Try to find a child folder by display name under inbox, then at root
      const lookup = async (base: string) => {
        const r = await gw(`${base}?$top=100&$select=id,displayName`);
        if (!r.ok) return null;
        const j = await r.json();
        return (j.value || []).find(
          (f: { displayName: string }) => f.displayName?.toLowerCase() === folder.toLowerCase(),
        );
      };
      const found =
        (await lookup('/me/mailFolders/inbox/childFolders')) || (await lookup('/me/mailFolders'));
      if (found) folderSegment = `/me/mailFolders/${found.id}`;
      else folderSegment = '/me/mailFolders/inbox';
    }

    // Graph rejects complex $filter + $orderby combos (InefficientFilter),
    // so fetch newest messages and filter client-side.
    const query =
      `${folderSegment}/messages?$top=${Math.min(maxMessages * 4, 100)}` +
      `&$select=id,subject,from,receivedDateTime,hasAttachments` +
      `&$orderby=receivedDateTime desc`;

    const listRes = await gw(query);
    if (!listRes.ok) {
      const errorBody = await listRes.text();
      console.error(`Outlook list failed [${listRes.status}]: ${errorBody}`);
      let message = 'ดึงอีเมลไม่สำเร็จ';
      if (errorBody.includes('MailboxNotEnabledForRESTAPI')) {
        message =
          'บัญชีที่เชื่อมต่อไม่มีกล่องเมล Microsoft 365 (Exchange Online) — อาจเป็นบัญชี Outlook.com ส่วนตัว, บัญชีที่ยังไม่มี license Exchange, หรือเมลอยู่บนเซิร์ฟเวอร์องค์กร (on-premise). กรุณาเชื่อมต่อใหม่ด้วยบัญชีองค์กร M365 ที่มีกล่องเมลบนคลาวด์';
      } else if (errorBody.includes('ErrorItemNotFound') || errorBody.includes('ResourceNotFound')) {
        message = 'ไม่พบโฟลเดอร์เมลที่ระบุ กรุณาตรวจสอบชื่อโฟลเดอร์ในหน้าตั้งค่า';
      } else if (errorBody.includes('InefficientFilter')) {
        message = 'เงื่อนไขการกรองซับซ้อนเกินไปสำหรับ Outlook กรุณาลดเงื่อนไขการกรองลง';
      } else if (listRes.status === 401 || listRes.status === 403) {
        message = 'สิทธิ์การเข้าถึงเมลหมดอายุหรือไม่เพียงพอ กรุณาเชื่อมต่อบัญชี Microsoft ใหม่อีกครั้ง';
      }
      return new Response(
        JSON.stringify({ error: message, status: listRes.status, details: errorBody }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const listJson = await listRes.json();
    const senderLc = senderFilter.toLowerCase();
    const subjectLc = subjectFilter.toLowerCase();
    const messages: Array<Record<string, unknown>> = (listJson.value || [])
      .filter((m: Record<string, unknown>) => {
        if (!m.hasAttachments) return false;
        const addr = (
          (m.from as { emailAddress?: { address?: string } })?.emailAddress?.address ?? ''
        ).toLowerCase();
        const subj = ((m.subject as string) ?? '').toLowerCase();
        if (senderLc && !addr.includes(senderLc)) return false;
        if (subjectLc && !subj.includes(subjectLc)) return false;
        return true;
      })
      .slice(0, maxMessages);


    let newCount = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const msg of messages) {
      const messageId = msg.id as string;
      // NOTE: $select=contentBytes is rejected by Graph (400) — fetch full attachments.
      const attRes = await gw(`/me/messages/${messageId}/attachments`);
      if (!attRes.ok) {
        const attErr = await attRes.text();
        console.error(`attachments ${messageId} [${attRes.status}]: ${attErr}`);
        errors.push(`attachments ${messageId}: ${attRes.status} ${attErr.slice(0, 200)}`);
        continue;
      }
      const attJson = await attRes.json();
      const pdfs = (attJson.value || []).filter(
        (a: { name?: string; contentType?: string }) =>
          a.name?.toLowerCase().endsWith('.pdf') || a.contentType === 'application/pdf',
      );

      for (const att of pdfs) {
        // Guard 1: same message + attachment already imported
        const { data: existing } = await admin
          .from('email_imports')
          .select('id')
          .eq('message_id', messageId)
          .eq('attachment_id', att.id)
          .maybeSingle();
        if (existing) { skipped++; continue; }

        let base64: string | undefined = att.contentBytes;
        if (!base64) {
          // Large attachments (>3MB) omit contentBytes — fetch raw bytes
          const rawRes = await gw(`/me/messages/${messageId}/attachments/${att.id}/$value`);
          if (!rawRes.ok) {
            errors.push(`no content: ${att.name} (${rawRes.status})`);
            continue;
          }
          const buf = new Uint8Array(await rawRes.arrayBuffer());
          let bin = '';
          for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
          base64 = btoa(bin);
        }

        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        // Guard 2: identical file content already imported (same PDF re-sent)
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        const fileHash = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const { data: sameFile } = await admin
          .from('email_imports')
          .select('id')
          .eq('file_hash', fileHash)
          .maybeSingle();
        if (sameFile) { skipped++; continue; }

        const filePath = `email/${messageId}_${att.id}.pdf`.replace(/[^\w\-./]/g, '_');

        const { error: uploadError } = await admin.storage
          .from('po-files')
          .upload(filePath, bytes, { contentType: 'application/pdf', upsert: true });
        if (uploadError) {
          errors.push(`upload ${att.name}: ${uploadError.message}`);
          continue;
        }

        const from = (msg.from as { emailAddress?: { address?: string; name?: string } })?.emailAddress;
        const { error: insertError } = await admin.from('email_imports').insert({
          message_id: messageId,
          attachment_id: att.id,
          subject: (msg.subject as string) ?? null,
          sender_email: from?.address ?? null,
          sender_name: from?.name ?? null,
          received_at: (msg.receivedDateTime as string) ?? null,
          file_name: att.name,
          file_size: att.size ?? null,
          file_path: filePath,
          file_hash: fileHash,
          status: 'FETCHED',
        });
        if (insertError) {
          // Guard 3: unique index race — treat as duplicate, not an error
          if (insertError.code === '23505') skipped++;
          else errors.push(`insert ${att.name}: ${insertError.message}`);
        } else newCount++;
      }
    }

    if (settings?.id) {
      await admin
        .from('email_import_settings')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', settings.id);
    }

    return new Response(
      JSON.stringify({ success: true, scanned: messages.length, newCount, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('fetch-outlook-po error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
