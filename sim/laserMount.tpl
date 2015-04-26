light_source {
  y*5, Red * 100
  cylinder
  point_at <0,0,-1>
  radius 0.01
  falloff 0.02
  tightness 0.025
  photons {
    reflection on
    refraction on
  }
  parallel
  point_at <0,0,-1>
  <%- tf %> translate <<%- x %>, <%- y %>, <%- z %>>
}
