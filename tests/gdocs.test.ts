import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanDocText,
  guessKind,
  parseDocUrl,
  parseFolderListing,
  parseLyrics,
  parseSayings,
  titleFromDisposition,
} from "../lib/gdocs";

const DOC = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";

test("doc, file, open and folder links resolve to ids", () => {
  assert.deepEqual(parseDocUrl(`https://docs.google.com/document/d/${DOC}/edit?usp=sharing`), { kind: "doc", id: DOC });
  assert.deepEqual(parseDocUrl(`https://docs.google.com/document/u/0/d/${DOC}/view`), { kind: "doc", id: DOC });
  assert.deepEqual(parseDocUrl(`https://drive.google.com/file/d/${DOC}/view`), { kind: "doc", id: DOC });
  assert.deepEqual(parseDocUrl(`https://drive.google.com/open?id=${DOC}`), { kind: "doc", id: DOC });
  assert.deepEqual(parseDocUrl(`https://drive.google.com/drive/u/1/folders/${DOC}?usp=sharing`), { kind: "folder", id: DOC });
  assert.deepEqual(parseDocUrl(` ${DOC} `), { kind: "doc", id: DOC });
});

test("links to other hosts or plain http are refused", () => {
  assert.equal(parseDocUrl(`https://evil.com/document/d/${DOC}`), null);
  assert.equal(parseDocUrl(`http://docs.google.com/document/d/${DOC}`), null);
  assert.equal(parseDocUrl("https://docs.google.com/spreadsheets/d/abc"), null);
  assert.equal(parseDocUrl("not a link"), null);
});

test("export title comes from Content-Disposition, UTF-8 form preferred", () => {
  assert.equal(
    titleFromDisposition(`attachment; filename="____.md"; filename*=UTF-8''%E6%99%B4%E5%A4%A9.md`),
    "晴天",
  );
  assert.equal(titleFromDisposition('attachment; filename="Night Song.txt"'), "Night Song");
  assert.equal(titleFromDisposition(null), undefined);
});

test("markdown export noise is cleaned", () => {
  assert.equal(cleanDocText("﻿**副歌**\-\r\n第二行  \r\n"), "副歌-\n第二行");
});

test("a doc without headings is one song named after the doc", () => {
  assert.deepEqual(parseLyrics("第一句\n第二句\n\n第三句\n2023-05-01\n", "晴天"), [
    { title: "晴天", date: "2023-05-01", body: "第一句\n第二句\n\n第三句" },
  ]);
});

test("headings and --- split a doc into several songs", () => {
  const doc = "# 歌一\n\n日期：2021\n\nA\nB\n\n# 歌二\nC\n\n---\n\nD\n";
  assert.deepEqual(parseLyrics(doc, "合輯"), [
    { title: "歌一", date: "2021", body: "A\nB" },
    { title: "歌二", body: "C" },
    { body: "D" },
  ]);
});

test("sayings split on paragraphs and bullets, with context and date", () => {
  const doc = "# 語錄\n\n人生如棋\n落子無悔\n— 下棋時想到的, 2022.3\n\n- 布丁要冰過才好吃\n- 慢慢來比較快\n2024-01-02\n";
  assert.deepEqual(parseSayings(doc), [
    { text: "人生如棋\n落子無悔", date: "2022-3", context: "下棋時想到的" },
    { text: "布丁要冰過才好吃" },
    { text: "慢慢來比較快", date: "2024-01-02" },
  ]);
});

test("a dash line alone is not a context without a saying above it", () => {
  assert.deepEqual(parseSayings("— 開頭"), [{ text: "— 開頭" }]);
});

test("auto mode reads headed docs as lyrics, plain ones as sayings", () => {
  assert.equal(guessKind("# 歌\n詞"), "lyrics");
  assert.equal(guessKind("一句\n\n兩句"), "sayings");
});

test("folder listing yields entries and flags Google Docs", () => {
  const html = `
    <div class="flip-entry" id="entry-${DOC}" tabindex="0" role="link"><div class="flip-entry-info">
      <a href="https://docs.google.com/document/d/${DOC}/edit?usp=drive_web" target="_blank">
      <div class="flip-entry-title">歌詞 &amp; 草稿</div></a></div></div>
    <div class="flip-entry" id="entry-1ZZZZZZZZZZZZZ" tabindex="0"><a href="https://drive.google.com/file/d/1ZZZZZZZZZZZZZ/view">
      <div class="flip-entry-title">demo.mp3</div></a></div>`;
  assert.deepEqual(parseFolderListing(html), [
    { id: DOC, title: "歌詞 & 草稿", isDoc: true },
    { id: "1ZZZZZZZZZZZZZ", title: "demo.mp3", isDoc: false },
  ]);
});
