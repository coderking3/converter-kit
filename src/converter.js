import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

/**
 * Converter Kit - 单文件与 TXT 互转工具
 * 
 * 用法:
 *   converter file.jpg --out output.txt
 *   converter archive.txt --out file.jpg
 */

// 解析参数
const { positionals, values } = parseArgs({
  options: {
    out: {
      type: 'string',
      short: 'o',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
    version: {
      type: 'boolean',
      short: 'v',
    },
  },
  allowPositionals: true,
})

// 显示帮助
if (values.help) {
  console.log(`
Converter Kit - 文件与 TXT 互转工具

用法:
  converter <file> [--out <output>]

示例:
  converter photo.jpg --out archive.txt    # 文件 → TXT
  converter archive.txt --out photo.jpg    # TXT → 文件
  converter photo.jpg                      # 自动生成 photo.txt
  converter archive.txt                    # 自动还原原文件名

选项:
  -o, --out <path>    指定输出路径
  -h, --help          显示帮助信息
  -v, --version       显示版本信息
`)
  process.exit(0)
}

// 显示版本
if (values.version) {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  )
  console.log(packageJson.version)
  process.exit(0)
}

// 检查参数
if (positionals.length === 0) {
  console.error('❌ 请指定输入文件')
  console.error('   使用 converter --help 查看帮助')
  process.exit(1)
}

const inputPath = positionals[0]
const userOutputPath = values.out || null

/**
 * 单个文件 → TXT
 */
function fileToTxt(filePath, outputPath) {
  const absolutePath = path.resolve(filePath)
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ 文件不存在: ${filePath}`)
    process.exit(1)
  }

  const stat = fs.statSync(absolutePath)
  if (stat.isDirectory()) {
    console.error(`❌ 不支持文件夹，请指定单个文件`)
    process.exit(1)
  }

  const buffer = fs.readFileSync(absolutePath)
  const base64 = buffer.toString('base64')
  const fileName = path.basename(absolutePath)
  const fileExt = path.extname(absolutePath)

  const archiveData = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    file: {
      name: fileName,
      extension: fileExt,
      size: buffer.length,
      base64: base64,
    },
  }

  const jsonString = JSON.stringify(archiveData, null, 2)
  fs.writeFileSync(outputPath, jsonString, 'utf-8')

  console.log(`✅ 文件 → TXT 转换完成!`)
  console.log(`   原文件: ${fileName} (${formatBytes(buffer.length)})`)
  console.log(`   输出: ${outputPath}`)
}

/**
 * TXT → 还原文件
 */
function txtToFile(txtPath, outputPath) {
  const content = fs.readFileSync(txtPath, 'utf-8')
  
  let archiveData
  try {
    archiveData = JSON.parse(content)
  } catch (err) {
    console.error('❌ 无法解析归档文件，请确保是有效的 JSON 格式')
    process.exit(1)
  }

  if (!archiveData.file || !archiveData.file.base64) {
    console.error('❌ 归档文件格式错误')
    process.exit(1)
  }

  const file = archiveData.file
  
  if (!outputPath) {
    outputPath = file.name
  }

  const buffer = Buffer.from(file.base64, 'base64')
  fs.writeFileSync(outputPath, buffer)

  console.log(`✅ TXT → 文件 还原完成!`)
  console.log(`   文件名: ${file.name} (${formatBytes(file.size)})`)
  console.log(`   输出: ${outputPath}`)
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 主逻辑
try {
  const absoluteInput = path.resolve(inputPath)
  
  if (!fs.existsSync(absoluteInput)) {
    console.error(`❌ 文件不存在: ${inputPath}`)
    process.exit(1)
  }

  const ext = path.extname(absoluteInput).toLowerCase()

  if (ext === '.txt' || ext === '.json') {
    const outputPath = userOutputPath ? path.resolve(userOutputPath) : null
    txtToFile(absoluteInput, outputPath)
  } else {
    const defaultOutput = absoluteInput.replace(path.extname(absoluteInput), '.txt')
    const outputPath = userOutputPath
      ? path.resolve(userOutputPath)
      : defaultOutput

    fileToTxt(absoluteInput, outputPath)
  }
} catch (err) {
  console.error('❌ 转换失败:', err.message)
  process.exit(1)
}
