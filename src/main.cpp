#include "react/Domain.h"
#include <opencv2/opencv.hpp>
#include "argparse.hpp"

int main(int argc, const char** argv) {
	
	// make a new ArgumentParser
    ArgumentParser parser;

    // add some arguments to search for
    
    parser.addArgument("-c", "--cactus", 1);
    
    // parse the command-line arguments - throws if invalid format
    parser.parse(argc, argv);
    
    // if we get here, the configuration is valid
    int cactus = parser.retrieve<int>("cactus");
    std::cout << cactus << " cactuses" << std::endl;
    
	return 0;
}