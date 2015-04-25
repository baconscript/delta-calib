#include <ctime>
#include <unistd.h>
#include <iostream>
#include <raspicam/raspicam_cv.h>
#include "opencv2/imgproc/imgproc.hpp"
#include "opencv2/features2d/features2d.hpp"
using namespace std;

int main ( int argc,char **argv ) {

    time_t timer_begin, timer_end;
    raspicam::RaspiCam_Cv Camera;
    cv::Mat laserOn, laserOff, diff, thresh, out;

    //set camera params
    Camera.set( CV_CAP_PROP_FORMAT, CV_8UC1 );
    Camera.set( CV_CAP_PROP_FRAME_WIDTH, 1280 );
    Camera.set( CV_CAP_PROP_FRAME_HEIGHT, 960 );

    //Open camera
    cout<<"Opening Camera..."<<endl;
    if (!Camera.open()) {cerr<<"Error opening the camera"<<endl;return -1;}

    // Give it half a second to open... otherwise
    // your first image may be underexposed
    usleep(500000);

    // Capture first frame
    Camera.grab();
    Camera.retrieve(laserOff);
    cout << "Off frame grabbed. Please activate laser" << endl;

    // Wait 5 seconds so you can plug in the lasers
    usleep(5000000);
    Camera.grab();
    Camera.retrieve(laserOn);
    cout << "On frame grabbed." << endl;
    Camera.release();

    //save images
    cv::imwrite("laser-off.jpg",laserOff);
    cv::imwrite("laser-on.jpg",laserOn);

    // Take the difference of the two images and threshold it
    cv::absdiff(laserOff,laserOn,diff);
    cv::threshold(diff, thresh, 64, 255,0);

    // Save these too
    cv::imwrite("diff.jpg",diff);
    cv::imwrite("thresh.jpg",thresh);

    //Search for blobs
    // First, set up the parameters
    cv::SimpleBlobDetector::Params params;
    params.minDistBetweenBlobs = 50.0f;
    params.filterByInertia = false;
    params.filterByConvexity = false;
    params.filterByColor = false;
    params.filterByCircularity = false;
    params.filterByArea = true;
    params.minArea = 20.0f;
    params.maxArea = 500.0f;

    // Search for the blobs
    cv::Ptr<cv::FeatureDetector> blob_detector = new cv::SimpleBlobDetector(params);
    blob_detector->create("SimpleBlob");
    vector<cv::KeyPoint> keypoints;
    blob_detector->detect(thresh, keypoints);

    // Convert the "off" image to color so we can draw red circles on it
    cvtColor(laserOff, out, CV_GRAY2RGB);
    cout << keypoints.size() << " points located." << endl;

    // Draw a red circle for each blob we've found
    for (int i=0; i<keypoints.size(); i++){
        float x=keypoints[i].pt.x;
        float y=keypoints[i].pt.y;
        cv::circle(out, keypoints[i].pt, 3, cv::Scalar(0,0,255), -1);
    }

    // Save the locations
    cv::imwrite("location.jpg",out);

    cout<<"Complete."<<endl;
}
