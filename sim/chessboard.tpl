<% if(showSquares) { %>box {
    <-<%- len %>,0,-<%- len %>>,<<%- len %>,0.001,<%- len %>>
  texture {
    pigment {
      checker
      color rgb<1,1,1>
      color rgb<0.5,0.5,0.5>
    } scale <%- scale %>
  }
}<% } %>

box {
    <-<%= margin %>,<%- showSquares ? -0.001 : 0 %>,-<%= margin %> >,
    < <%= margin %>, 0, <%= margin %> >
    texture{ pigment{ color White} }
}
