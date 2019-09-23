const fs = require("fs");
const path = require("path");
const phantom = require("phantom");
const express = require("express");
const ear = require("express-async-errors");
const app = express();

let page = null;
let instance = null;
async function initPhantom() {
  // phantom.outputEncoding = "utf-8";
  instance = await phantom.create();
  page = await instance.createPage();
  page.property("zoomFactor", 2);
}

async function genSnapshot(url) {
  const fileName = `${path.basename(url)}.pdf`;
  const filePath = path.join(path.resolve("pdf"), fileName);
  await page.open(url);
  await page.render(filePath, { quality: "75" });
  // await instance.exit();

  //检查生成文件大小 小于3kb即为快照失败
  let stat = fs.statSync(filePath);
  if (stat.size / 1024 < 3) {
    throw new Error("生成快照失败");
  }

  return "/pdf/" + fileName;
}

app.set("port", process.env.PORT || 3000);
app.set("etag", false);
app.set("trust proxy", true);

app.get("/", async (req, res) => {
  res.send("running");
});

app.get("/test", async (req, res) => {
  res.send("running");
});

app.get("/pdf", async (req, res) => {
  let { url } = req.query;
  if (!url) {
    throw new Error("HTML URL Required");
  }
  let result = await genSnapshot(url);
  res.send(result);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  let message = err.message;
  if (typeof err == "string") {
    message = err;
  }
  res.status(500);
  res.send(message);
});

app.listen(app.get("port"), async () => {
  console.info("Phantom PDF Server Starting");
  // await initPhantom();
  console.info("Phantom PDF Server Started");

  console.info(`CWD: ${process.cwd()}`);
  console.info(`Port: ${app.get("port")}`);
});
