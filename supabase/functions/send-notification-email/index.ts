import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  subject: string;
  type: 'password_changed' | 'login_alert' | 'role_changed' | 'account_approved' | 'new_user_pending' | 'custom';
  data?: {
    userName?: string;
    userEmail?: string;
    newRole?: string;
    message?: string;
  };
}

const getEmailTemplate = (type: string, data: any): string => {
  const userName = data?.userName || 'ผู้ใช้งาน';
  
  switch (type) {
    case 'password_changed':
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔐 การแจ้งเตือนความปลอดภัย</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">สวัสดี ${userName}</h2>
            <p style="color: #4b5563; line-height: 1.6;">รหัสผ่านของบัญชีคุณได้ถูกเปลี่ยนแปลงเรียบร้อยแล้ว</p>
            <p style="color: #4b5563; line-height: 1.6;">หากคุณไม่ได้เป็นผู้ดำเนินการนี้ กรุณาติดต่อผู้ดูแลระบบทันที</p>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">⚠️ หากคุณไม่ได้ทำการเปลี่ยนแปลงนี้ กรุณาติดต่อเราทันที</p>
            </div>
          </div>
        </div>
      `;
    
    case 'login_alert':
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔑 การเข้าสู่ระบบใหม่</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">สวัสดี ${userName}</h2>
            <p style="color: #4b5563; line-height: 1.6;">มีการเข้าสู่ระบบใหม่ในบัญชีของคุณ</p>
            <p style="color: #4b5563; line-height: 1.6;">หากเป็นการเข้าสู่ระบบของคุณเอง คุณสามารถเพิกเฉยข้อความนี้ได้</p>
          </div>
        </div>
      `;
    
    case 'role_changed':
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">👤 การเปลี่ยนแปลงบทบาท</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">สวัสดี ${userName}</h2>
            <p style="color: #4b5563; line-height: 1.6;">บทบาทของบัญชีคุณได้ถูกเปลี่ยนแปลงเป็น: <strong>${data?.newRole || 'ไม่ระบุ'}</strong></p>
            <p style="color: #4b5563; line-height: 1.6;">หากคุณมีคำถามเกี่ยวกับสิทธิ์ใหม่ กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </div>
      `;
    
    case 'account_approved':
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ บัญชีได้รับการอนุมัติแล้ว</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">สวัสดี ${userName}</h2>
            <p style="color: #4b5563; line-height: 1.6;">ยินดีด้วย! บัญชีของคุณได้รับการอนุมัติจากผู้ดูแลระบบแล้ว</p>
            <p style="color: #4b5563; line-height: 1.6;">คุณสามารถเข้าสู่ระบบและเริ่มใช้งาน PO System ได้ทันที</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${Deno.env.get('SITE_URL') || 'https://pfppo.lovable.app'}/auth" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">เข้าสู่ระบบ</a>
            </div>
          </div>
        </div>
      `;
    
    case 'new_user_pending':
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔔 ผู้ใช้ใหม่รอการอนุมัติ</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">สวัสดีผู้ดูแลระบบ</h2>
            <p style="color: #4b5563; line-height: 1.6;">มีผู้ใช้ใหม่ลงทะเบียนและรอการอนุมัติ:</p>
            <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <p style="color: #1f2937; margin: 5px 0;"><strong>ชื่อ:</strong> ${data?.userName || 'ไม่ระบุ'}</p>
              <p style="color: #1f2937; margin: 5px 0;"><strong>อีเมล:</strong> ${data?.userEmail || 'ไม่ระบุ'}</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">กรุณาเข้าสู่ระบบเพื่อตรวจสอบและอนุมัติผู้ใช้</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${Deno.env.get('SITE_URL') || 'https://pfppo.lovable.app'}/users" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">ไปที่หน้าจัดการผู้ใช้</a>
            </div>
          </div>
        </div>
      `;
    
    default:
      return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📧 การแจ้งเตือน</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">สวัสดี ${userName}</h2>
            <p style="color: #4b5563; line-height: 1.6;">${data?.message || 'คุณมีการแจ้งเตือนใหม่'}</p>
          </div>
        </div>
      `;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received notification email request");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data }: NotificationEmailRequest = await req.json();
    
    console.log(`Sending ${type} email to: ${to}`);

    const html = getEmailTemplate(type, data);

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PO System <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error from Resend API:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
