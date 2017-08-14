var http = require('http');
var fs = require('fs');

var server = http.createServer(function(request, response){
	
	response.writeHead(200, {
	'Content-Type' : 'text/csv',
	'Access-Control-Allow-Origin' : '*',
	});
	
	fs.readFile('data.csv', 'utf8', function (err, text ){
	if (err) console.log('there is an error');
	response.end(text);
	});
});

server.listen(3000, function () {
	console.log('Server is listening at http://localhost:3000');
});