# Notices — ทรัพย์สินของบุคคลที่สามและของบริษัท

ที่เก็บนี้เป็นเอกสารภายในองค์กร สงวนลิขสิทธิ์ทั้งหมด ดูเงื่อนไขที่ [LICENSE](LICENSE)
หน้านี้ระบุที่มาของส่วนประกอบแต่ละอย่าง และเจ้าของสิทธิ์

## ฟอนต์ AP

```
assets/fonts/AP-Light.woff2
assets/fonts/AP-Regular.woff2
assets/fonts/AP-Medium.woff2
assets/fonts/AP-Bold.woff2
```

ฟอนต์ประจำองค์กรของ AP (Thailand) Public Company Limited
แปลงมาจากไฟล์ `AP-*.ttf` ที่ติดตั้งอยู่บนเครื่องผู้จัดทำ เป็น woff2 ด้วย
[fontTools](https://github.com/fonttools/fonttools) เพื่อให้ presentation แสดงผลตรงกับ
สไลด์องค์กร โดยไม่ได้แก้ไขรูปทรงตัวอักษรหรือ metrics ใดๆ

รวมไว้ในที่นี้เพื่อให้เดคแสดงผลได้ถูกต้อง ไม่ใช่การอนุญาตให้นำฟอนต์ไปใช้ต่อ
**ห้ามนำไฟล์ฟอนต์ไปใช้ในงานอื่นหรือแจกจ่ายต่อ** โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจาก AP

## โลโก้ AP

```
assets/img/ap-logo-dark.png
assets/img/ap-logo-light.png
```

เครื่องหมายการค้าของ AP (Thailand) Public Company Limited สกัดมาจากไฟล์นำเสนอภายในของบริษัท
ใช้เพื่อระบุที่มาของเอกสารนี้เท่านั้น ไม่ใช่การอนุญาตให้ใช้เครื่องหมายการค้า

`assets/img/favicon.svg` จัดทำขึ้นใหม่สำหรับโปรเจกต์นี้ แต่อ้างอิงรูปลักษณ์ของโลโก้ AP
จึงอยู่ภายใต้เงื่อนไขเดียวกัน

## เนื้อหา presentation

```
content/deck.json
data/deck-data.js
README.md
```

เนื้อหาภาษาไทยทั้งหมด — use case, prompt template, คู่มือ, ชื่อ business group,
ชื่อแบรนด์โครงการ และคำอธิบายวิธีทำงานภายใน — เป็นข้อมูลของ AP (Thailand) Public Company Limited
จัดทำขึ้นเพื่อใช้อบรมพนักงานภายใน ไม่ใช่เอกสารทางการของบริษัท และไม่ใช่เอกสารทางการของ Anthropic

## Design ต้นทาง

Design pattern (สีองค์กร, type scale, ผัง kicker + title + footer) อ้างอิงจากสไลด์องค์กร AP
ชุด `Snowflake-CoWork-Presentation.pptx` ซึ่งเป็นเอกสารภายในของทีม IT
**ไฟล์ต้นฉบับไม่ได้รวมอยู่ใน repo นี้** (อยู่ในโฟลเดอร์ `references/` ที่ถูก gitignore ไว้
เพราะมีข้อมูลส่วนบุคคลของผู้เข้าอบรม)

## Claude

Claude, Claude Chat และ Claude Cowork เป็นผลิตภัณฑ์และเครื่องหมายการค้าของ Anthropic
เดคนี้เป็นสื่อการอบรมภายในที่จัดทำโดยพนักงาน AP ไม่ใช่สื่อทางการของ Anthropic
