import { chromium } from 'playwright';

const SERIES_DIR = 'C:\\Users\\endos\\OneDrive\\바탕 화면\\바탕화면 파일 모음\\case1_F86_26002501\\26002501_20260521_132929_1700761402146564';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const errors = [];
const logs = [];

page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => {
  logs.push(`[${m.type().toUpperCase()}] ${m.text()}`);
});

try {
  await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(2000);

  // 숨겨진 파일 input에 DICOM 파일 주입
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(SERIES_DIR);

  console.log('\nDICOM 폴더 업로드 완료. 렌더링 대기 중...');

  // 로딩 오버레이가 사라질 때까지 대기 (최대 3분)
  try {
    await page.waitForSelector('[class*="overlay"]', { state: 'hidden', timeout: 180000 });
    console.log('로딩 완료!');
  } catch (e) {
    console.log('타임아웃 - 현재 상태로 스크린샷 촬영');
  }
  await page.waitForTimeout(2000);

} catch (e) {
  console.log('ERROR:', e.message);
}

console.log('\n=== PAGE ERRORS ===');
if (errors.length === 0) console.log('(없음 - 정상)');
errors.forEach(e => console.log(e));

await page.screenshot({ path: 'test_screenshot.png', fullPage: false, timeout: 60000 });
console.log('\n스크린샷 저장: test_screenshot.png');
console.log('\n=== RELEVANT CONSOLE LOGS ===');
if (logs.length === 0) console.log('(없음)');
logs.forEach(l => console.log(l));

await browser.close();
