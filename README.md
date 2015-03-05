#delta-calib
Calibration for deltabots.


##Building

Included is a Dockerfile for a box that will download and install all the
dependencies for you. Therefore, the only real requirement to build this is
Docker.

You may need to use `sudo` for this.

Building the Docker image:

    ./docker-build
    
Compiling the software within the Docker container:
    
    ./docker-compile
    
You can also explore the container, or run arbitrary commands in it:

    ./docker-compile /bin/bash