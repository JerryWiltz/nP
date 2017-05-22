/**
 * Here's a simple usecase for our Person class, again we will start by using requireJS to 'define' a 
 * new class; however note how we pass the `require` object through to the closure as an argument, this
 * allows us to retrieve other exported modules / class definitions that have been 'define'd.
 */
define(function (require) {
    "use strict";

    // requireJS will ensure that the Person definition is available to use, we can now import
    // it for use (think of this as your import statement in AS3).
    var Person = require('Person');

    // We can now invoke the constructor function to create a new instance and invoke that instance's
    // methods.
    var jonny = new Person("Jonny");
    jonny.setAge(29);
    console.log(jonny.toString());

    // We can also access any public static methods and properties attached to the Person function:
    var sean = Person.create("Sean", 30);
    console.log(sean.greet());
    console.log("Generally speaking, you can retire at " + Person.RETIREMENT_AGE);
});