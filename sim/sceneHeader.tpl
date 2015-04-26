#version 3.7;
global_settings{assumed_gamma 1.0}
#default{ finish{ ambient 0.01 diffuse 0.01 }}

background { color rgb <0.005, 0.005, 0.005> }
//------------------------------------------
#include "colors.inc"
#include "textures.inc"

//------------------------------------------
// camera ----------------------------------
camera{ location  <<%- -cam.e(1) %>, <%- cam.e(3) %>, <%- cam.e(2) %>>
        look_at   <<%- -lookAt.e(1) %>, <%- lookAt.e(3) %>, <%- lookAt.e(2) %>>
        right -x*image_width/image_height
        angle <%- fov %> }

// sun -------------------------------------
    light_source{<1500,3000,-2500> color White}
    
