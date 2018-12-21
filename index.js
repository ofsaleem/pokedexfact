'use strict';
var Alexa = require('alexa-sdk');
var https = require('https');
var self;
var APP_ID = "amzn1.echo-sdk-ams.app.fan-pokedex"; //OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var SKILL_NAME = 'Fan Pokedex';
const TOTAL_POKEMON = 802;

//gimme pokemon results
const BASEURL = "https://pokeapi.co/api/v2/pokemon-species/";
function getPokemonResponse(pokemonNum, callback) {
  var body = [];
  https.get(BASEURL + pokemonNum + '/', (response) => {
    response.on('data', function(chunk) {
      body.push(chunk);
    }).on('end', function() {
      body = Buffer.concat(body).toString();
      callback(body);
    });
  });
}

//the callback. parse out the Entries
function getPokedexEntries(response) {
    var entries = JSON.parse(response);
	var pokemonName = entries["name"];
	var pokemonIndex = entries["id"];
	var flavorEntries = entries["flavor_text_entries"];
  
    var arrFound = flavorEntries.filter(function(item) {
      return item.language.name == "en";
    });
  var wantedResponse = arrFound[1]["flavor_text"];
	var cleanEntry = wantedResponse.replace(/\n/g," ");
    handlers['EmitFact'](pokemonName, cleanEntry, pokemonIndex);
}

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetNewFactIntent': function () {
        this.emit('GetFact');
    },
    'GetFact': function () {

      // get random Pokemon
      var pokemonIndex = Math.ceil(Math.random() * TOTAL_POKEMON);
      self = this;

      //get pokemon response
      getPokemonResponse(pokemonIndex, getPokedexEntries);
    },
    'EmitFact': function(pokemonName, entry, pokemonIndex) {
      var speechOutput = "Here's an entry for " + pokemonName + ": " + entry;
      var spriteURL = "https://pokeapi.co/media/sprites/pokemon/" + pokemonIndex + ".png";
      var imageObj = {
        smallImageUrl: spriteURL
      };
      var properCaseName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1);
      self.emit(':tellWithCard', speechOutput, properCaseName, entry);
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = "You can say give me a Pokedex entry, or, you can say exit... What can I help you with?";
        var reprompt = "What can I help you with?";
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Good luck becoming a Pokemon master!');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Good luck becoming a Pokemon master!');
    }
};
