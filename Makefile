ERR = $(shell which g++ >/dev/null; echo $$?)

ifeq "$(ERR)" "0"
	CC = g++
else
	CC = g++-4.7
endif

CFLAGS = -Wall -std=c++11

CFLAGS += `pkg-config --cflags --libs opencv`

all: bin/mk-standard bin/find-intrinsics

bin:
	mkdir -p ./bin

bin/mk-standard: bin
	$(CC) $(CFLAGS) cpp/mk-standard/mk-standard.cpp -o bin/mk-standard

bin/find-intrinsics: bin
	$(CC) $(CFLAGS) cpp/find-intrinsics/find-intrinsics.cpp -o bin/find-intrinsics
