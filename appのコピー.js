"use strict";
require("dotenv").config();
const puppeteer = require("puppeteer");
const delay = require("delay");

const input = process.argv[2];

/*
====================
■ shareVideo
====================
*/
let shareVideo = {
  origin: "https://share-videos.se/",
  loginURL: process.env.SHAREVIDEO_LOGIN_URL,
  mailadress: process.env.SHAREVIDEO_MAILADRESS,
  password: process.env.SHAREVIDEO_PASSWORD,
  detail: {
    url: null,
    embedURL: null,
    imageURL: null,
    iframe: null
  }
};

/*
====================
■ eroterest
====================
*/
let eroterest = {
  origin: "https://movie.eroterest.net/",
  loginURL: process.env.EROTEREST_LOGIN_URL,
  searchPage: process.env.EROTEREST_SEARCH_PAGE,
  mailadress: process.env.EROTEREST_MAILADRESS,
  password: process.env.EROTEREST_PASSWORD
};

/*
====================
■ dmm
====================
*/
let dmm = {
  origin: "https://www.dmm.com/",
  loginURL: process.env.DMM_LOGIN_URL,
  mailadress: process.env.DMM_MAILADRESS,
  password: process.env.DMM_PASSWORD,
  affiliateID: process.env.DMM_AFFILIATE_ID,
  detail: {
    url: null,
    title: null,
    member: [],
    tag: [],
    comment: null,
    imageURL: null
  }
};

/*
====================
■ erojiru
====================
*/
let erojiru = {
  origin: "https://erojiru.net/",
  loginURL: process.env.EROJIRU_LOGIN_URL,
  postURL: process.env.EROJIRU_POST_URL,
  username: process.env.EROJIRU_USERNAME,
  password: process.env.EROJIRU_PASSWORD,
  templateTitle: function() {
    let result = `【誰にオススメ(タイトル)】どんな内容(サブタイトル)【${dmm.detail.member.join("、")}】`;
    return result;
  },
  templateContent: function() {
    let result;
    result = [
      `${shareVideo.detail.iframe}`,
      `<p style="text-align: center;"><b><a href="https://movie.eroterest.net/" target="_blank">☞動画が見れない場合はこちら</a></b></p>`,
      `<h2>【誰にオススメ(タイトル)】どんな内容(サブタイトル)【${dmm.detail.member.join("、")}】</h2>`,
      `<a href="https://movie.eroterest.net/site/s/10035/"　target="_blank" data="${dmm.detail.comment}">`,
      `<p>☟関連動画や別の動画を検索<p>`,
      `<img src="${shareVideo.detail.imageURL}" alt="【誰にオススメ(タイトル)】どんな内容(サブタイトル)【${dmm.detail.member.join("、")}】">`,
      `<p>☟この動画の完全版はこちら！！</p>`,
      `<a href="${dmm.detail.url}/${dmm.affiliateID}" target="_blank"><img src="${dmm.detail.imageURL}" alt="${dmm.detail.title}"></a>`
    ];
    return result;
  },
  postDate: {
    time: [
      "19:00",
      "22:00"
    ]
  }
};

/*
====================
■ xvideoJp
====================
*/
let xvideoJP = {
  origin: "http://xvideo-jp.com/"
};

