light_source {
  y*5, Red * 100
  cylinder
  point_at <0,0,-1>
  radius <%- beamWidth %>
  falloff <%- beamWidth/2 %>
  tightness 0
  photons {
    reflection on
    refraction on
  }
  parallel
  point_at <0,0,-1>
  <%- tf %> translate <<%- x %>, <%- y %>, <%- z %>>
}
