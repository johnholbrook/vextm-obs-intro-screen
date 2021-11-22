# vextm-obs-intro-screen
Alternate "Match Intro" screen for VEX Tournament Manager. Shows information which isn't included in TM's overlay intro screen, such as team names and locations.

For VRC events, can optionally show predictecd match outcomes from http://vrc-data-analysis.com.
 
 ## Installation
 Install Node/NPM if you don't have it already, then:
 ```
 git clone https://github.com/johnholbrook/vextm-obs-intro-screen
 cd vextm-obs-intro-screen
 npm install
 ```
 
 ## Usage
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
                                     URLs – only set this option at
                                     multi-division events)
                                                 [string] [default: "division1"]
```

The display will then be available as a web page on `http://localhost:8080` (or whatever port is specified with the `--port` flag).
The display is intended to be shown as a browser source in OBS, over top of the normal "match timer" overlay – 
it will disappear when a match is started and reappear when the next match is queued.
