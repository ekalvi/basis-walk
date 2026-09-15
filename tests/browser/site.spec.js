import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
let server,base;
const root=fileURLToPath(new URL('../../site/',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.py':'text/plain'};
test.beforeAll(async()=>{
  // Temporary loopback-only test fixture, not a hosting/deployment adapter.
  server=createServer(async(req,res)=>{
    const file=new URL(req.url,'http://localhost').pathname;
    if(file!=='/' && !/^\/[a-z-]+\.(html|js|css|svg|py)$/.test(file)){res.writeHead(404).end();return;}
    try{const name=file==='/'?'index.html':file.slice(1);const data=await readFile(path.join(root,name));
      res.writeHead(200,{'Content-Type':types[path.extname(name)]});res.end(data);
    }catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve));});
test('compact results, compressed views and projection explanation stay local',async({page})=>{
  const errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(!request.url().startsWith(base))external.push(request.url());});
  await page.goto(base);
  await expect(page.locator('#coordinates')).toContainText('P256');
  await expect(page.locator('.results-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.hero a[href="https://erdos-193.q5m.ai/"]')).toBeVisible();
  await expect(page.locator('#check')).toHaveCount(0);
  for(const d of ['3','4','5','6']){
    await page.selectOption('#dimension',d);
    await expect(page.locator('#map-columns tr')).toHaveCount(Number(d));
    await expect(page.locator('#projection')).toContainText('2D screen');
    const coordinates=await page.locator('#coordinates').textContent();
    await page.locator('#compression').fill('24');
    await expect(page.locator('#view-label')).toContainText('1/24');
    await expect(page.locator('#coordinates')).toHaveText(coordinates);
    await page.click('#uncompressed');
    await expect(page.locator('#view-label')).toContainText('uncompressed');
    await expect(page.locator('#coordinates')).toHaveText(coordinates);
  }
  await page.click('#reset');
  await expect(page.locator('#compression')).toHaveValue('1');
  await page.locator('#projection-details summary').click();
  await expect(page.locator('#map-caption')).toContainText('illustrative');
  await expect(page.locator('#map-columns tr').first()).toContainText('0.7');
  await page.locator('#projection-details summary').click();
  await page.locator('#reveal').fill('32');
  await expect(page.locator('#coordinates')).toContainText('P32');
  await page.locator('#walk').focus();await page.keyboard.press('ArrowRight');
  await page.screenshot({path:'.local/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'.local/mobile.png',fullPage:true});
  expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('styled workbench connects edited code to output on desktop and mobile',async({page})=>{
  await page.goto(base);
  await expect(page.locator('.tok-keyword').first()).toHaveText('from');
  const source=await page.locator('.source-panel').boundingBox();
  const output=await page.locator('.output-panel').boundingBox();
  expect(output.x).toBeGreaterThan(source.x);
  await page.locator('#python-code').fill('print("<img src=x onerror=alert(1)>")\n# local text only');
  await expect(page.locator('#code-highlight code')).toHaveText('print("<img src=x onerror=alert(1)>")\n# local text only\n');
  await expect(page.locator('#code-highlight img')).toHaveCount(0);
  await expect(page.locator('#run-status')).toContainText('Edited');
  await page.locator('#fullscreen-code').click();
  await expect(page.locator('#fullscreen-code')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');
  await expect(page.locator('#fullscreen-code')).toHaveAttribute('aria-pressed','false');
  await page.locator('#reset-code').click();
  await expect(page.locator('#python-code')).toHaveValue(/from walks import vertices, check/);
  await page.setViewportSize({width:390,height:844});
  // Read both rects in one frame: viewport resize can change scroll anchoring.
  await expect.poll(()=>page.evaluate(()=>{
    const source=document.querySelector('.source-panel').getBoundingClientRect();
    const output=document.querySelector('.output-panel').getBoundingClientRect();
    return output.top>=source.bottom;
  })).toBe(true);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('Python worker can stop and reports blocked runtime',async({page})=>{
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.goto(base);await page.click('#run-python');
  await expect(page.locator('#python-output')).toContainText('Error');
  await expect(page.locator('#run-status')).toHaveText('Failed');
  await expect(page.locator('#run-python')).toBeEnabled();
  await page.unroute('https://cdn.jsdelivr.net/**');
  await page.click('#run-python');await page.click('#stop-python');
  await expect(page.locator('#python-output')).toContainText('Stopped.');
  await expect(page.locator('#run-python')).toBeEnabled();
});
test('live pinned Pyodide executes exact checker',async({page})=>{
  test.skip(!process.env.TEST_PYODIDE,'Opt in to external CDN integration with TEST_PYODIDE=1');
  await page.goto(base);await page.click('#run-python');
  await expect(page.locator('#python-output')).toContainText('finite-prefix-pass',{timeout:120000});
  await expect(page.locator('#run-python')).toBeEnabled();
  await expect(page.locator('#run-status')).toHaveText('Finished');
  await page.locator('#python-code').fill('print("edited output")');
  await page.locator('#python-code').press('Control+Enter');
  await expect(page.locator('#python-output')).toContainText('edited output',{timeout:120000});
  await expect(page.locator('#python-output')).not.toContainText('finite-prefix-pass');
  await expect(page.locator('#run-python')).toBeEnabled();
});
