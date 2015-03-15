FROM ubuntu:14.04

RUN apt-get update
RUN apt-get -y install libtbb-dev libgtest-dev libboost-system1.55-dev libboost-context1.55-dev 
RUN apt-get -y install libboost-coroutine1.55-dev cmake build-essential git clang
RUN apt-get install -y libopencv-dev
RUN mkdir -p /build-lib


# Install and build cpp.react
WORKDIR /build-lib
RUN git clone https://github.com/schlangster/cpp.react.git
WORKDIR cpp.react
RUN git checkout 2f1cb0ac85a3aa4fd8c908832634b85e68aa20fb
RUN mkdir build
WORKDIR build
RUN cmake ..
RUN make

# Clone argparse
WORKDIR /build-lib
RUN git clone https://github.com/hbristow/argparse.git

RUN useradd -m docker
USER docker
WORKDIR /home/docker
CMD src/build
