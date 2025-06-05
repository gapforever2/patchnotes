const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const path = require("path");
const fs = require("fs");

module.exports = async function (req, res, next) {
  // Имитация реальной загрузки изображений
  await delay(50 + Math.random() * 200);
  if (req.originalUrl.endsWith(".gif")) {
    await delay(500 + Math.random() * 500);
  }

  // Обработка ошибки 404 и неполного пути (как на Github Pages)
  const cleanUrl = req.originalUrl.split("?")[0];
  const filePath = path.resolve(__dirname, `..${cleanUrl}`);
  if (!fs.existsSync(filePath)) {
    // Если файл не найден, проверяем наличие файла с расширением .html
    const filePathWithExt = path.resolve(__dirname, `..${cleanUrl}.html`);
    if (fs.existsSync(filePathWithExt)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      return fs.createReadStream(filePathWithExt).pipe(res);
    }
    // Обработка 404 ошибки
    const notFoundPath = path.resolve(__dirname, "../404.html");
    res.writeHead(404, { "Content-Type": "text/html" });
    return fs.createReadStream(notFoundPath).pipe(res);
  }

  next();
};
