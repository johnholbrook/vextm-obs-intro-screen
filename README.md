# vextm-obs-intro-screen
Alternate "Match Intro" screen for VEX Tournament Manager.

https://user-images.githubusercontent.com/3682581/194567886-0c53670f-0e5d-4d73-ab31-4e06dcb64c54.mp4

Features:
* Shows information which isn't included in TM's overlay intro screen, such as team names and locations.
* Supports VRC, VEX U, VIQC, and ADC events.
* Can optionally show event scouting data for each team, such as AWP rate, autonomous win rate, average/highest match scores, etc. (specific stats vary by program).
* For VRC events only, can optionally show predicted match outcomes from [vrc-data-analysis.com](http://vrc-data-analysis.com).

## Installation
Download the latest version from the [releases page](https://github.com/johnholbrook/vextm-obs-intro-screen/releases) and unzip it somewhere. Run `VEX TM Intro Screen.exe`.

_Note_: Although I have had success running OBS on the same computer as the TM server, the docs for the TM OBS plugin strongly recommend against that configuration. If you're running OBS on a separate machine from the TM server, this software could run on either machine (or, for that matter, any other machine on the same local network). The instructions below will assume this software is running on the same machine as OBS.

## Usage

Run `VEX TM Intro Screen.exe`. 

![Screenshot 2022-11-18 094336](https://user-images.githubusercontent.com/3682581/202731351-6fff6c0e-a178-4841-a5cb-5c46e75d87e0.png)

Enter the TM server address and password.

"Display server port" specifies the port on which the display will be served as a webpage. If something else is already using port 8080 on your system, a different port can be specified.

"Division" and "Field Set ID" can be left at their default values unless your event has multiple divisions/field sets (this is not the case for most events).

If "Show match prediction" is checked, the display will show a win probability for each alliance as calculated by vrc-data-analysis.com. This option is only applicable to VRC events.

"Omit country from team location" will hide a team's country iff their location also contains a region within the country (e.g. state or province). For example, with this option checked a team's location would display as "Huntington, West Virginia" rather than "Huntington, West Virginia, United States".

"Show team scouting data" will hide the team scouting data in the middle of the display if unchecked.

After configuring the display as desired, click "Start". The output of the display server will be shown in the box. The options can't be modified while the display is running, so in order to make any changes you'll need to click "Stop", make some change, and then click "Start".

Once the display server is running, the display will be available as a webpage. In OBS, add a "Browser Source", set the URL to `http://localhost:8080` (or a different port if you specified one), and set the dimensions of the browser source to the dimensions of your stream (usually 1920x1080). After configuring the browser source, you may need to queue a match in TM before the display shows the correct information.
 
The display is intended to be shown over top of the normal "match timer" overlay – it will disappear when a match is started and reappear when the next match is queued.

 
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
