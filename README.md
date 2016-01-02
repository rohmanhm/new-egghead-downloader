# Egghead.io downloader

This is a small node.js command line tool that can download series, playlists and lessons from [egghead.io](https://egghead.io/) as .mp4 for you.

To get started clone this repo, then:

- `npm install`
- `npm run build`
- `npm link`

Then you can use it from the command line

`$ egghead-downloader -c https://egghead.io/series/getting-started-with-redux realy-awesome-series`

    Usage: egghead-downloader [options] <url> <output-dir>

    Options:

      -h, --help     output usage information
      -V, --version  output the version number
      -c, --count    Add the number of the video to the filename (only for playlists and series)


Instead of linking you could also run the app.js directly from the `dist` folder:
`$ ./dist/index.js -c https://egghead.io/series/getting-started-with-redux realy-awesome-series`

### Development
Since this tool is written in ES6/ES7 (uses await awesomeness from the ES7 draft), you need to run `npm run build` if you edit it (this updates dist/app). Or you can run it directly with babel-node: `$ babel-node index.js --help`

### Notes
Since this tool depends on the page structure of egghead.io, it is very likely to stop working at some point ;)

License: MIT
