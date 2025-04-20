const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const path = require("path");
const fs = require("fs");

module.exports = async function (req, res, next) {
  // Имитация реальной загрузки изображений
  await delay(50 + Math.random() * 200);
  if (req.originalUrl.endsWith(".gif")) await delay(500 + Math.random() * 500);

  // Обработка ошибки 404
  const filePath = path.resolve(__dirname, `..${req.originalUrl}`);
  console.log(`filePath: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    const notFoundPath = path.resolve(__dirname, "../404.html");
    res.writeHead(404, { "Content-Type": "text/html" });
    return fs.createReadStream(notFoundPath).pipe(res);
  }

  next();
};
