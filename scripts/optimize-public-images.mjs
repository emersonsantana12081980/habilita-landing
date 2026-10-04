// Redimensiona os arquivos fornecidos; não gera nem altera o conteúdo das fotos.
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({channel:"chrome",headless:true});
try {
  const page = await browser.newPage();
  await mkdir("public/images",{recursive:true});
  const sources = [
    ["vehicles.png","hero-640.webp",640,255,true],
    ["vehicles.png","hero-960.webp",960,382,true],
    ["brand.png","brand.webp",240,160,false],
    ["9f9ca8a1-0a11-4449-9b8b-b09d88bcb6d0.png","emerson.webp",960,640,false],
  ];
  for (const [source,target,width,height,hero] of sources) {
    const bytes = await readFile(`public/${source}`);
    const result = await page.evaluate(async ({data,width,height,hero}) => {
      const img = new Image(); img.src=data; await img.decode();
      const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
      canvas.getContext("2d").drawImage(img,0,0,img.width,hero?img.width/2.51:img.height,0,0,width,height);
      return canvas.toDataURL("image/webp",0.85).split(",")[1];
    },{data:`data:image/png;base64,${bytes.toString("base64")}`,width,height,hero});
    const converted=Buffer.from(result,"base64");
    await writeFile(`public/images/${target}`,converted);
    console.log(`${source} -> ${target}: ${bytes.length} -> ${converted.length} bytes`);
  }
} finally { await browser.close(); }
