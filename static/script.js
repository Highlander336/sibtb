function processImage() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/process_image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Received data:", data);
            // Clean and populate the form fields with the extracted data
            document.getElementById('askingPrice').value = cleanNumber(data.askingPrice);
            document.getElementById('ebitda').value = cleanNumber(data.ebitda);
            document.getElementById('grossRevenue').value = cleanNumber(data.grossRevenue);
            document.getElementById('cashFlow').value = cleanNumber(data.cashFlow);
            document.getElementById('inventory').value = cleanNumber(data.inventory);
            document.getElementById('realEstate').value = cleanNumber(data.realEstate);
            document.getElementById('ffe').value = cleanNumber(data.ffe);
            
            // Automatically calculate after populating fields
            calculate();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error processing image. Please try again or enter data manually.');
        });
    } else {
        alert('Please select an image file first.');
    }
}

function cleanNumber(value) {
    if (value === null || value === undefined || value === '') return '';
    // If the value is already a number, return it as a string
    if (typeof value === 'number') return value.toString();
    // Remove dollar signs, commas, and any other non-numeric characters except decimal points
    return value.replace(/[^0-9.]/g, '');
}

function calculate() {
    const askingPrice = parseFloat(cleanNumber(document.getElementById('askingPrice').value)) || 0;
    const grossRevenue = parseFloat(cleanNumber(document.getElementById('grossRevenue').value)) || 0;
    const cashFlow = parseFloat(cleanNumber(document.getElementById('cashFlow').value)) || 0;

    console.log("Calculating with:", { askingPrice, grossRevenue, cashFlow });

    const salesMultiple = grossRevenue !== 0 ? askingPrice / grossRevenue : 0;
    const cashOnCashReturn = askingPrice !== 0 ? (cashFlow / (0.1 * askingPrice)) * 10 : 0;

    const principal = 0.9 * askingPrice;
    const r = 0.105;
    const n = 10;
    const debtServicePerYear = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const debtServicePerMonth = debtServicePerYear / 12;

    const monthlyCashFlow = cashFlow / 12;
    const monthlyNetOperatingIncome = monthlyCashFlow - debtServicePerMonth;

    console.log("Calculated metrics:", {
        salesMultiple,
        cashOnCashReturn,
        debtServicePerYear,
        debtServicePerMonth,
        monthlyCashFlow,
        monthlyNetOperatingIncome
    });

    updateResults({
        salesMultiple,
        cashOnCashReturn,
        debtServicePerYear,
        debtServicePerMonth,
        monthlyCashFlow,
        monthlyNetOperatingIncome
    });
}

function updateResults(metrics) {
    const results = document.getElementById('results');
    results.innerHTML = `
        <h2>
            Analysis Metrics
            <span id="analysisResult" style="display: none;"></span>
        </h2>
        <p>Sales Multiple: ${metrics.salesMultiple.toFixed(2)}</p>
        <p>Cash on Cash Return: ${metrics.cashOnCashReturn.toFixed(1)}%</p>
        <p>Debt Service per Year: $${metrics.debtServicePerYear.toFixed(2)}</p>
        <p>Debt Service per Month: $${metrics.debtServicePerMonth.toFixed(2)}</p>
        <p>Monthly Cash Flow: $${metrics.monthlyCashFlow.toFixed(2)}</p>
        <p>Monthly Net Operating Income: $${metrics.monthlyNetOperatingIncome.toFixed(2)}</p>
        <button id="shouldBuyButton" onclick="shouldBuy()">Should I buy this?</button>
    `;
    console.log("Results updated:", metrics);
}

function shouldBuy() {
    document.getElementById('businessTypeModal').style.display = 'block';
}

function analyzeBusinessPurchase() {
    const businessType = document.getElementById('businessType').value;
    const financials = {
        askingPrice: document.getElementById('askingPrice').value,
        ebitda: document.getElementById('ebitda').value,
        grossRevenue: document.getElementById('grossRevenue').value,
        cashFlow: document.getElementById('cashFlow').value,
        inventory: document.getElementById('inventory').value,
        realEstate: document.getElementById('realEstate').value,
        ffe: document.getElementById('ffe').value
    };

    const metrics = {
        salesMultiple: parseFloat(document.querySelector('#results p:nth-child(2)').textContent.split(': ')[1]),
        cashOnCashReturn: parseFloat(document.querySelector('#results p:nth-child(3)').textContent.split(': ')[1]),
        debtServicePerYear: parseFloat(document.querySelector('#results p:nth-child(4)').textContent.split('$')[1]),
        debtServicePerMonth: parseFloat(document.querySelector('#results p:nth-child(5)').textContent.split('$')[1]),
        monthlyCashFlow: parseFloat(document.querySelector('#results p:nth-child(6)').textContent.split('$')[1]),
        monthlyNetOperatingIncome: parseFloat(document.querySelector('#results p:nth-child(7)').textContent.split('$')[1])
    };

    const prompt = `
    Analyze this ${businessType} business opportunity:
    
    Financials:
    ${JSON.stringify(financials, null, 2)}
    
    Calculated Metrics:
    ${JSON.stringify(metrics, null, 2)}
    
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
    `;

    fetch('/proxy_anthropic', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        const rating = parseInt(data.result);
        console.log("Analysis Rating:", rating);
        let recommendation = '';
        let resultClass = '';
        if (rating === 10) {
            recommendation = 'OH HECK YEAH!';
            resultClass = 'excellent';
        } else if (rating >= 6) {
            recommendation = 'Buy it';
            resultClass = 'positive';
        } else {
            recommendation = "Don't do it";
            resultClass = 'negative';
        }
        const analysisResult = document.querySelector('#results h2 #analysisResult');
        analysisResult.textContent = `${recommendation}: ${rating}/10 per Anthropic's Claude`;
        analysisResult.className = resultClass;
        analysisResult.style.display = 'inline';
        document.getElementById('businessTypeModal').style.display = 'none';
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error analyzing business. Please try again.');
    });
}

function previewImage(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = document.getElementById('uploadedImage');
            img.src = e.target.result;
            img.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function confirmClearAll() {
    if (confirm("This will clear all the information you've entered and calculated so far. Do you want to continue?")) {
        clearAll();
    }
}

function clearAll() {
    // ... (implementation of clearAll)
}

// Close modal when clicking on <span> (x)
document.querySelector('.close').onclick = function() {
    document.getElementById('businessTypeModal').style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById('businessTypeModal')) {
        document.getElementById('businessTypeModal').style.display = 'none';
    }
}

// Initialize results with placeholder values
document.addEventListener('DOMContentLoaded', function() {
    const results = document.getElementById('results');
    results.innerHTML = `
        <h2>
            Analysis Metrics
            <span id="analysisResult" style="display: none;"></span>
        </h2>
        <p>Sales Multiple: --</p>
        <p>Cash on Cash Return: --</p>
        <p>Debt Service per Year: --</p>
        <p>Debt Service per Month: --</p>
        <p>Monthly Cash Flow: --</p>
        <p>Monthly Net Operating Income: --</p>
    `;

    // Hide the analysis result initially
    document.getElementById('analysisResult').style.display = 'none';
});
