const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: "screenshot",
        aliases: ["web", "capture"],
        version: "1.0",
        author: "JV",
        countDown: 10,
        role: 0,
        description: {
            vi: "Chụp ảnh màn hình của một trang web",
            en: "Capture a screenshot of a webpage"
        },
        category: "utility",
        guide: {
            en: "{PREFIX}screenshot <url> [full/mobile]"
        }
    },

    langs: {
        vi: {
            missingUrl: "Vui lòng cung cấp URL để chụp màn hình.",
            invalidUrl: "URL không hợp lệ. Vui lòng đảm bảo bạn nhập đúng URL với http:// hoặc https://",
            capturingScreenshot: "Đang chụp màn hình từ: %1",
            error: "Đã xảy ra lỗi khi chụp màn hình: %1",
            success: "📷 Đã chụp màn hình từ: %1"
        },
        en: {
            missingUrl: "Please provide a URL to capture.",
            invalidUrl: "Invalid URL. Please make sure you enter a valid URL with http:// or https://",
            capturingScreenshot: "Capturing screenshot from: %1",
            error: "An error occurred while capturing screenshot: %1",
            success: "📷 Screenshot captured from: %1"
        }
    },

    onStart: async function ({ api, args, message, event, threadsData, usersData, getLang }) {
        // Create cache directory if it doesn't exist
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }

        // Get URL from user input
        const url = args[0];
        if (!url) {
            return message.reply(getLang("missingUrl"));
        }

        // Validate URL
        let validUrl;
        try {
            validUrl = new URL(url);
            if (!validUrl.protocol.startsWith('http')) {
                return message.reply(getLang("invalidUrl"));
            }
        } catch (error) {
            try {
                validUrl = new URL('https://' + url);
            } catch (error) {
                return message.reply(getLang("invalidUrl"));
            }
        }

        const fullUrl = validUrl.href;
        const options = args[1] ? args[1].toLowerCase() : "normal";
        const outputPath = path.join(cacheDir, `screenshot-${Date.now()}.png`);
        
        // Inform user we're processing the request
        message.reply(getLang("capturingScreenshot", fullUrl));

        try {
            // First try with Puppeteer
            try {
                const browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                });
                
                const page = await browser.newPage();
                
                // Set viewport based on options
                if (options === "mobile") {
                    await page.setViewport({
                        width: 375,
                        height: 667,
                        deviceScaleFactor: 2,
                        isMobile: true,
                        hasTouch: true
                    });
                    // Set mobile user agent
                    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1');
                } else {
                    await page.setViewport({
                        width: 1280,
                        height: 800,
                        deviceScaleFactor: 1
                    });
                }

                // Navigate to the URL
                await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                
                // Take screenshot based on options
                if (options === "full") {
                    await page.screenshot({ 
                        path: outputPath,
                        fullPage: true 
                    });
                } else {
                    await page.screenshot({ 
                        path: outputPath 
                    });
                }

                await browser.close();
                
                // Send the screenshot
                return message.reply({
                    body: getLang("success", fullUrl),
                    attachment: fs.createReadStream(outputPath)
                }, () => fs.unlinkSync(outputPath));
                
            } catch (puppeteerError) {
                console.error("Puppeteer error:", puppeteerError);
                
                // Fallback to API service
                try {
                    const access_key = "ad8d5716c26c413d8405cbd418b8fab0";
                    const apiUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${access_key}&wait_until=page_loaded&url=${encodeURIComponent(fullUrl)}`;
                    
                    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
                    
                    fs.writeFileSync(outputPath, response.data);
                    
                    return message.reply({
                        body: getLang("success", fullUrl),
                        attachment: fs.createReadStream(outputPath)
                    }, () => fs.unlinkSync(outputPath));
                } catch (fallbackError) {
                    return message.reply(getLang("error", fallbackError.message));
                }
            }
        } catch (error) {
            return message.reply(getLang("error", error.message));
        }
    }
}; 