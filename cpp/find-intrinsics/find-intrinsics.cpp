#include <iostream>
#include <string>
#include <vector>
#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/calib3d/calib3d.hpp>

const int IMAGES_REQUIRED = 6;

std::vector<cv::Point3f> getObjectPoints(cv::Size_<int> size, float sqSize)
{
    int y,x;
    double _y, _x;
    std::vector<cv::Point3f> pts;

    for(y=0;y<size.height;y++){
        for(x=0;x<size.width;x++){
            _y = y;
            _x = x;
            _y *= sqSize;
            _x *= sqSize;
            pts.push_back(cv::Point3f(_x,_y,0));
        }
    }
    return pts;
}

std::vector<std::vector<cv::Point3f> > getObjectPoints(unsigned int n, cv::Size_<int> size, float sqSize)
{
    std::vector<std::vector<cv::Point3f> > out;
    unsigned int i;

    for(i=0;i<n;i++){
        out.push_back(getObjectPoints(size, sqSize));
    }
    return out;
}

int main(int argc, char **argv) {
  // executable output standard IMAGES
  if(argc < (IMAGES_REQUIRED + 3)) {
    std::cout << "Usage: " << argv[0] << " <output> <standard> <image>..." << std::endl;
    std::cout << "  This program needs at least " << IMAGES_REQUIRED << " images." << std::endl;
    std::cout << "  For best results, consider using 10-12 calibration images." << std::endl;
    return 0;
  }
  cv::FileStorage file(argv[2], cv::FileStorage::READ);
  int squareSize;
  int width;
  int height;
  file["squareSize"] >> squareSize;
  file["width"] >> width;
  file["height"] >> height;
  std::vector<cv::Mat> images;
  for(int i = 3; i < argc; i++){
    cv::Mat image = cv::imread(argv[i], CV_LOAD_IMAGE_GRAYSCALE);
    images.push_back(image);
  }
  std::cout << argc-3 << std::endl;
  file.release();
  std::vector<cv::Mat> rvecs;
  std::vector<cv::Mat> tvecs;
  std::vector<std::vector<cv::Point2f> > imagePoints;
  std::vector<std::vector<cv::Point3f> > objectPoints;
  cv::Size_<int> boardSize(width,height);
  for(int i=0; i < images.size(); i++){
    bool success;
    std::vector<cv::Point2f> corners;
    cv::Mat image = images.at(i);
    success = cv::findChessboardCorners(image, boardSize, corners,
      cv::CALIB_CB_ADAPTIVE_THRESH + cv::CALIB_CB_NORMALIZE_IMAGE);
    if(success){
      imagePoints.push_back(corners);
    }
  }
  objectPoints = getObjectPoints((unsigned int)imagePoints.size(), boardSize, squareSize);
  std::cout << std::endl << "Images: " << images.size() << ", valid images: " << imagePoints.size();

  cv::Mat cameraMatrix;
  cv::Mat distortionCoeffs;

  cv::calibrateCamera(objectPoints,
                      imagePoints,
                      cv::Size(images[0].size[0], images[0].size[1]),
                      cameraMatrix,
                      distortionCoeffs,
                      rvecs,
                      tvecs,
                      CV_CALIB_FIX_ASPECT_RATIO);

  cv::FileStorage outputFile(argv[1], cv::FileStorage::WRITE);

  outputFile << "cameraMatrix" << cameraMatrix;
  outputFile << "distortionCoeffs" << distortionCoeffs;

  outputFile.release();
}
