export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'System architecture protocol violation.' });

    const { 
        email, clientName, birthDate, productType, userQuestion,
        transactionId, gatewayVendorId, amountPaidString,
        additionalCoordinates, timeCoordinate, identityString,
        partnerBName, partnerBBirthDate
    } = req.body;

    if (!email || !clientName || !productType) {
        return res.status(400).json({ error: 'Missing mandatory request data parameters.' });
    }

    // Direct Google Gemini API Key and Brevo variables safely extracted from Vercel environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (!GEMINI_API_KEY || !BREVO_API_KEY) {
        return res.status(500).json({ error: 'Environment master verification keys not found.' });
    }

    // Generate strict deterministic math seed to lock text outputs per user dataset
    let seedBase = clientName.trim().toLowerCase() + birthDate + productType + (partnerBName || '');
    let computedSeed = 0;
    for (let i = 0; i < seedBase.length; i++) {
        computedSeed = seedBase.charCodeAt(i) + ((computedSeed << 5) - computedSeed);
    }
    computedSeed = Math.abs(computedSeed) % 1000000;

    let systemIdentityPrompt = `You are the High Priest and Master Astrologer of the Order of the White Cat. Your tone is academic, profound, and deeply mystical. You avoid pop fortune-telling. You use highly sophisticated prose, weaving in metaphors of the observing white cat (symbolizing intuition, cosmic silence, and hidden clarity).`;
    
    let analyticsPrompt = '';

    if (productType === 'couple') {
        // High-end Affinity Love Match Processing Module
        analyticsPrompt = `Perform a comprehensive, elite Relationship Affinity Resonance evaluation mapping the compatibility charts between:
        Partner A: ${clientName} (Born: ${birthDate})
        Partner B: ${partnerBName} (Born: ${partnerBBirthDate})
        Context Core: "${userQuestion || 'General Love and Long-Term Compatibility Alignment'}"
        
        Deconstruct calculations precisely across these exact structural units:
        1. 🌌 INDIVIDUAL MATRIX ALIGNMENTS: Summarize how their individual element signatures behave independently.
        2. ⚡ THERMODYNAMIC RESONANCE & FRICTION FOCALS: Identify exact personality overlaps, potential communication blockages, and areas of highest emotional attraction.
        3. 🧭 STRUCTURAL RECOMMENDATIONS: Provide practical, grounded guidance detailing how to navigate compatibility adjustments over the upcoming 2026 timeline.
        
        Write a minimum of 700 words using clean markdown bold formatting headers.`;
    } else if (productType === 'tarot') {
        analyticsPrompt = `Perform an expansive 3-card Tarot Spread calculation dossier for ${clientName}. Question: "${userQuestion || 'General Path Assessment'}"
        Include full breakdowns processing: Present Landscape, Past Foundations, Immediate Obstacle Thresholds, and Resolution Pathways.
        CRITICAL BUSINESS DIRECTIVE: Provide specific, clear focus detailing optimal career sectors, professional shifts, and adaptive actions suitable for their spread matrix.
        Write a minimum of 650 words.`;
    } else if (productType === 'numerology') {
        analyticsPrompt = `Generate a full-length Numerology Profile Blueprint for ${clientName}, calculating original layout identity text: "${identityString || clientName}" matching index date: ${birthDate}.
        Include exhaustive analyses tracking their Expression Core, Life Path Matrix, and 2026 Horizon Timeline.
        CRITICAL BUSINESS DIRECTIVE: Map out clear, detailed definitions detailing which modern career tracks, functional corporate industries, and structural fields perfectly align with their numbers.
        Write a minimum of 650 words.`;
    } else {
        // BaZi Logic Block containing Career/Industry matching directives
        analyticsPrompt = `Execute a comprehensive, professional-grade Four Pillars of Destiny (BaZi) Cosmic Blueprint for ${clientName}. 
        Coordinates: Date: ${birthDate} | Time: ${timeCoordinate || 'Unknown'} | Location: ${additionalCoordinates || 'Unknown'}.
        
        Deconstruct alignment matrix vectors precisely via these headers:
        1. ⛩️ THE FOUR PILLARS CHART: Build a clean text-based chart displaying Stems & Branches.
        2. ⚙️ ELEMENTAL BALANCE DIAGNOSTICS: Map access surpluses or deep element deficiencies.
        3. 💼 THE COMPREHENSIVE CAREER MATRIX: Explicitly evaluate what professional roles, modern commercial fields, and industries fit their structural Daymaster profile. Provide concrete examples.
        4. ⏳ THE 2026 TIMELINE PATHWAY: Strategic adjustments for efficiency during the immediate annual processing cycle.
        Write a minimum of 700 words.`;
    }

    try {
        // Direct Native Call to Google's official Gemini API Server endpoint
        const googleGeminiCall = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { 
                        role: 'user', 
                        parts: [{ text: `${systemIdentityPrompt}\n\nTask:\n${analyticsPrompt}` }] 
                    }
                ],
                generationConfig: {
                    temperature: 0.2 // Slightly fluid to preserve mystical elements, keeping values close together
                }
            })
        });

        const data = await googleGeminiCall.json();
        
        // Safely extract text output out of Google's specific nested structural JSON format
        const outputMarkdown = data.candidates[0].content.parts[0].text;
        
        // Structure the markdown to standard, beautiful email HTML format matching theme layouts
        const htmlBody = outputMarkdown.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#dfb76c;">$1</strong>');

        // Route directly to your automated Brevo distribution hub infrastructure
        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: { name: 'The Order of the White Cat', email: 'oracle@orderofwhitecat.com' },
                to: [{ email: email, name: clientName }],
                subject: `📋 Your Comprehensive Metaphysical Analysis Portfolio [Ref: ${transactionId || 'System-Run'}]`,
                htmlContent: `
                    <div style="font-family: 'Georgia', serif; max-width: 650px; margin: 0 auto; background: #0a0a12; color: #f5f5fa; padding: 48px; border-radius: 24px; border: 1px solid #2a2a48;">
                        <div style="text-align: center; border-bottom: 1px solid #2a2a48; padding-bottom: 24px; margin-bottom: 32px;">
                            <div style="font-size: 40px; margin-bottom: 12px;">🐱🔮</div>
                            <h1 style="font-family: 'Cinzel', serif; color: #dfb76c; font-size: 24px; font-weight: 400;">The Order of the White Cat</h1>
                            <p style="color: #a0a0ba; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Premium Portfolio Dossier Ledger</p>
                        </div>
                        <div style="line-height: 1.8; font-size: 15px; color: #d1d1e0;">
                            ${htmlBody}
                        </div>
                        <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #2a2a48; font-size: 11px; color: #626280;">
                            <p>Transaction Contribution Authentication Token: <strong>${amountPaidString || 'Dynamic Verification Metric'}</strong> [Node: ${gatewayVendorId}]</p>
                        </div>
                    </div>`
            })
        });

        return res.status(200).json({ success: true, message: 'Processing array completed.' });
    } catch (err) {
        console.error("Pipeline exception tracker loop failure:", err);
        return res.status(500).json({ error: 'Internal serverless loop execution crash.' });
    }
}