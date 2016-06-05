#! /usr/bin/env node
const program = require('commander')
const chalk = require('chalk')
const rp = require('request-promise')
const request = require('request')
const PleasantProgress = require('pleasant-progress')
const path = require('path')
const fs = require('fs')

let urlValue
let outputDir
const progress = new PleasantProgress()

program
  .version('0.0.1')
  .arguments('<url> <output-dir>')
  .option('-c, --count', 'Add the number of the video to the filename (only for playlists and series)')
  .option('-f, --force', 'Overwriting existing files')
  .action((url, output) => {
    urlValue = url
    outputDir = path.resolve(output)
  })
program.parse(process.argv)

if (process.argv.slice(2).length < 2) {
  program.outputHelp()
  process.exit()
}

if (!/egghead.io\/(lessons|series|playlists)\//.test(urlValue)) {
  error('unsupported url!')
}

// await is only supported in functions (with the async keyword)
doTheMagic()

function fileExists(p){
  try {
    return fs.statSync(p).isFile();
  } catch (e){
    return false;
  }
};

async function doTheMagic () {
  const videos = await getVideoData()
  if (!videos.length) {
    error('no video found!')
  }
  success(`Found ${videos.length} ${(videos.length) > 1 ? 'videos' : 'video'}`)

  createOutputDirectoryIfNeeded()

  let i = 0
  for (const {url, filename} of videos) {
    i++;
    const p = path.join(outputDir, (program.count ? `${i}-${filename}` : filename))
    if (!program.force && fileExists(p)) {
      console.log(`File ${i}-${filename} already exists, skip`);
      continue;
    }
    progress.start(`Downloading video ${i} out of ${videos.length}: '${filename}'`)
    const stream = fs.createWriteStream(p)
    await new Promise((resolve, reject) => {
      request(url)
        .on('error', () => {
          error(`download of '${url}' failed!`, false)
          reject()
        })
        .on('end', () => {
          resolve()
        })
        .pipe(stream)
    })
    stream.close()
    progress.stop(true)
  }
  success('Done!')
}

// loads the url and parses it, when it's playlist/serie loads the video pages
// too, and returns an array with the video data
async function getVideoData () {
  try {
    const isLesson = /egghead.io\/lessons\//.test(urlValue)
    let source = await rp(urlValue)

    if (isLesson) {
      success('The URL is a lession')
      // process the lesson page
      const videoData = parseLessonPage(source)
      if (videoData) {
        return [videoData]
      } else {
        error(`failed to parse the lesson page '${urlValue}'}`)
      }
    } else {
      let lessonURLs = []
      success('The URL is a playlist or series')

      // get the urls of the lessions
      const re = /<h4 class="title"><a href="(https:\/\/egghead.io\/lessons\/.+?)">/g
      // regexp in js have no matchAll method or something similiar..
      let match
      while ((match = re.exec(source))) {
        lessonURLs.push(match[1])
      }
      success(`Found ${lessonURLs.length} ${(lessonURLs.length) > 1 ? 'lessons' : 'lesson'}`)
      progress.start('Fetching lesson pages')
      // fetch and process the lessons, start all requests at the same time to save time.
      const promises = lessonURLs.map(processLessonURL)
      const result = await Promise.all(promises.map(reflect))
      progress.stop(true)
      // get the urls that succeded and thos that failed
      const videoURLs = result.filter(v => (v.state === 'resolved')).map(v => v.value)
      const failed = result.filter(v => (v.state === 'rejected'))
      // check if we have some lesson pages that failed (wrong url or paid)
      if (failed.length) {
        error(`Failed to parse the following lesson pages: ${failed.map(v => `'${v.value}'`).join(',')}. They might be for pro subscribers only`, false)
      }
      return videoURLs
    }
  } catch (e) {
    error(`fetching the url '${urlValue}' failed!`)
  }
}

// fetches the lesson page and calls parseLessonPage on it
function processLessonURL (url) {
  return new Promise(async (resolve, reject) => {
    rp(url).then((source) => {
      const videoData = parseLessonPage(source)
      if (videoData) {
        resolve(videoData)
      } else {
        reject(url)
      }
    }, () => {
      reject(url)
    })
  })
}

// parses the lesson page, returns the video data if found.
function parseLessonPage (source) {
  const re = /<meta itemprop="name" content="([^"]+?)".+?<meta itemprop="contentURL" content="http[^"]+?.wistia.com\/deliveries\/(.+?)\.bin"/
  const result = re.exec(source)
  if (result) {
    return {
      filename: result[1],
      url: `https://embed-ssl.wistia.com/deliveries/${result[2]}/file.mp4`
    }
  }
}

// creates a directory
function createOutputDirectoryIfNeeded () {
  try {
    const stats = fs.lstatSync(outputDir)
    if (!stats.isDirectory()) {
      error(`Can't create the output directory '${outputDir}' because a file with the same name exists`)
    }
  } catch (e) {
    try {
      fs.mkdirSync(outputDir)
    } catch (err) {
      error(`Creating the output directory '${outputDir}' failed with error '${err}'`)
    }
  }
}

// helper functions
function success (message) {
  console.log(chalk.green(message))
}

function error (message, exit = true) {
  console.log(chalk.red(`Error: ${message}`))
  if (exit) {
    process.exit(1)
  }
}

// wraps a promise in another promise that resolves when the promise either resolves or rejects
function reflect (promise) {
  return promise.then(x => ({state: 'resolved', value: x}),
    e => ({state: 'rejected', value: e}))
}
