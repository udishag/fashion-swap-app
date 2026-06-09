import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from run_feed import generate_live_feed

app = Flask(__name__)
# CORS allows your React frontend running on localhost:5173 to talk to your Python backend
CORS(app)

@app.route('/api/send-welcome', methods=['POST'])
def send_welcome():
    data = request.json
    username = data.get('username', '')
    target_email = data.get('email', '')

    # Paste your beautifully structured HTML template straight into the backend executor context
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>welcome to moss.</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #ffffff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
            .wrapper {{ width: 100%; max-width: 500px; margin: 0 auto; padding: 40px 20px; text-align: center; }}
            .logo {{ font-size: 2.4rem; font-weight: 700; letter-spacing: -1px; text-transform: lowercase; color: #000000; margin-bottom: 5px; }}
            .subtitle {{ font-size: 0.9rem; font-weight: 400; color: #666666; margin-bottom: 35px; text-transform: lowercase; letter-spacing: 0.5px; }}
            .hero-container {{ width: 100%; margin-bottom: 35px; overflow: hidden; }}
            .hero-image {{ width: 100%; height: auto; display: block; object-fit: cover; }}
            .headline {{ font-size: 1.6rem; font-weight: 400; color: #000000; text-transform: lowercase; margin-bottom: 15px; letter-spacing: -0.5px; }}
            .body-text {{ font-size: 0.9rem; line-height: 1.6; color: #333333; text-align: center; max-width: 420px; margin: 0 auto 40px auto; font-weight: 300; }}
            .signature-section {{ margin-top: 40px; font-family: inherit; color: #000000; font-size: 0.95rem; line-height: 1.5; text-transform: lowercase; }}
            .footer {{ font-size: 0.7rem; color: #999999; text-transform: lowercase; margin-top: 60px; border-top: 1px solid #eeeeee; padding-top: 20px; letter-spacing: 0.5px; }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="logo">moss.</div>
            <div class="subtitle">welcome to the new era of style.</div>
            
            <div class="hero-container">
                <img src="https://i.postimg.cc/W4X3dDts/Welcome-Email.jpg" alt="moss. founders" class="hero-image" />
            </div>

            <div class="headline">your inbox just got more beautiful.</div>
            
            <div class="body-text">
                congratulations {username.lower()}, you're officially on the list. we are building a space where fashion is defined by personal curation, and we are incredibly excited to have you along for this journey. explore your profile, find your next favorite piece, and become part of a community that understands style is personal.
            </div>

            <div class="signature-section">
                much love,<br>
                <strong>udi & daisy</strong>
            </div>

            <div class="footer">
                &copy; moss. 2026. toronto & mississauga.<br>
                <a href="#" style="color: #999999; text-decoration: underline;">unsubscribe</a>
            </div>
        </div>
    </body>
    </html>
    """

    # Hit the Resend API securely from your Python runtime environment
    resend_key = "re_jYuaPU5Y_GHro2bpMdJ2zCcsZVaAyhMSm"
    response = requests.post(
        'https://api.resend.com/emails',
        headers={
            'Authorization': f'Bearer {resend_key}',
            'Content-Type': 'application/json'
        },
        json={
            'from': 'moss. <onboarding@resend.dev>',
            'to': target_email,
            'subject': 'welcome to moss.',
            'html': email_html
        }
    )
    
    return jsonify({"status": "success", "backend_response": response.text}), response.status_code

@app.route('/api/feed', methods=['GET'])
def get_feed():
    # Grab user variables from the frontend web request url
    user_brand = request.args.get('brand', default='walmart', type=str)
    has_premium_unlock = request.args.get('premium', default='false', type=str).lower() == 'true'
    
    try:
        # Run your ML ranking algorithm!
        ranked_df = generate_live_feed(user_brand, has_premium_unlock)
        
        # Convert the pandas table results into a clean list of JSON objects for React
        feed_items = ranked_df.to_dict(orient='records')
        return jsonify({"status": "success", "feed": feed_items})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Runs a local server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)