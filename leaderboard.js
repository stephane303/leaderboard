// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");
Selected = new Meteor.Collection('selected');

function sortedByScore() {
    return _.isEqual(Session.get('sort_order'), {score: -1, name: 1});
}

function getSortOrder() {
    return Session.get('sort_order');
}

function getRandomScore(max) {
    return Math.floor(Random.fraction() * max) * 5;
}

if (Meteor.isClient) {


    Meteor.startup(function() {
        Session.setDefault('sort_order', {score: -1, name: 1});
    });

    Template.leaderboard.helpers({
        players: function() {
            return Players.find({}, {sort: getSortOrder()});
        },
        selected_name: function() {
            var player = Players.findOne(Session.get("selected_player"));
            return player && player.name;
        }
    });

    Template.player.helpers({
        selected: function() {
            return Session.equals("selected_player", this._id) ? "selected" : '';
        }
    });

    Template.buttons.helpers({
        buttonState: function() {
            return sortedByScore() ? 'Name' : 'Score';

        }
    });
    
    Selected.find({}).observe({
        changed : function(new_doc, old_doc){
            Session.set("selected_player",new_doc.Selected);
            }
    });

    Template.buttons.events({
        'click #sort': function() {
            if (sortedByScore()) {
                Session.set('sort_order', {name: 1, score: 1});
            } else
            {
                Session.set('sort_order', {score: -1, name: 1});
            }
        },
        'click #reset': function() {
            Meteor.call('reset', 1000);
        }
    });

    function addGuy(){
            var newGuy = $('#newGuy').val();
            if (newGuy){
                Players.insert({name: newGuy, score: getRandomScore(10)});
                $('#newGuy').val('');
            }        
    }
    Template.leaderboard.events({
        'click input.inc': function() {
            Players.update(Session.get("selected_player"), {$inc: {score: 5}});
        },
        'click #addGuy ': function() {
            addGuy();
        },
        'keypress input#newGuy': function(event){
            if (event.which === 13) addGuy();
        }
    });

    Template.player.events({
        'click span': function() {
            Session.set("selected_player", this._id);
            Selected.update(
                Selected.findOne()._id,
                {Selected: this._id});
        },
        'click input.del':function(event){
            var current_id = this._id;
            $(event.currentTarget.parentElement).hide( "slow",
                function(){
                     Players.remove(current_id);
                });
        }                
    });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
    Meteor.startup(function() {
        if (Players.find().count() === 0) {
            var names = ["Ada Lovelace",
                "Grace Hopper",
                "Marie Curie",
                "Carl Friedrich Gauss",
                "Nikola Tesla",
                "Claude Shannon"];
            for (var i = 0; i < names.length; i++)
                Players.insert({name: names[i], score: getRandomScore(10)});
        };
        if (Selected.find().count() === 0) {
            Selected.insert({Selected : 'none'});
        }
    });

    Meteor.methods({
        reset: function(max) {
            Players.find().forEach(function(player) {
                Players.update(player._id, {$set: {score: getRandomScore(max)}});
            });
        }
    });
}
