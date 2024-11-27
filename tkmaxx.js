const Apify = require('apify');
const { log } = Apify.utils;
const puppeteer = require('puppeteer');

Apify.main(async () => {
    const input = await Apify.getInput();
    const url = input.url;
    
    if (!url) {
        throw new Error('No URL provided');
    }

    // Launch puppeteer browser instance
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Scrape product details
    const product = await page.evaluate(() => {
        const title = document.querySelector('#productTitle')?.textContent.trim();
        const price = document.querySelector('.a-price-whole')?.textContent.trim();
        const imageUrl = document.querySelector('#landingImage')?.src;
        const aboutItem = Array.from(document.querySelectorAll('#feature-bullets li')).map(li => li.textContent.trim());
        const details = {};

        document.querySelectorAll('.a-normal.a-spacing-micro tr').forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length === 2) {
                const name = cols[0].textContent.trim();
                const value = cols[1].textContent.trim();
                details[name] = value;
            }
        });

        return {
            title,
            price,
            imageUrl,
            aboutItem,
            details,
        };
    });

    // Save to Apify dataset or directly to PDF/CSV (depending on your setup)
    const dataset = await Apify.openDataset('products');
    await dataset.pushData(product);

    // Save as PDF (simplified)
    const pdfData = await page.pdf();
    await Apify.setValue('product.pdf', pdfData);

    // Log results
    log.info('Product details saved to dataset and PDF');

    await browser.close();
});