async function run() {
  const browser = await puppeteer.launch({
  	headless: false,
  	slowMo: 10,
    defaultViewport: null,
    args: [
      `--window-size=${process.env.WIDTH},${process.env.HEIGHT}`,
      "--window-position=0,0",
    ],
    //devtools: true
  });

  const page01 = await browser.newPage();
  //エロ汁動画　ログイン
  await page01.goto(erojiru.loginURL);
  await page01.type("#user_login", erojiru.username);
  await page01.type("#user_pass", erojiru.password);
  await page01.click("#wp-submit");
  await page01.goto(erojiru.postURL);
  //エロ汁動画　記事新規追加ページ
  await page01.click('input[name="titleName"]'); //「記事タイトル │ エロ汁動画」を表示
  await page01.click('input[name="outline_none"]'); //目次を非表示

  //ShareVideo ログイン
  const page02 = await browser.newPage();
  await page02.goto(shareVideo.loginURL);
  await page02.type('input[name="mail"]', shareVideo.mailadress);
  await page02.type('input[name="password"]', shareVideo.password);
  await page02.click('input[value="Login"]');

  //エロタレスト ログイン
  const page03 = await browser.newPage();
  await page03.goto(eroterest.loginURL);
  await page03.type("#mail", eroterest.mailadress);
  await page03.type("#pass", eroterest.password);
  await page03.click('input[value="ログイン"]');
  //エロタレスト 　記事検索ページ
  await page03.goto(eroterest.searchPage);

  //DMM ログイン 
  const page04 = await browser.newPage();
  await page04.goto(dmm.loginURL);
  await page04.type("#login_id", dmm.mailadress);
  await page04.type("#password", dmm.password);
  await page04.click('input[value="ログイン"]');

  //無料AV動画
  const page05 = await browser.newPage();
  await page05.goto(xvideoJP.origin);
  let cardLength = await page05.$$eval(".p-recent__inner > .c-card", function(elements) {
    return elements.length;
  });
  let cardIndex = 1;
  await page05.click(`.p-recent__inner > .c-card:nth-of-type(${input == undefined ? cardIndex : input}) > .c-card__img > a`);
  await page05.waitForSelector(".p-articleDMM__thumb"); //wait 
  //dmm作品詳細
  dmm.detail.url = await page05.$eval(".p-articleDMM__thumb > a", function(element) {
    return element.href;
  });
  //shareVideo作品詳細
  let frame = await page05.frames()[await page05.frames().length - 1];
  await frame.waitForSelector("#logo"); //wait
  shareVideo.detail.url = await frame.$eval("#logo > a", function(element) {
    return element.href;
  });

  //shareVideoページにタブ切り替え
  await page02.bringToFront();
  await page02.goto(shareVideo.detail.url, {waitUntil: "domcontentloaded"});
  await page02.evaluate(function() {
    window.scrollBy(0, 500);
  });
  await page02.waitForSelector("#open_embed");
  await page02.click("#open_embed");
  await page02.waitForSelector("#user_embed_text"); //wait 
  shareVideo.detail.embedURL = await page02.$eval("#user_embed_text > a", function(element) {
    return element.href;
  });
  await page02.goto(shareVideo.detail.embedURL, {waitUntil: "domcontentloaded"});
  shareVideo.detail.imageURL = await page02.$eval(".col-sm-12 > .video_post:nth-of-type(3) > .inner > a > .screencast > img", function(element) {
    return element.src;
  });
  shareVideo.detail.iframe = await page02.$eval("#result_v3", function(element) {
    return element.innerHTML;
  });

  //エロタレストにタブ切り替え、動画検索
  await page03.bringToFront();
  await page03.type("#url", shareVideo.detail.url);
  await page03.click("#globalnav > div.panel-body > form > button");

  //dmmページにタブ切り替え、作品詳細ページに移動
  await page04.bringToFront();
  await page04.goto(dmm.detail.url);
  await page04.waitForSelector("#mu"); //wait 
  //タイトル取得
  dmm.detail.title = await page04.$eval("h1#title", function(element) {
    return element.textContent;
  });
  //女優名取得
  let memberLength = await page04.$$eval("#performer > a", function(elements) {
    return elements.length;
  });
  let memberIndex = 1;
  while(memberIndex <= memberLength) {
    let member = await page04.$eval(`#performer > a:nth-of-type(${memberIndex})`, function(element) { //出演女優
      return element.textContent;
    });
    dmm.detail.member.push(member);
    memberIndex += 1;
  }
  //タグ取得
  let tagLength = await page04.$$eval("#mu > div > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(11) > td:nth-child(2) > a", function(elements) {
    return elements.length;
  });
  let tagIndex = 1;
  while(tagIndex <= tagLength) {
    let tag = await page04.$eval(`#mu > div > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(11) > td:nth-child(2) > a:nth-of-type(${tagIndex})`, function(element) {
      return element.textContent;
    });
    dmm.detail.tag.push(tag);
    tagIndex += 1;
  }
  //コメント取得
  dmm.detail.comment = await page04.$eval("#mu > div > table > tbody > tr > td:nth-child(1) > div.mg-b20.lh4", function(element) {
    let data = element.innerHTML;
    data = data.replace(/\s/g, ""); //改行を除去
    data = data.replace(/<\w.*<\/\w*>/g, ""); //不要文書を除去
    data = data.trim(); //空白除去
    return data;
  });
  //画像URL取得
  let clickElement = await page04.$("#sample-video > div.tx10.pd-3 > a");
  if(clickElement !== null) {
    await page04.click("#sample-video > div.tx10.pd-3 > a");
    await delay(5000);
    dmm.detail.imageURL = await page04.$eval("#preview-image.sample-pic", function(element) {
      return element.src;
    });
  }
  if(clickElement === null) {
    dmm.detail.imageURL = await page04.$eval("#sample-video > img", function(element) {
      return element.src;
    });
  }

  //エロ汁動画にタブ切り替え
  await page01.bringToFront();
  //タイトル入力
  await page01.type("#title-prompt-text", erojiru.templateTitle());
  //本文入力
  await page01.type("textarea#content", erojiru.templateContent().join("\n"));
  //title設定
  await page01.type('input[name="title"]', erojiru.templateTitle());
  //description設定
  await page01.type("textarea#description", erojiru.templateTitle());
  //カテゴリー選択
  await page01.click("#in-category-19"); //ShareVideoを選択
  //タグ入力
  await page01.type("#new-tag-post_tag", dmm.detail.member.concat(dmm.detail.tag).join(",")); 
  await page01.click("input.tagadd");
  //画像URL入力
  await page01.type("#fifu_input_url", shareVideo.detail.imageURL);
  await page01.click("#fifu_button");

  /*
  //公開
  await page01.click("#publish");
  await page01.waitForSelector("#wpbody-content > div.wrap > a"); //wait
  await page01.goto(erojiru.postURL);
  */

  //await browser.close();
}
run();