#include <iostream>
#include <string>
#include <opencv2/core/core.hpp>

int main(int argc, char **argv) {
  if(argc < 5) {
    std::cout << "Usage: " << argv[0] << " <size> <width> <height> <output file>" << std::endl;
    return 0;
  }
  cv::FileStorage file(argv[4], cv::FileStorage::WRITE);
  file << "squareSize" << std::stoi(argv[1]);
  file << "width" << std::stoi(argv[2]);
  file << "height" << std::stoi(argv[3]);
  file.release();
}
