var MyBundle = (function () {
'use strict';

// src/foo.js
var foo = 'hello world!';

//main.js
function main () {
  console.log(foo);
}

return main;

}());
