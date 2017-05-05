# Egghead.io downloader

This is a small node.js command line tool that can download series, playlists and lessons from [egghead.io](https://egghead.io/) as .mp4 for you.

Currently it requires node >= v.6.0.0. If there is any need to support lower versions,
please create an issue on Github.

To get started, just run

- `npm install -g ehd`

Then you can use it from the command line

`$ ehd -c https://egghead.io/series/getting-started-with-redux really-awesome-series`

    Usage: ehd [options] <url> <output-dir>

    Options:

      -h, --help                 output usage information
      -V, --version              output the version number
      -e, --email <email>        Account email (only required for Pro accounts)
      -p, --password [password]  Account password (only required for Pro accounts)
      -c, --count                Add the number of the video to the filename (only for playlists and series)
      -f, --force                Overwriting existing files


### Development
Since this tool is written in ES6/ES7 (it uses [await/async from the ES7 draft](https://tc39.github.io/ecmascript-asyncawait/)), you need to run `npm run build` if you edit the source (this runs babel, which transpiles it to code that node can understand). Or you can run it directly with babel-node: `$ babel-node src/app.js --help`

### Notes
Since this tool depends on the page structure of egghead.io, it is very likely to stop working at some point ;)

License: MIT
