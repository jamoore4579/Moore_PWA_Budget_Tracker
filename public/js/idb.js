// variable for db connection
let db;

// connection to indexed db called Budget Tracker and set as version 1
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {

    // reference to the db
    const db = event.target.result;

    // create object store called 'new_transaction', set to auto increment the primary key
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// this is a check to see if app is online
request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadTransaction()
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

// function to submit a new transaction if app is offline
function saveRecord(record) {

    // add new transaction to the db with read/write permission
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    
    //access object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to object store
    budgetObjectStore.add(record);
}

function uploadTransaction() {
    
    // open a transaction in the db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // get all records from the store
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {

        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })

                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    const transaction = db.transaction(['new_transaction'], 'readwrite');

                    const budgetObjectStore = transaction.objectStore('new_transaction');

                    //clear all items in the store
                    budgetObjectStore.clear();

                    alert('All saved transactions has been submitted');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// listen for app to be online
window.addEventListener('online', uploadTransaction);