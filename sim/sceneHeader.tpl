#version 3.7;
global_settings{assumed_gamma 1.0}
#default{ finish{ ambient 0.01 diffuse 0.01 }}

background { color rgb <0.005, 0.005, 0.005> }
//------------------------------------------
#include "colors.inc"
#include "textures.inc"

//------------------------------------------
// camera ----------------------------------
camera{ location  <0.0 , 1.0 ,-3.0>
        look_at   <0.0 , 1.0 , 0.0>
        right -x*image_width/image_height
        angle 75 }

// sun -------------------------------------
    light_source{<1500,3000,-2500> color White}
    
