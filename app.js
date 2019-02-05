"use strict";
require("dotenv").config();
const app = require("./package.json");
const puppeteer = require("puppeteer");
const deviceDescriptors = require("puppeteer/DeviceDescriptors");
const colors = require("colors");
const delay = require("delay");

const input = process.argv[2];

const options = {
  device: deviceDescriptors[eval(Math.floor(Math.random() * deviceDescriptors.length - 1))]
};

function random(min, max) { 
  return Math.floor(Math.random() * (max + 1 - min)) + min;
};

/*
====================
■ mysite
====================
*/
let mysite = {
  origin: process.env.MYSITE_ORIGIN,
  matchLink: process.env.MYSITE_MATCH_LINK
};

/*
====================
■ target
====================
*/
let target = {
  origin: process.env.TARGET_ORIGIN,
  matchLink: process.env.TARGET_MATCH_LINK
};

let wait = {
  min: 10000,
  max: 60000
};
let delayTime = random(wait.min, wait.max); 
let completeTime = 0;

//条件にマッチしたアンカーリンク
let anchor = null;
//マッチしたリンクの数
let linkLength = null;
//リンクを取得したインデックス番号
let targetIndex = null;
//遷移先URL
let gotoLink = null;

//巡回回数
let patrol = random(eval(process.env.PATROL_MIN), eval(process.env.PATROL_MAX));
//巡回回数カウント
let count = 1;

//headlessモード
const headless = true;

async function run() {
  const browser = await puppeteer.launch({
    headless: headless,
  	slowMo: 50,
    defaultViewport: null,
    args: [
      `--window-size=${process.env.WIDTH},${process.env.HEIGHT}`,
      "--window-position=0,0",
      "--no-sandbox",
      '--disable-infobars', //情報バー非表示
      '--incognito', //シークレットモード
      //"--proxy-pac-url=",
      //"--proxy-server=",
      //"--no-referrers"
    ],
    devtools: true
  });
  console.log(colors.green(
  `===============================================================================================\n`+
  `AppName: ${app.name}                                                                           \n`+
  `Version: ${app.version}                                                                        \n`+
  `Description: ${app.description}                                                                \n`+
  `===============================================================================================\n`
  ));
  const page = (await browser.pages())[0];
  await page.emulate(options.device);
  
  //ipアドレス確認
  if (headless == false) {
    const page_ipinfo = await browser.newPage();
    page_ipinfo.goto("https://www.cman.jp/network/support/go_access.cgi");
    await delay(10000);
    await page.bringToFront();
  }

  //スクロール処理
  async function autoScroll(page) {
    await page.evaluate(async function() {
      let totalHeight = 0;
      let distance = window.innerHeight;
      let timer = setInterval(function() {
        let scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance);
        totalHeight += distance;
        if(totalHeight >= scrollHeight){
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  }

  //ページ遷移処理
  async function access(page, requestURL, referer) {
    await page.setExtraHTTPHeaders({
      "referer": referer
    });
    await page.goto(requestURL, {
      timeout: 0,
      waitUntil: "domcontentloaded"
    });
  }

  async function patrol(page, ) {
  }

  await access(page, mysite.origin, "https://www.google.com/");

  //debug
  console.log("参照サイトにアクセス".red);
  console.log("現在のURL: ".blue + colors.underline.blue(page.url()) + "\n");

  //参照サイトを巡回、変数リセット
  patrol = random(eval(process.env.MYSITE_PATROL_MIN), eval(process.env.MYSITE_PATROL_MAX));
  count = 1;
  completeTime = 0;
  while(count <= patrol) {
    delayTime = random(wait.min, wait.max);
    completeTime += delayTime;

    //debug
    console.log(`${count}ページ目`.red);
    console.log("現在のURL: ".blue + colors.underline.blue(page.url()));
    console.log(`待ち時間: ${delayTime / 1000}秒`.red);

    await delay(delayTime);
    await autoScroll(page);
    anchor = await page.$$(`a[href^="${mysite.matchLink}"]`);
    linkLength = anchor.length;

    //debug
    console.log(`ページ条件にマッチしたリンク数: ${linkLength}`.red);

    //リンクをランダムに決定
    targetIndex = random(1, linkLength);

    //debug
    console.log(`リンクを取得したインデックス番号: ${targetIndex}`.red);

    gotoLink = await (await anchor[targetIndex - 1].getProperty("href")).jsonValue();

    //debug
    console.log("遷移先URL: ".blue + colors.underline.blue(gotoLink));

    await access(page, gotoLink, page.url());

    //debug
    console.log("done!\n".green);

    //next
    count += 1;
  }

  //debug
  console.log(`参照サイトの総閲覧数: ${patrol}回`.red);
  console.log(`参照サイトの総滞在時間: ${completeTime / 1000}秒`.red);
  console.log("complete!!\n".green);

  //**************************************************

  //ターゲットにアクセス
  anchor = await page.$$(`a[href^="${target.origin}"]`);
  linkLength = anchor.length;
  if(linkLength >= 1) {
    targetIndex = random(1, linkLength);
    gotoLink = await (await anchor[targetIndex - 1].getProperty("href")).jsonValue();
    await access(page, gotoLink, page.url());
  }
  if(linkLength == 0) {
    await access(page, target.origin, page.url());
  }

  //debug
  console.log("ターゲットサイトにアクセス".red);
  console.log("現在のURL: ".blue + colors.underline.blue(page.url()) + "\n");

  //**************************************************
  
  //ターゲットサイトを巡回、変数リセット
  patrol = random(eval(process.env.TARGET_PATROL_MIN), eval(process.env.TARGET_PATROL_MAX));
  count = 1;
  completeTime = 0;
  while(count <= patrol) {
    delayTime = random(wait.min, wait.max);
    completeTime += delayTime;

    //debug
    console.log(`${count}ページ目`.red);
    console.log("現在のURL: ".blue + colors.underline.blue(page.url()));
    console.log(`待ち時間: ${delayTime / 1000}秒`.red);

    await delay(delayTime);
    await autoScroll(page);
    anchor = await page.$$(`a[href^="${target.matchLink}"]`);
    linkLength = anchor.length;

    //debug
    console.log(`ページ条件にマッチしたリンク数: ${linkLength}`.red);

    //リンクをランダムに決定
    targetIndex = random(1, linkLength);

    //debug
    console.log(`リンクを取得したインデックス番号: ${targetIndex}`.red);

    gotoLink = await (await anchor[targetIndex - 1].getProperty("href")).jsonValue();

    //debug
    console.log("遷移先URL: ".blue + colors.underline.blue(gotoLink));

    await access(page, gotoLink, page.url());

    //debug
    console.log("done!\n".green);

    //next
    count += 1;
  }

  //debug
  console.log(`ターゲットサイトの総閲覧数: ${patrol}回`.red);
  console.log(`ターゲットサイトの総滞在時間: ${completeTime / 1000}秒`.red);
  console.log("complete!!".green);

  await browser.close();
}
run();