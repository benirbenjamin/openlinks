const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to handle opening link in Chrome
app.post('/open-link', async (req, res) => {
    const { link, duration } = req.body;

    try {
        // Dynamically import chrome-launcher
        const chromeLauncher = await import('chrome-launcher');
        const launcher = chromeLauncher.default;

        // Launch Chrome
        const chrome = await launcher.launch({
            startingUrl: link,
            userDataDir: true, // This enables access to user profile data
        });

        console.log('Chrome instance opened successfully.');

        // Close Chrome after specified duration
        setTimeout(() => {
            chrome.kill();
            console.log('Chrome instance closed.');
        }, duration * 1000);

        res.json({ message: 'Link opened successfully in Chrome.' });
    } catch (err) {
        console.error('Error launching Chrome:', err);
        res.status(500).json({ message: 'An error occurred while opening the link.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
