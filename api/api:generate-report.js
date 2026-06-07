export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get data from the request
    const { email, name, birthDate, birthTime, birthPlace, reportType, partnerName, partnerBirthDate, partnerBirthTime, partnerBirthPlace, sessionId } = req.body;
    
    // Verify required data
    if (!email || !name || !birthDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // STEP 1: Calculate Chinese Zodiac
    const year = parseInt(birthDate.split('-')[0]);
    const animals = ['Monkey', 'Rooster', 'Dog', 'Pig', 'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat'];
    const zodiac = animals[year % 12];
    
    // STEP 2: Calculate element
    const elements = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
    const element = elements[year % 10];
    
    // STEP 3: Get Groq API key
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
        console.error('GROQ_API_KEY is missing!');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // STEP 4: Create prompt for Groq AI
    let prompt = '';
    
    if (reportType === 'couple') {
        const partnerYear = parseInt(partnerBirthDate.split('-')[0]);
        const partnerZodiac = animals[partnerYear % 12];
        const partnerElement = elements[partnerYear % 10];
        
        prompt = `You are the White Cat Oracle — a mystical, wise, and gentle guide.

Write a beautiful, personalized couple's compatibility reading for:

PERSON 1:
- Name: ${name}
- Chinese Zodiac: ${zodiac}
- Element: ${element}
- Birth: ${birthDate} ${birthTime || 'time unknown'}
- Birth Place: ${birthPlace || 'unknown'}

PERSON 2:
- Name: ${partnerName}
- Chinese Zodiac: ${partnerZodiac}
- Element: ${partnerElement}
- Birth: ${partnerBirthDate} ${partnerBirthTime || 'time unknown'}
- Birth Place: ${partnerBirthPlace || 'unknown'}

Write a 400-500 word reading with these sections:
1. 🌟 INTRODUCTION: A warm greeting for the couple
2. 💖 EACH PERSON'S NATURE: Describe both individuals
3. 💑 COMPATIBILITY ANALYSIS: Strengths and gentle challenges
4. 💡 ADVICE FOR HARMONY: Practical suggestions
5. 📅 2026 FORECAST: What the coming year holds

Use a mystical but not overly complex tone. Include cat imagery. Sign off as "🐱 The White Cat Oracle"`;
    } else {
        prompt = `You are the White Cat Oracle — a mystical, wise, and gentle guide.

Write a beautiful, personalized destiny reading for:

Name: ${name}
Chinese Zodiac: ${zodiac}
Element: ${element}
Birth: ${birthDate} ${birthTime || 'time unknown'}
Birth Place: ${birthPlace || 'unknown'}

Write a 400-500 word reading with these sections:
1. 🌟 YOUR ESSENTIAL NATURE: What your zodiac and element reveal
2. 💖 LOVE & RELATIONSHIPS: Insights about your romantic path
3. 💼 CAREER & PURPOSE: What work will fulfill you
4. 🍀 LUCKY CHARM & ADVICE: Actionable wisdom
5. 📅 2026 FORECAST: What the new year brings

Use a mystical but not overly complex tone. Include cat imagery. Sign off as "🐱 The White Cat Oracle"`;
    }
    
    // STEP 5: Call Groq API
    console.log('Calling Groq API...');
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are the White Cat Oracle, a mystical guide. You give warm, insightful, and personalized readings.' 
                },
                { 
                    role: 'user', 
                    content: prompt 
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    
    if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.error('Groq API error:', errorText);
        return res.status(500).json({ error: 'Failed to generate report' });
    }
    
    const groqData = await groqResponse.json();
    const report = groqData.choices[0].message.content;
    
    console.log('Report generated successfully');
    
    // STEP 6: Send email via Brevo
    const BREVO_KEY = process.env.BREVO_API_KEY;
    
    if (!BREVO_KEY) {
        console.error('BREVO_API_KEY is missing!');
        return res.status(500).json({ error: 'Email configuration error' });
    }
    
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': BREVO_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'White Cat Oracle', email: 'whitecat@nhom.me' },
            to: [{ email: email, name: name }],
            subject: `🐱 Your White Cat Oracle Reading ${reportType === 'couple' ? 'for Two' : ''}`,
            htmlContent: `
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #eee; padding: 40px; border-radius: 20px;">
                    <div style="text-align: center; border-bottom: 2px solid #ffd700; padding-bottom: 20px; margin-bottom: 30px;">
                        <div style="font-size: 48px;">🐱🔮✨</div>
                        <h1 style="color: #ffd700;">The Order of the White Cat</h1>
                        <p style="color: #aaa; font-style: italic;">Ancient wisdom for your journey</p>
                    </div>
                    <div style="line-height: 1.8;">
                        ${report.replace(/\n/g, '<br>')}
                    </div>
                    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; font-size: 12px; color: #666;">
                        <p>🐾 Thank you for your donation. The White Cat watches over you. 🐾</p>
                        <p>This reading is for entertainment purposes. Trust your own wisdom above all.</p>
                    </div>
                </div>
            `
        })
    });
    
    if (!emailResponse.ok) {
        console.error('Brevo email error:', await emailResponse.text());
        return res.status(500).json({ error: 'Failed to send email' });
    }
    
    console.log('Email sent successfully to:', email);
    
    // STEP 7: Clean up stored data if sessionId provided
    // (This would require a database — optional for now)
    
    res.status(200).json({ 
        success: true, 
        message: 'Report generated and sent to your email!'
    });
}