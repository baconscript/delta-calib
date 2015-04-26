#include <iostream>
#include <string>
#include <vector>
#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>

int main(int argc, char **argv) {
  if(argc < 6) {
    std::cout << "Usage: " << argv[0] << " <standard> <image>..." << std::endl;
    std::cout << "  For best results, consider using 10-12 calibration images." << std::endl;
    return 0;
  }
  cv::FileStorage file(argv[1], cv::FileStorage::READ);
  int squareSize;
  int width;
  int height;
  file["squareSize"] >> squareSize;
  file["width"] >> width;
  file["height"] >> height;
  std::vector<cv::Mat> images;
  for(int i=2; i < argv.length; i++){
    cv::Mat image = cv::imread(argv[i], cv::CV_LOAD_IMAGE_GRAYSCALE);
    images.push_back(image);
  }
  file.release();
}
