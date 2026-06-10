import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // Grabs the username and email from the newly inserted database profile row
    const username = record.raw_user_meta_data?.username || 'there'
    const email = record.email

    const getWelcomeEmailHTML = (user: string) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>welcome to moss.</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
            .wrapper { width: 100%; max-width: 500px; margin: 0 auto; padding: 40px 20px; text-align: center; }
            .logo { font-size: 2.4rem; font-weight: 700; letter-spacing: -1px; text-transform: lowercase; color: #000000; margin-bottom: 5px; }
            .subtitle { font-size: 0.9rem; font-weight: 400; color: #666666; margin-bottom: 35px; text-transform: lowercase; letter-spacing: 0.5px; }
            .hero-container { width: 100%; margin-bottom: 35px; border: 1px solid #eeeeee; }
            .hero-image { width: 100%; height: auto; display: block; object-fit: cover; }
            .headline { font-size: 1.6rem; font-weight: 400; color: #000000; text-transform: lowercase; margin-bottom: 15px; letter-spacing: -0.5px; }
            .body-text { font-size: 0.9rem; line-height: 1.6; color: #333333; text-align: center; max-width: 420px; margin: 0 auto 40px auto; font-weight: 300; }
            .signature-section { margin-top: 40px; font-family: inherit; color: #000000; font-size: 0.95rem; line-height: 1.5; text-transform: lowercase; }
            .footer { font-size: 0.7rem; color: #999999; text-transform: lowercase; margin-top: 60px; border-top: 1px solid #eeeeee; padding-top: 20px; letter-spacing: 0.5px; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="logo">moss.</div>
            <div class="subtitle">welcome to the new era of style.</div>
            
            <div class="hero-container">
                <img src="https://i.postimg.cc/x8GyDTxx/udi-Headshot.png" alt="moss. founders" class="hero-image" />
            </div>

            <div class="headline">your inbox just got more beautiful.</div>
            
            <div class="body-text">
                congratulations ${user.toLowerCase()}, you're officially on the list. we are building a space where fashion is defined by personal curation, and we are incredibly excited to have you along for this journey. explore your profile, find your next favorite piece, and become part of a community that understands style is personal.
            </div>

            <div class="signature-section">
                much love,<br>
                <strong>udi & daisy</strong>
            </div>

            <div class="footer">
                &copy; moss. 2026. toronto.<br>
                <a href="#" style="color: #999999; text-decoration: underline;">unsubscribe</a>
            </div>
        </div>
    </body>
    </html>
    `;

    // Make the direct secure call to Resend's API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'moss. <onboarding@resend.dev>',
        to: [email],
        subject: 'welcome to moss.',
        html: getWelcomeEmailHTML(username),
      }),
    })

    const resData = await res.json()
    return new Response(JSON.stringify(resData), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})