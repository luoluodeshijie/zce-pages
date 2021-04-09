const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins') // 导出的是一个方法
const plugins = loadPlugins() // plugins 是一个对象, 所有的插件都会挂在这个对象上
const bs = browserSync.create() // 自动创建一个开发服务器
const cwd = process.cwd()

let config = {
    // default config
    build: {
        src: 'src',
        dist: 'dist',
        temp: 'temp',
        public: 'public',
        paths: {
            styles: 'assets/styles/*.scss',
            scripts: 'assets/scripts/*.js',
            pages: '*.html',
            images: 'assets/images/**',
            fonts: 'assets/fonts/**'
        }
    }
}

try {
    const loadConfig = require(`${cwd}/pages.config.js`)
    config = Object.assign({}, config, loadConfig)
} catch (e) {}

const clean = () => {
    return del([config.build.dist, config.build.temp]) // 清除文件的方法，返回一个 promise 任务
}

const style = () => {
    return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src }) // 读取流 , base 基准路径，保留 src/assets/style/*.scss 目录结构，第二个参数 cwd 是从哪个地方开始找，从当前项目下的 src
        .pipe(plugins.sass({ outputStyle: 'expanded' })) // 添加配置 outputStyle: 'expanded' 样式展开配置
        .pipe(dest(config.build.temp)) // 写入流
        .pipe(bs.reload({ stream: true })) // 不使用 files 热更新，每次页面构建完成刷新页面，达到同样效果； reload 内部以流 stream 信息的方式推到浏览器
}

const script = () => {
    return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src }) // 读取流 , base 基准路径，保留 src/assets/scripts/*.js 目录结构，第二个参数 cwd 是从哪个地方开始找，从当前项目下的 src
        .pipe(plugins.babel({ presets: [require('@babel/preset-env')] })) // 添加 preset 配置
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true })) // 不使用 files 热更新，每次页面构建完成刷新页面，达到同样效果； reload 内部以流 stream 信息的方式推到浏览器
}

const page = () => {
    // src/*.html 如果有子目录下的 html 文件，‘src/**/*.html’  ** 代表子目录的通配符方式
    return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src }) // 读取流 , base 基准路径，保留 src/*.html 目录结构，第二个参数 cwd 是从哪个地方开始找，从当前项目下的 src
        .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // 配置数据 data, 防止 swig 模板引擎缓存机制导致页面不会变化，设置选项 cache 设置为 false
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true })) // 不使用 files 热更新，每次页面构建完成刷新页面，达到同样效果； reload 内部以流 stream 信息的方式推到浏览器
}

const image = () => {
    return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src }) // 读取流 , base 基准路径，保留 src/assets/scripts/** 目录结构，第二个参数 cwd 是从哪个地方开始找，从当前项目下的 src
        .pipe(plugins.imagemin()) // 无损压缩图片
        .pipe(dest(config.build.dist))
}

const font = () => {
    return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src }) // 读取流 , base 基准路径，保留 src/assets/fonts/** 目录结构，第二个参数 cwd 是从哪个地方开始找，从当前项目下的 src
        .pipe(plugins.imagemin()) // imagemin 同样可以无损压缩字体文件
        .pipe(dest(config.build.dist))
}

const extra = () => {
    return src('**', { base: config.build.public, cwd: config.build.public }) // 读取流 , base 基准路径，保留 public/** 目录结构，第二个参数 cwd 是从哪个地方开始找，从当前项目下的 public
        .pipe(dest(config.build.dist))
}

