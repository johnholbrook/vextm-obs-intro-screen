# vextm-obs-intro-screen
Alternate "Match Intro" screen for VEX Tournament Manager. Shows information which isn't included in TM's overlay intro screen, such as team names and locations.

For VRC events, can optionally show predictecd match outcomes from http://vrc-data-analysis.com.
 
 ## Installation
 Download the latest version from the [releases page](https://github.com/johnholbrook/vextm-obs-intro-screen/releases) and unzip it somewhere. Run `VEX TM Intro Screen.exe`.
 
 ### Building locally
To build the project locally, you'll need to have Node/NPM installed, as well as [pkg](https://www.npmjs.com/package/pkg). Install dependencies with `npm install`.
 
As currently written, the GUI will only work on Windows, but the display server (at `src/display/main.js`) should work on any platform.

To build just the display server, run `npm run build-display`. To build just the GUI, run `npm run build-gui` (note that the display server must be built first). To build both, `npm run build`.

To run the GUI app without building it, `npm run start` (but the display server will still need to be built first).
 
 ## Usage
 Enter the TM server address and password, then click "Start". The output of the display serevr will be shown in the box:
 
 ![image](https://user-images.githubusercontent.com/3682581/146073319-54f830bf-0f85-4f2e-b11d-33aaecccf2e1.png)

If something else is already using port 8080 on your system, a different port can be specified. "Division" should be left at the default value of `division1` unless your event has multiple divisions.
 
The display will then be available as a web page on `http://localhost:8080` (or whatever port is specified).
The display is intended to be shown as a browser source in OBS, over top of the normal "match timer" overlay – 
it will disappear when a match is started and reappear when the next match is queued.
 
 
The display server can also be run from the command line, either the compiled binary `display.exe` that ships with the release, or in the source repo at `src/display/main.js`.
 ```
 node main.js -a TMServerAddress -p TMAdminPassword
 ```
 
 Other options (see these with the `-h` flag):
 ```
 Options:
  -h, --help                         Display this help message and exit[boolean]
      --version                      Show version number               [boolean]
  -a, --address                      VEX TM Server Address
                                                 [string] [default: "localhost"]
  -p, --password                     VEX TM Admin Password              [string]
  -g, --show-predictions, --predict  Show match predictions (VRC only) [boolean]
  -P, --port                         Port to serve display on
                                                        [number] [default: 8080]
  -d, --division-name                Division name (as used in TM web interface
                                     URLs – only set this option at
                                     multi-division events)
                                                 [string] [default: "division1"]
```
