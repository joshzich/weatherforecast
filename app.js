var express = require('express');
var rp = require('request-promise');
var host = 'http://api.openweathermap.org';
var apiKey = '';

var app = express();

var getForecast = function(req, response, chunk, build){
	let json = JSON.parse(chunk);
	console.log('here is the main' + json.list);
}

var generateResponse = function(req, response, chunk){
	let json = JSON.parse(chunk);
	var currentWeather = {};
	currentWeather['currentTemp'] = json.main.temp;
	for(i in json.weather){
		currentWeather['cond' + i] = json.weather[i].description;
	}
	currentWeather['windSpeed'] = json.wind.speed;
	return currentWeather;
}

var makeRequest = function(req, response, api, params){
	var zip = req.params.zip;
	params = params == null ? '' : params;
	const url = host + '/data/2.5/' + api + '?zip=' + zip + ',us&appid=' + apiKey + '&units=imperial' + params;
	return rp(url, function(error, response, body) {
		return body;
	});
}


app.get('/api/weather/:zip', function (req, res) {
	var data = {'currentWeather' : {}, 'forecast' : {}};  
	makeRequest(req, res, 'weather').then((response) => {
		console.log(JSON.parse(response));
		var weatherJson = JSON.parse(response); 
		var weather = weatherJson.weather; 
		for(var i in weather){
			data.currentWeather[weather[i].main] = weather[i].description;
		}
		data.currentWeather['temp'] = weatherJson.main.temp.toFixed(0); 
		data.currentWeather['windSpeed'] = weatherJson.wind.speed.toFixed(0); 
		var dateMap = {};
		var currentDay = new Date(); 
		console.log(typeof currentDay); 
		var currDayMonth = (currentDay.getMonth() + 1) + '/' + currentDay.getDate(); 
		makeRequest(req, res, 'forecast').then((response2) => {
			var forecastJson = JSON.parse(response2);
			var forecasts = forecastJson.list;
			var dates = []; 
			for(var j in forecasts){
				var d = new Date(forecasts[j].dt * 1000);  
				var dayMonth = (d.getMonth() + 1) + '/' + d.getDate(); 
				if(dayMonth != currDayMonth){
					dates.push(dayMonth); 
					if(dateMap[dayMonth]){
						dateMap[dayMonth]['temp'] += forecasts[j].main.temp; 
						dateMap[dayMonth]['humidity'] += forecasts[j].main.humidity; 
						dateMap[dayMonth]['count'] += 1; 
					}else{
						dateMap[dayMonth] = //
						{'temp' : forecasts[j].main.temp, 'humidity' : forecasts[j].main.humidity, 'count' : 1, 'weather' : {}};
					}
					
					var forecastWeather = forecasts[j].weather; 
					for(var k in forecastWeather){
						dateMap[dayMonth]['weather'][forecastWeather[k].main] = forecastWeather[k].description; 
					}		
				}
				
				for(var l in dates){
					var date = dates[l]; 
					var count = dateMap[date]['count']; 
					data.forecast[date] = {}; 
					data.forecast[date]['temp'] = (dateMap[date]['temp']/count).toFixed(0);
					data.forecast[date]['humidity'] = (dateMap[date]['humidity']/count).toFixed(0);
					data.forecast[date]['weather'] = dateMap[date]['weather'];
				}
			}
			
			res.send(data); 
		});
		
	});
});




app.listen(3000, function () {
	console.log('App listening on port 3000');
});
