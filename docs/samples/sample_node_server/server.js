var http = require('http'); // 1 - Import Node.js core module
var redis = require('redis');

var server = http.createServer(function (req, res) {
    if (req.url == '/') { //check the URL of the current request

        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html' });

        // set response content    
        res.write('<html><body><p>This is home Page.</p></body></html>');
        res.end();

    }

});

server.listen(5000); //3 - listen for any incoming requests

console.log('Node.js web server at port 5000 is running..')



const client = redis.createClient();

client.on('error', (err) => console.log('Redis Client Error', err));

client.connect().then(async () => {
    await client.subscribe('app_channel', (message) => {
        console.log(message); // 'message'
        setTimeout(async () => {
            let data = 'process_dfata';
            // let data =JSON.stringify({

            // })
            let client1 = client.duplicate();
            await client1.connect();
            client1.publish('app_channel_resp', data);
            console.log('publish response after 5s');
        }, 5000);
    });
});