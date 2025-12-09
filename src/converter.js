/* eslint-disable no-console */
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'

/**
 * Converter Kit - 单文件与 TXT 互转工具
 *
 * 用法:
 *   converter file.jpg --out output.txt
 *   converter archive.txt --out file.jpg
 */

const VERSION = '1.3.5'
const CONVERTER_EXT = '.txt'

// 解析参数
const { positionals, values } = parseArgs({
  options: {
    out: {
      type: 'string',
      short: 'o'
    },
    help: {
      type: 'boolean',
      short: 'h'
    },
    version: {
      type: 'boolean',
      short: 'v'
    }
  },
  allowPositionals: true
})

// 显示帮助
if (values.help) {
  console.log(`
Converter Kit - 文件与 TXT 互转工具

用法:
  converter <file> [--out <o>]

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
  console.log(`v${VERSION}`)
  process.exit(0)
}

// 检查参数
if (positionals.length === 0) {
  console.error('❌ 请指定输入文件')
  console.error('   使用 converter --help 查看帮助')
  process.exit(1)
}

const userInputPath = positionals[0]
const userOutputPath = values.out || null

/**
 * 确保目录存在，不存在则创建
 */
function ensureDirectoryExists(dirname) {
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
    console.log(`📁 已创建目录: ${dirname}`)
  }
}

// 获取当前UTC+8时间
function nowUTC8({ utcSuffix = false } = {}) {
  const date = new Date()
  const UTC8Time = new Date(date.getTime() + 8 * 60 * 60 * 1000)

  const padStart = (num) => num.toString().padStart(2, '0')

  const year = UTC8Time.getUTCFullYear()
  const month = padStart(UTC8Time.getUTCMonth() + 1)
  const day = padStart(UTC8Time.getUTCDate())
  const hours = padStart(UTC8Time.getUTCHours())
  const minutes = padStart(UTC8Time.getUTCMinutes())
  const seconds = padStart(UTC8Time.getUTCSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${
    utcSuffix ? ' UTC+8' : ''
  }`
}

/**
 * 单个文件 → TXT
 */
function fileToTxt(filePath, outputDir, outputFileName = null) {
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
    version: VERSION,
    createdAt: nowUTC8(),
    file: {
      name: fileName,
      extension: fileExt,
      size: buffer.length,
      base64
    }
  }

  const jsonString = JSON.stringify(archiveData, null, 2)

  const finalFileName =
    outputFileName || path.basename(absolutePath, fileExt) + CONVERTER_EXT
  const finalOutputPath = path.join(outputDir, finalFileName)

  // 确保输出目录存在
  ensureDirectoryExists(outputDir)
  fs.writeFileSync(finalOutputPath, jsonString, 'utf-8')

  console.log(`✅ 文件 → TXT 转换完成!`)
  console.log(`   原文件: ${fileName} (${formatBytes(buffer.length)})`)
  console.log(`   输出: ${finalOutputPath}`)
}

/**
 * TXT → 还原文件
 */
function txtToFile(txtPath, outputDir, outputFileName = null) {
  const content = fs.readFileSync(txtPath, 'utf-8')

  let archiveData
  try {
    archiveData = JSON.parse(content)
  } catch {
    console.error('❌ 无法解析归档文件，请确保是有效的 JSON 格式')
    process.exit(1)
  }

  if (!archiveData.file || !archiveData.file.base64) {
    console.error('❌ 归档文件格式错误')
    process.exit(1)
  }

  const file = archiveData.file
  const buffer = Buffer.from(file.base64, 'base64')

  // 如果没有指定输出文件名，使用归档中的原始文件名
  const finalFileName = outputFileName || file.name
  const finalOutputPath = path.join(outputDir, finalFileName)

  // 确保输出目录存在
  ensureDirectoryExists(outputDir)
  fs.writeFileSync(finalOutputPath, buffer)

  console.log(`✅ TXT → 文件 还原完成!`)
  console.log(`   文件名: ${file.name} (${formatBytes(file.size)})`)
  console.log(`   输出: ${finalOutputPath}`)
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}

// 主逻辑
function converter() {
  try {
    const inputPath = path.resolve(userInputPath)

    if (!fs.existsSync(inputPath)) {
      console.error(`❌ 文件不存在: ${userInputPath}`)
      process.exit(1)
    }

    const inputDir = path.dirname(inputPath)
    const ext = path.extname(inputPath).toLowerCase()

    // TXT → 还原文件
    if (ext === CONVERTER_EXT) {
      let outputDir, outputFileName

      if (userOutputPath) {
        const resolvedOutput = path.resolve(userOutputPath)
        outputDir = path.dirname(resolvedOutput)
        outputFileName = path.basename(resolvedOutput)
      } else {
        outputDir = inputDir
        outputFileName = null
      }

      txtToFile(inputPath, outputDir, outputFileName)
    }
    // 文件 → TXT
    else {
      let outputDir, outputFileName

      if (userOutputPath) {
        const resolvedOutput = path.resolve(userOutputPath)
        outputDir = path.dirname(resolvedOutput)
        outputFileName = path.basename(resolvedOutput)
      } else {
        outputDir = inputDir
        outputFileName = path.basename(inputPath, ext) + CONVERTER_EXT
      }

      fileToTxt(inputPath, outputDir, outputFileName)
    }
  } catch (err) {
    console.error('❌ 转换失败:', err.message)
    process.exit(1)
  }
}
converter()
