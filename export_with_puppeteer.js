const puppeteer = require('puppeteer');
const fs = require('fs');

const url = process.argv[2];
const outputPath = process.argv[3] || "export.xls";

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the download button to appear
    await page.waitForSelector('#download-xls');

    // Intercept download
    page.on('response', async (response) => {
        const contentType = response.headers()['content-type'];
        if (contentType && contentType.includes('application/vnd.ms-excel')) {
            const buffer = await response.buffer();
            fs.writeFileSync(outputPath, buffer);
            console.log("✔ Excel file saved to", outputPath);
        }
    });

    // Click the download button
    await page.click('#download-xls');

    // Give it time to process download
    await page.waitForTimeout(3000);

    await browser.close();
})();

