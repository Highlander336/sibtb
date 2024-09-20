from langchain_anthropic import Anthropic
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from PIL import Image
import pytesseract
from flask import Flask, request, jsonify, render_template, send_from_directory, redirect, url_for, session
from flask_debugtoolbar import DebugToolbarExtension
from functools import wraps
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_url_path='/static')
app.debug = True
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
toolbar = DebugToolbarExtension(app)
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False  # Add this line to disable redirect interception

# Set up LangChain with Anthropic
llm = Anthropic(temperature=0, anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"))
template = """
Extract the following financial information from the text:
Asking Price, EBITDA, Gross Revenue, Cash Flow, Inventory, Real Estate, FF&E

Text: {text}

Format the output as a JSON object with these keys: askingPrice, ebitda, grossRevenue, cashFlow, inventory, realEstate, ffe.
If a value is not found, set it to null. Do not include any additional formatting or backticks in your response.
"""
prompt = PromptTemplate(template=template, input_variables=["text"])
chain = LLMChain(llm=llm, prompt=prompt)

# Move this line to the top of the file, just after the imports
pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'

# Add this line to set the password
APP_PASSWORD = os.getenv('APP_PASSWORD', 'default_password')

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.form['password'] == APP_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('home'))
        else:
            return render_template('login.html', error='Invalid password')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/')
@login_required
def home():
    return render_template('index.html')

@app.route('/process_image', methods=['POST'])
@login_required
def process_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        try:
            # Perform OCR
            image = Image.open(file.stream)
            print("Image opened successfully")
            text = pytesseract.image_to_string(image)
            print("OCR Result:", text)
            
            # Process with LangChain
            result = chain.invoke({"text": text})
            print("LangChain Result:", result)
            
            # Parse the result as JSON
            data = json.loads(result['text'])
            print("Parsed Data:", data)
            
            return jsonify(data)
        except Exception as e:
            print("Error:", str(e))
            import traceback
            print("Traceback:", traceback.format_exc())
            return jsonify({"error": str(e)}), 500

@app.route('/analyze_business', methods=['POST'])
@login_required
def analyze_business():
    data = request.json
    business_type = data['businessType']
    financials = data['financials']
    metrics = data['metrics']

    prompt = f"""
    Analyze this {business_type} business opportunity:
    
    Financials:
    {json.dumps(financials, indent=2)}
    
    Calculated Metrics:
    {json.dumps(metrics, indent=2)}
    
    Evaluate the business based on these criteria, in order of importance:
    1. Profitability: Is the Monthly Net Operating Income positive? This is crucial.
    2. Debt Coverage: Can the monthly cash flow comfortably cover the debt service?
    3. Return on Investment: Is the Cash on Cash Return above 20%?
    4. Valuation: Is the Sales Multiple reasonable for this type of business?
    5. Growth Potential: Based on the business type and financials, is there room for growth?

    Scoring guide:
    1-2: Very poor investment, significant risks (e.g., negative Monthly Net Operating Income)
    3-4: Poor investment, major concerns
    5-6: Below average, some significant concerns
    7: Average opportunity, potential with some risks
    8-9: Good opportunity, strong financials
    10: Excellent opportunity, exceptional financials and growth potential

    A business with negative Monthly Net Operating Income should never score above 4.

    Provide a score from 1 to 10 based on this analysis. Only return the numerical score without any explanation.
    """

    try:
        result = llm.invoke(prompt)
        rating = int(result.strip())
        if 1 <= rating <= 10:
            print(f"Analysis Rating: {rating}")  # For debugging
            return jsonify({"rating": rating})
        else:
            raise ValueError("Rating out of range")
    except ValueError:
        return jsonify({"error": "Invalid rating received from LLM"}), 400

@app.route('/static/<path:path>')
@login_required
def send_static(path):
    return send_from_directory('static', path)

@app.route('/proxy_anthropic', methods=['POST'])
@login_required
def proxy_anthropic():
    data = request.json
    print("Received data:", data)  # Add this line for debugging
    prompt = data.get('prompt')
    
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        result = llm.invoke(prompt)
        return jsonify({"result": result})
    except Exception as e:
        print("Error in proxy_anthropic:", str(e))  # Add this line for debugging
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)