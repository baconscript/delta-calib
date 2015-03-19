#include "react/Domain.h"
#include <opencv2/opencv.hpp>
#include "opts.cpp"

int main(int argc, char* argv[]) {
  if(cmdOptionExists(argv, argv+argc, "-h"))
  {
    std::cout << "Help str" << std::endl;
  } 
	return 0;
}
