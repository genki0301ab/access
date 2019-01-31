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

let wait = {
  min: 10000,
  max: 60000
};
let delayTime = random(wait.min, wait.max); 
let completeTime = 0;
let currentURL = null;

/*
====================
■ mysite
====================
*/
let mysite = {
  origin: process.env.MYSITE_ORIGIN
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

async function run() {
  const browser = await puppeteer.launch({
  	headless: false,
  	slowMo: 50,
    defaultViewport: null,
    args: [
      `--window-size=${process.env.WIDTH},${process.env.HEIGHT}`,
      "--window-position=0,0",
      "--no-sandbox",
      '--disable-infobars', //情報バー非表示
      '--incognito', //シークレットモード
      "--proxy-pac-url=http://www.cybersyndrome.net/pac.cgi?rl=a&a=a&rd=r&ru=a",
      //"--proxy-server=",
      //"--no-referrers"
    ],
    devtools: true
  });
  //debug
  console.log(colors.green(
  `===============================================================================================\n`+
  `AppName: ${app.name}                                                                           \n`+
  `Version: ${app.version}                                                                        \n`+
  `Description: ${app.description}                                                                \n`+
  `===============================================================================================\n`
  ));
  const page = (await browser.pages())[0];
  await page.emulate(options.device);

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
      }, 100)
    });
  }

  await page.goto(mysite.origin, {
      timeout: 0,
      waitUntil: "domcontentloaded"
  });
  //wait
  await delay(wait.min, wait.max);
  //scroll
  autoScroll(page);

  currentURL = page.url();
  //リファラーを追加
  await page.setExtraHTTPHeaders({
      "referer": `${currentURL}`
  });

  await page.goto(target.origin, {
    timeout: 0,
    waitUntil: "domcontentloaded"
  });

  let patrol = random(eval(process.env.PATROL_MIN), eval(process.env.PATROL_MAX));
  let count = 1;
  while(count <= patrol) {
    delayTime = random(wait.min, wait.max);
    completeTime += delayTime;
    currentURL = page.url();
    //debug
    console.log(`${count}ページ目`.red);
    console.log("現在のURL: ".blue + colors.underline.blue(currentURL));
    console.log(`待ち時間: ${delayTime / 1000}秒`.red);
    //wait
    await delay(delayTime);
    //scroll
    autoScroll(page);
    let anchor = await page.$$(`a[href*="${target.matchLink}"]`);
    let linkLength = anchor.length;
    //debug
    console.log(`ページ条件にマッチしたリンク数: ${linkLength}`.red);
    //リンクをランダムに決定
    let targetIndex = random(1, linkLength);
    //debug
    console.log(`アンカーリンクのインデックス番号: ${targetIndex}`.red);
    let gotoLink = await (await anchor[targetIndex - 1].getProperty("href")).jsonValue();
    //debug
    console.log("遷移先URL: ".blue + colors.underline.blue(gotoLink));
    //リファラーを追加
    await page.setExtraHTTPHeaders({
      "referer": `${currentURL}`
    });
    await page.goto(gotoLink, {
      timeout: 0,
      waitUntil: "domcontentloaded"
    });
    //debug
    console.log("done!\n".green);
    //next
    count += 1;
  }
  //debug
  console.log(`ターゲットページの総閲覧数: ${patrol}回`.red);
  console.log(`総滞在時間: ${completeTime / 1000}秒`.red);
  console.log("complete!!".green);
  await browser.close();
}
run();