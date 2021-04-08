#!/usr/bin/env node

// console.log(process.argv) // 可以拿到在命令行里传递的参数： 1.node 路径   2. 当前文件的路径  3.是传递过来的参数 4.传递过来的参数

process.argv.push('--cwd')
process.argv.push(process.cwd()) // 当前命令行所在的目录
process.argv.push('--gulpfile')
process.argv.push(require.resolve('../lib/index.js')) // require 载入这个模块，resolve 找到这个模块所对应的路径

console.log(process.argv) // 可以拿到在命令行里传递的参数： 1.node 路径   2. 当前文件的路径  3.是传递过来的参数 4.传递过来的参数

require('gulp/bin/gulp') // 自动去载入 node_modules 里的 gulp-cli
