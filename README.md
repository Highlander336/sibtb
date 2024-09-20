# Business Analyzer App

## Overview

The Business Analyzer App is a web-based tool designed to help entrepreneurs and investors evaluate business opportunities. By inputting financial data or uploading an image containing financial information, users can receive an analysis of the business's potential, including key metrics and a buy recommendation.

## Features

- Secure login system to protect sensitive financial data
- Manual input of business financial data
- Image upload and OCR (Optical Character Recognition) to extract financial data from images
- Calculation of key financial metrics:
  - Sales Multiple
  - Cash on Cash Return
  - Debt Service (yearly and monthly)
  - Monthly Cash Flow
  - Monthly Net Operating Income
- AI-powered analysis of business potential using Anthropic's Claude model
- User-friendly interface with clear visualizations of results

## Technology Stack

- Backend: Python with Flask
- Frontend: HTML, CSS, JavaScript
- OCR: Tesseract
- AI Model: Anthropic's Claude via LangChain
- Database: Not applicable (data not persisted)

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/business-analyzer-app.git
   cd business-analyzer-app
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   FLASK_SECRET_KEY=your_secret_key
   APP_PASSWORD=your_chosen_password
   ```

5. Ensure Tesseract OCR is installed on your system.

6. Run the application:
   ```
   python app.py
   ```

7. Access the application by navigating to `http://localhost:5000` in your web browser.

## Usage

1. Log in using the password set in your `.env` file.
2. Input financial data manually or upload an image containing the information.
3. Click "Calculate" or "Process Image" to generate financial metrics.
4. Use the "Should I buy this?" button to get an AI-powered recommendation.
5. Review the analysis and make informed decisions about the business opportunity.

## Security Considerations

- This application uses a simple password protection mechanism and is intended for personal or small team use.
- Sensitive information (API keys, passwords) should be kept secure and not shared.
- For production deployment, additional security measures should be implemented.

## Contributing

Contributions to improve the Business Analyzer App are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## License

[MIT License](https://opensource.org/licenses/MIT)

## Disclaimer

This tool is for informational purposes only and should not be considered as financial advice. Always consult with qualified financial professionals before making investment decisions.