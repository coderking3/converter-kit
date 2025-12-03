# @king-3/converter-kit

文件与 TXT 互转工具，支持将任意文件转换为 Base64 编码的 TXT 文件并可还原。

## 安装

```bash
npm install -g @king-3/converter-kit
```

## 使用

### 基础命令

```bash
# 文件转 TXT（自动命名）
converter photo.jpg
# 输出: photo.txt

# 文件转 TXT（指定输出）
converter document.pdf --out archive.txt

# TXT 还原文件（自动使用原文件名）
converter archive.txt
# 输出: photo.jpg

# TXT 还原文件（指定输出）
converter archive.txt --out restored.jpg
```

### 命令选项

```bash
-o, --out <path>    指定输出路径
-h, --help          显示帮助信息
-v, --version       显示版本号
```

## 使用场景

- **文件备份**: 将文件转为文本格式便于传输和存储
- **版本控制**: 文本格式更适合 Git 等版本控制工具
- **跨平台共享**: 在受限环境中传输文件
- **内容嵌入**: 将文件内容嵌入到配置或代码中

## 工作原理

**文件 → TXT**

1. 读取文件二进制数据
2. 编码为 Base64 字符串
3. 保存元数据（文件名、扩展名、大小等）
4. 以 JSON 格式写入 TXT

**TXT → 文件**

1. 读取 TXT 并解析 JSON
2. 解码 Base64 数据
3. 还原为原始文件

生成的 TXT 格式示例：

```json
{
  "version": "1.2.0",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "file": {
    "name": "photo.jpg",
    "extension": ".jpg",
    "size": 102400,
    "base64": "iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

## 注意事项

- 转换后的 TXT 文件会比原文件大约 33%（Base64 编码特性）
- 支持任意类型文件：图片、文档、压缩包、视频等
- 还原后的文件与原文件完全一致，无数据损失

## License

[MIT](./LICENSE) License © 2025-PRESENT [king3](https://github.com/coderking3)
