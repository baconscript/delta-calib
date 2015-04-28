# delta-calib

Deltabot calibration using lasers

## Installation

You need:
  * Node.js
  * OpenCV
  * pkg-config
  * g++

To run on a Raspberry Pi with real lasers, you'll need gpio-admin. Follow the instructions [here](https://www.npmjs.com/package/pi-gpio) to get gpio-admin... **EXCEPT** don't clone the repo it tells you to! Clone [https://github.com/rexington/quick2wire-gpio-admin.git](https://github.com/rexington/quick2wire-gpio-admin.git) and then `git checkout fixpath` before running the build steps.

To run a simulation on another computer, make sure you have POVRay installed.
