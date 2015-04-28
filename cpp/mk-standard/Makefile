CC = g++-4.7

CFLAGS = -Wall -std=c++11

CFLAGS += `pkg-config --cflags --libs opencv`

all:
	$(CC) $(CFLAGS) mk-standard.cpp -o mk-standard
