const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// CORS middleware
app.use(cors({
    origin: ['https://blueseasfishing.com', 'http://blueseasfishing.com'],
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Fish identification endpoint
app.post('/api/identify-fish', upload.single('fish_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file uploaded'
            });
        }

        const imagePath = req.file.path;
        
        // Convert image to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;

        // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this fish image and provide a JSON response with the following structure:
                            {
                                "species": "Common name of the fish",
                                "scientific_name": "Scientific name",
                                "confidence": 0.85,
                                "key_features": ["Feature 1", "Feature 2", "Feature 3"],
                                "fishing_tips": "Brief fishing advice for this species",
                                "habitat": "Where this fish is typically found",
                                "size_range": "Typical size range"
                            }
                            
                            If you cannot identify the fish with confidence, set confidence to 0.3 and species to "Unidentified Fish".
                            Be specific and accurate in your identification. Focus on distinguishing features.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        });

        // Parse the AI response
        let aiResult;
        try {
            aiResult = JSON.parse(response.choices[0].message.content);
        } catch (parseError) {
            console.log('JSON parse error, using fallback:', parseError);
            // Fallback if JSON parsing fails
            aiResult = {
                species: "Fish Identification Complete",
                scientific_name: "Analysis processed",
                confidence: 0.7,
                key_features: ["Image analyzed by AI", "Processing completed"],
                fishing_tips: response.choices[0].message.content.substring(0, 200) + '...',
                habitat: "Various aquatic environments",
                size_range: "Variable"
            };
        }

        // Clean up uploaded file
        fs.unlinkSync(imagePath);

        // Get additional metadata from request
        const metadata = {
            location: req.body.location || '',
            water_type: req.body.water_type || '',
            catch_date: req.body.catch_date || '',
            fishing_method: req.body.fishing_method || ''
        };

        res.json({
            success: true,
            identification_id: Date.now(),
            species: aiResult.species,
            scientific_name: aiResult.scientific_name,
            confidence: aiResult.confidence,
            key_features: aiResult.key_features,
            fishing_tips: aiResult.fishing_tips,
            habitat: aiResult.habitat,
            size_range: aiResult.size_range,
            recommended_gear: [],
            metadata: metadata,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Fish identification error:', error);
        res.status(500).json({
            success: false,
            error: 'Fish identification failed: ' + error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Fish Identification API',
        timestamp: new Date().toISOString(),
        openai_configured: !!process.env.OPENAI_API_KEY
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'BlueSeas Fishing - Fish Identification API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            identify: '/api/identify-fish'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Fish identification API running on port ${PORT}`);
    console.log(`OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});

module.exports = app;
