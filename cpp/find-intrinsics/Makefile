CC = g++

CFLAGS = -Wall -std=c++11

CFLAGS += `pkg-config --cflags --libs opencv`

all:
	$(CC) $(CFLAGS) find-intrinsics.cpp -o find-intrinsics

