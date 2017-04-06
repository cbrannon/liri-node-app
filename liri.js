const Twitter = require('twitter');
const keys = require('./keys.js');
const spotify = require('spotify');
const rp = require('request-promise');
const inquirer = require("inquirer");
const fs = require('fs');
const command = process.argv[2];
const client = new Twitter(keys.twitterKeys);

function processRequest(command, commandArg) {
    switch (command) {
        case "my-tweets":
            getTweets();
            break;
        case "post-tweet":
            postTweet(commandArg);
            break;
        case "spotify-this-song":
            getSong(commandArg);
            break;
        case "movie-this":
            getMovie(commandArg);
            break;
        case "do-what-it-says":
            readIt();
            break;
        default:
            inquireCommand();
    }
}

function getTweets() {
    const params = {screen_name: 'clever_cobra'};
    client.get('statuses/user_timeline', params, (error, tweets, response) => {
        if (error) throw error;
        tweets.forEach((tweet, index) => {
            let tweetItems = [tweet.created_at, tweet.text];

            tweetItems.forEach((item) => {
                console.log(item);
                fs.appendFileSync('./log.txt', item + '\n');
            })
            endEntry();
            if (index == 19) {
                return;
            }
        })
    });
}

function postTweets(tweet) {
    const params = {status: tweet};
    client.post('statuses/update', params, (error, tweet, response) => {
        if (error) throw error;
        getTweets();
    });
}

function getSong(song) {
    let songName = song;

    if (songName == undefined) {
        songName = "The Sign";
        spotify.search({ type: 'track', query: songName }, (err, data) => {
            if (err) {
                console.log('Error occurred: ' + err);
                return;
            }

            let tracks = data.tracks.items;
            tracks.forEach((track) => {
                if (track.artists[0].name == "Ace of Base") {
                    logTrack(track);
                }
            });
        });
    } else {
        spotify.search({ type: 'track', query: songName }, (err, data) => {
            if (err) {
                console.log('Error occurred: ' + err);
                return;
            }

            let tracks = data.tracks.items;
            tracks.forEach((track) => {
                logTrack(track);
            });
        });
    }
}

function logTrack(track) {
     const trackItems = [track.name, track.artists[0].name,
         track.artists[0].external_urls.spotify,
         track.album.name];
    
    trackItems.forEach((item) => {
        console.log(item);
        fs.appendFileSync('./log.txt', item + '\n');
    })
    endEntry();
}

function getMovie(movie) {
    const movieName = movie;

    if (movieName == undefined) {
        movieName = "Mr. Nobody";
    }

    rp({
        url: 'http://www.omdbapi.com/?t=' + movieName,
        json: true
    }).then((movie) => {
        let movieItems = [movie.Title, movie.Year, movie.imdbRating,
        movie.Country, movie.Language, movie.Plot, movie.Actors,
        movie.Ratings[1].Value];
        
        movieItems.forEach((item) => {
            console.log(item);
            fs.appendFileSync('./log.txt', item + '\n');
        })

        endEntry();
    }).catch((err) => {
        console.log(err);
    })
}

function readIt() {
     fs.readFile("./random.txt", (err, data) => {
        if (err) throw err;
        const options = data.toString().split(",");
        const command = options[0];
        const commandArg = options[1];
        processRequest(command, commandArg);
    })
}

function endEntry() {
    console.log('---------------------------------');
    fs.appendFileSync('./log.txt', '---------------------------------' + '\n');
}

function inquireTweet() {
    inquirer.prompt([
        {
            type: "input",
            message: "What would you like to tweet?",
            name: "tweet"
        }
    ]).then((response) => {
        processRequest("post-tweet", response.tweet);
    }) 
}

function inquireTrack() {
    inquirer.prompt([
        {
            type: "input",
            message: "What song would you like to search for?",
            name: "track"
        }
    ]).then((response) => {
        processRequest("spotify-this-song", response.track);
    }) 
}

function inquireMovie() {
    inquirer.prompt([
        {
            type: "input",
            message: "What movie would you like to search for?",
            name: "movie"
        }
    ]).then((response) => {
        processRequest("movie-this", response.movie);
    })
}

function inquireCommand() {
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            choices: ["Get my tweets", "Search Spotify", "Search Movies", "Run command from file"],
            name: "choice"
        },
        {
            type: "confirm",
            message: "Are you sure:",
            name: "confirm",
            default: true

        }
    ]).then((response) => {
        if (response.confirm) {
            switch (response.choice) {
                case "Get my tweets":
                    processRequest("my-tweets", "");
                    break;
                case "Post tweet":
                    inquireTweet();
                    break;
                case "Search Spotify":
                    inquireTrack();
                    break;
                case "Search Movies":
                    inquireMovie();
                    break;
                case "Run command from file":
                    processRequest("do-what-it-says", "");
                    break;
            }
        } else {
            inquireCommand();
        }
    })
}

processRequest(command, process.argv[3]);

