require('dotenv').config();
const puppeteer = require('puppeteer');
const xlsx = require('xlsx');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function automateBelingoGeo() {
  const workbook = xlsx.readFile('data.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Используем переменные окружения
  await page.goto(process.env.LOGIN_URL);
  await page.type('#user_login', process.env.USERNAME_ADMIN);
  await page.type('#user_pass', process.env.PASSWORD);
  await Promise.all([
    page.click('#wp-submit'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  for (const city of data) {
    await page.goto('https://worldanimals.ru/wp-admin/post-new.php?post_type=cities');

    await page.evaluate((data) => {
      document.querySelector('input[name="post_title"]').value = data['Название города'] || '';
      document.querySelector('input[name="city_padej1"]').value = data['Название в падеже'] || '';
      document.querySelector('input[name="city_phone_link"]').value = data['Номер'] || '';
    }, city);

    await wait(1000);

    await Promise.all([
      page.click('#publish'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    await wait(2000);

    console.log(`Город "${city['Название города']}" опубликован.`);
  }

  await browser.close();
}

automateBelingoGeo().catch(console.error);
