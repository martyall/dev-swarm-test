// This file contains intentional lint and formatting issues to test CI workflow

var unused_variable = 'this variable is never used';

function badlyFormatted(   param1,param2   ){
console.log( "Missing semicolon and bad spacing" )
return param1+param2
}

// Missing semicolon
const arrow_func = () => {
  return "bad formatting"
}

// Unreachable code
function unreachableCode() {
  return 'early return';
  console.log('This will never execute');
}

// Missing const/let
global_var = 'should use const or let';

// Bad indentation and mixed quotes
  if(true){
var x="mixed quotes and spacing";
        console.log(x)
  }

// Trailing whitespace and missing semicolon
const trailing = 'whitespace'