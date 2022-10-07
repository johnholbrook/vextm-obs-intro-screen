# vextm-obs-intro-screen
Alternate "Match Intro" screen for VEX Tournament Manager.

https://user-images.githubusercontent.com/3682581/194567886-0c53670f-0e5d-4d73-ab31-4e06dcb64c54.mp4

Features:
* Shows information which isn't included in TM's overlay intro screen, such as team names and locations.
* Supports VRC, VEX U, VIQC, and RADC events.
* Can optionally show season-long team stats, such as AWP rate, season W-L-T record, average/highest match scores, etc. (specific stats vary by program). Team stats are sourced from the RobotEvents API and updated at regular intervals.
* For VRC events only, can optionally show predicted match outcomes from [vrc-data-analysis.com](http://vrc-data-analysis.com).

## Installation
Download the latest version from the [releases page](https://github.com/johnholbrook/vextm-obs-intro-screen/releases) and unzip it somewhere. Run `VEX TM Intro Screen.exe`.
 
## Usage
Enter the TM server address and password, then click "Start". The output of the display server will be shown in the box:
 
![image](https://user-images.githubusercontent.com/3682581/152690429-21b1bcb9-6041-4fe1-9148-e6ae988fedcc.png)

If something else is already using port 8080 on your system, a different port can be specified. "Division" should be left at the default value of `division1` unless your event has multiple divisions.
 
The display will then be available as a web page on `http://localhost:8080` (or whatever port is specified).
The display is intended to be shown as a browser source in OBS, over top of the normal "match timer" overlay – 
it will disappear when a match is started and reappear when the next match is queued.
 
### Building locally
To build the project locally, you'll need to have Node/NPM installed, as well as [pkg](https://www.npmjs.com/package/pkg). Install dependencies with `npm install`.
 
As currently written, the GUI will only work on Windows, but the display server (at `src/display/main.js`) should work on any platform.

To build just the display server, run `npm run build-display`. To build just the GUI, run `npm run build-gui` (note that the display server must be built first). To build both, `npm run build`.

To run the GUI app without building it, `npm run start` (but the display server will still need to be built first).

### Command-line usage

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
                                     URLs - only set this option at
                                     multi-division events)
                                                 [string] [default: "division1"]
  -f, --field-set                    ID of the field set to connect to (only set
                                                           [number] [default: 1]
  -o, --omit-country                 Omit country from team location if there is
                                     also a state/province
                                                      [boolean] [default: false]
  -s, --show-stats                   Show additional scouting stats
                                                      [boolean] [default: false]
```
