'use strict';

// import { addData } from './database.js';

/**
 * Submits a pair of values to the database
 * @param {number} minutes - the number of minutes it takes to get the school
 * @param {string} mode - the mode of transportation they used
 */
function submitValues(minutes, mode) {
    // @TODO: Elbert says we don't need this anymore
    // log values to console
    // console.log(`minutes: ${minutes}`);
    // console.log(`mode: ${mode}`);
    const data = {
        minutes: minutes,
        mode: mode
    };

    // addData(data);

    // console.log(readData());
}

// attach event listener to submit form - @TODO: don't need anymore
// document.getElementById('submit').addEventListener('click', function(event) {
//     // prevent default action
//     event.preventDefault();

//     // get values from form
//     const minutes = document.getElementById('minutes').value;
//     const mode = document.getElementById('mode').value;

//     // if minutes is not a number or was empty, alert user
//     if (isNaN(minutes) || minutes === '') {
//         alert('Please enter a number for minutes');
//         return;
//     }

//     // clear form
//     document.getElementById('form').reset();

//     // add a submitted h1 to the main element
//     const h1 = document.createElement('h1');
//     h1.innerText = 'Submitted!';
//     document.getElementById('main').appendChild(h1);

//     // submit values to database
//     submitValues(minutes, mode);
// });