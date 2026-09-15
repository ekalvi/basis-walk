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
test('desktop and mobile controls, exact checks and lazy network',async({page})=>{
  const errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(!request.url().startsWith(base))external.push(request.url());});
  await page.goto(base);
  await expect(page.locator('#coordinates')).toContainText('P128');
  for(const d of ['3','4','5','6']){
    await page.selectOption('#dimension',d);
    await page.click('#check');
    await expect(page.locator('#check-output')).toContainText('PASS');
  }
  await page.locator('#reveal').fill('32');
  await expect(page.locator('#coordinates')).toContainText('P32');
  await page.locator('#walk').focus();await page.keyboard.press('ArrowRight');
  await page.screenshot({path:'.local/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'.local/mobile.png',fullPage:true});
  expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('Python worker can stop and reports blocked runtime',async({page})=>{
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.goto(base);await page.click('#run-python');
  await expect(page.locator('#python-output')).toContainText('Error');
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
});
