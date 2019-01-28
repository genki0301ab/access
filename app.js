"use strict";
require("dotenv").config();
const puppeteer = require("puppeteer");
const deviceDescriptors = require("puppeteer/DeviceDescriptors");
const colors = require("colors");
const delay = require("delay");

const input = process.argv[2];

const time = 2000;

const options = {
  useAgent: "",
  device: deviceDescriptors["iPhone X"]
};

/*
====================
■ eroterest
====================
*/
let eroterest = {
  origin: "https://movie.eroterest.net/"
};

/*
====================
■ erojiru
====================
*/
let erojiru = {
  origin: "https://erojiru.net/"
};

async function run() {
  console.log("bot running!!".red);
  const browser = await puppeteer.launch({
  	headless: false,
  	slowMo: 30,
    defaultViewport: null,
    args: [
      `--window-size=${process.env.WIDTH},${process.env.HEIGHT}`,
      "--window-position=0,0",
      "--no-sandbox",
      "--proxy-pac-url=http://www.cybersyndrome.net/pac.cgi?rl=a&a=a&rd=r&ru=a",
      //"--proxy-server=110.78.81.75:8080",
      //"--no-referrers"
    ],
    //devtools: true
  });

  const page = await browser.newPage();
  await page.setUserAgent(options.useAgent);
  await page.emulate(options.device);
  await page.goto(erojiru.origin);
  //await browser.close()
}
run();