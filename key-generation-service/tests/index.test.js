const fetch = require('node-fetch');

const test = () => {
  const receivedKeys = new Set();
  const totalNumberOfClients = 500;

  for (let i = 0 ;i < totalNumberOfClients; i++) {
    setInterval(() => {
      fetch('http://localhost:8000/key')
        .then(res => res.json())
        .then(json => {
          const key = json.key;
          if (!key) {
            console.log("Null key returned");
          } else if (receivedKeys.has(key)) {
            console.log("Duplicate key returned from the service!!!")
          } else {
            console.log("Received key " + key);
            receivedKeys.add(key);
          }
        });
    }, Math.floor((1 * 1000) + Math.random() * (2 * 1000)));
  }
};

test();