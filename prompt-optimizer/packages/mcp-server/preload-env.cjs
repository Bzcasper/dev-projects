/** @format */

// 预加载环境变量脚本 (CommonJS版本)
// 这个脚本会在 Node.js 启动时通过 -r 参数预加载
// 确保环境变量在任何模块导入之前就被加载到 process.env 中

const { config } = require("dotenv");
const { resolve } = require("path");

const paths = [
  // Single unified .env file in project root
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
  resolve(__dirname, "../.env"),
  resolve(__dirname, "../../.env"),
];

// 静默加载环境变量
paths.forEach((path) => {
  try {
    config({ path });
  } catch (error) {
    // 忽略文件不存在的错误
  }
});

console.log("Environment variables loaded for MCP server (CommonJS)");