const serve = () => {
    // watch 会自动监视文件路径的通配符，根据文件的变化，决定是否执行一些任务
    watch(config.build.paths.styles, { cwd: config.build.src }, style)
    watch(config.build.paths.scripts, { cwd: config.build.src }, script)
    watch(config.build.paths.pages, { cwd: config.build.src }, page)
        // watch('src/assets/images/**', image) // image/font/extra 其他页面这些文件在开发阶段没有构建的必要，只需要在发布上线前构建就可以了
        // watch('src/assets/fonts/**', font)
        // watch('public/**', extra)
    watch([
            config.build.paths.images,
            config.build.paths.fonts
        ], { cwd: config.build.src }, bs.reload) // 监视 image/font/extra 其他页面文件是否发生变化，调用 reload 重新加载浏览器，浏览器重新发起请求，而不是进行构建任务
    watch('**', { cwd: config.build.public }, bs.reload)

    // init() 方法初始化 web 服务器的相关配置，核心的配置 server
    bs.init({
        notify: false, // 关掉浏览器右上角 gulp 提示
        port: 2080, // 修改端口
        // open: false, // 取消默认自动打开浏览器
        // files: 'dist/**', // browser-sync 监听 dist 下的文件发生改变后的热更新；另一种方式利用 reload 更新，不使用 files
        server: {
            baseDir: [config.build.temp, config.build.dist, config.build.public], // 设置网站的根目录，支持一个数组，先从第一个目录找，依次往后找
            routes: { // 配置路由 /node_modules  优先于 baseDir 配置执行
                '/node_modules': 'node_modules'
            }
        }
    })
}

const useref = () => {
    return src(config.build.paths.pages, { base: config.build.temp }) // 读取 dist 下面的一些 html 文件
        .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] })) // 创建转化流，从 dist/.  这两个目录下的文件经过构建形成构建注释，useref 会根据构建注释找到引用关系，去掉构建注释，合并依赖文件到一个文件
        //  html  js  css  压缩
        .pipe(plugins.if(/\.js$/, plugins.uglify())) // if 自动创建转换流，根据条件判断是否执行具体的转换流
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true,
            minifyCss: true,
            minifyJS: true
        }))) // htmlmin() 默认不折叠换行， collapseWhitespace 属性会折叠 html 所有的空白、换行字符；minifyCss 属性会压缩在 html 页面中 style 的样式；minifyJS 属性会压缩在 html 页面中 script 的 js 代码
        .pipe(dest(config.build.dist)) // 写入 dist 目录中
}

const compile = parallel(style, script, page) // 组合任务，并行执行任务

// 上线之前执行的任务
const build = series(
        clean,
        parallel(
            series(compile, useref),
            image,
            font,
            extra
        )
    ) // build 组合任务， series 串行任务先去执行 clean 任务，再去执行 parallel 并行任务， parallel 并行任务中有一个 series 串行任务 (compile, useref)，和其他三个并行任务 image, font, extra

// 开发执行的任务
const develop = series(compile, serve) // 组合任务，先去执行 compile ，再执行 serve

module.exports = {
    clean,
    build,
    develop
}

// 开发阶段写的代码放在 src 下面，构建的代码放到 dist 目录。现在真正上线的是 release 目录下，但是 release 目录下并没有需要的图片、字体等文件。
// useref 之前生成的文件属于中间产物，比如 style/script/page 这些任务都应该放到一个临时文件里。useref 任务应该从临时目录里拿到到这些文件再打包
// build 组合任务， series 串行任务先去执行 clean 任务，再去执行 parallel 并行任务， parallel 并行任务中有一个 series 串行任务 (compile, useref)，和其他三个并行任务 image, font, extra

// gulp-cli 自动化构建命令并不用导出那么多，因为像 style, script, page, image, icon, extra 等这些命令都已经放在 compile, build， develop 这些命令当中了， compile, serve 也在 develop 任务中，只需要导出 clean, build, develop 这三个就可以了。
// 在 package.json 文件中，添加 script 脚本命令 "clean": "gulp clean", "build": "gulp build", "develop": "gulp develop"。直接运行 `yarn clean`、`yarn build`、 `yarn develop` 这三个命令就可以了
// 在 .gitignore 中要忽略 dist 和 temp 这两个目录。