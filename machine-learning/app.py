from flask import Flask, request, jsonify
from flask_cors import CORS
from run_feed import generate_live_feed

app = Flask(__name__)
# CORS allows your React frontend running on localhost:5173 to talk to your Python backend
CORS(app)



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