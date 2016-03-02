'use strict'

const autoprefixer = require('autoprefixer')
const babel = require('babelify')
const browserify = require('browserify')
const del = require('del')
const es = require('event-stream')
const flatten = require('gulp-flatten')
const ghPages = require('gulp-gh-pages')
const glob = require('glob')
const gls = require('gulp-live-server')
const gulp = require('gulp')
const jade = require('gulp-jade')
const postcss = require('gulp-postcss')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const source = require('vinyl-source-stream')

const SRC_DIR = __dirname + '/src/'
const CSS_DIR = __dirname + '/src/stylesheets'
const JS_DIR = __dirname + '/src/scripts'

gulp.task('stylesheets', function () {
  let processors = [
    autoprefixer({browsers: ['last 4 version']})
  ]

  del.sync('./.build/stylesheets')

  return gulp.src(CSS_DIR + '/builder.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(rename('styles.css'))
    .pipe(gulp.dest('./.build/stylesheets/'))
})

gulp.task('scripts', (done) => {
  glob(JS_DIR + '/*.js', (err, files) => {
    if(err) done(err)

    del.sync('./.build/scripts')

    var tasks = files.map((entry) => {
      return browserify({
        entries: [entry],
        debug: true,
        })
        .transform(babel.configure({
          presets: ["es2015"]
        }))
        .bundle()
        .on('error', (e) => {
          console.error(e.stack)
          done();
        })
        .pipe(source(entry))
        .pipe(rename({
          extname: '.bundle.js'
        }))
        .pipe(flatten())
        .pipe(gulp.dest('./.build/scripts/'))
      })
    es.merge(tasks)
      .on('error', done)
      .on('end', done)
  })
})

gulp.task('assets', (done) => {
  del.sync('./.build/assets')
  return gulp.src(SRC_DIR + 'assets/**/*')
    .pipe(gulp.dest('./.build/'))
})

gulp.task('extras', (done) => {
  del.sync('./.build/extras')

  return gulp.src(SRC_DIR + 'extras/*')
    .pipe(flatten())
    .pipe(gulp.dest('./.build/'))
})

gulp.task('views', () => {
  del.sync('./.build/*.html')
  return gulp.src('./src/views/*.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('./.build/'))
})

gulp.task('build', ['stylesheets', 'views', 'scripts', 'extras', 'assets'])

gulp.task('dev', ['build'], () => {
  let server = gls.static(['.build/','./src/assets/'], 3000)
  server.start()

  gulp.watch(JS_DIR + '/**/*.js', ['scripts'])
  gulp.watch(CSS_DIR + '/**/*.scss', ['stylesheets'])
  gulp.watch('./src/views/*.jade', ['views'])

  gulp.watch(['./.build/**/*.html', './.build/**/*.js', './.build/**/*.css'],  (file) => {
    server.notify.apply(server, [file])
  })

  gulp.watch(['!gulpfile.js'],  (file) => {
    server.notify.apply(server, [file])
  })

  gulp.watch('*.html',  (file) => {
    server.notify.apply(server, [file])
  })
})

gulp.task('deploy', ['build'], function() {
  return gulp.src('./.build/**/*')
   .pipe(ghPages())
})