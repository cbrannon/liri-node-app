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
            getTweets('clever_cobra');
            break;
        case "get-tweets":
            getTweets(commandArg)
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

function getTweets(screenname) {
    const params = {screen_name: screenname};
    client.get('statuses/user_timeline', params)
        .then((tweets) => {
            if (tweets == undefined || tweets.length == 0) {
                console.log("No tweets available for this user.");
                return;
            }
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
        })
        .catch((error) => {
            throw error;
        })
}

function postTweet(tweet) {
    const params = {status: tweet};
    client.post('statuses/update', params)
        .then((tweet) => {
            getTweets();
        })
        .catch((error) => {
            throw error;
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
                if (track.name == songName && track.artists[0].name == "Ace of Base") {
                    logTrack(track, songName);
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
                if (track.name == songName) {
                    logTrack(track);
                }
            });
        });
    }
}

function logTrack(track, songName) {
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
    let movieName = movie;

    if (movieName == undefined) {
        movieName = "Mr. Nobody";
    }

    rp({
        url: 'http://www.omdbapi.com/?t=' + movieName,
        json: true
    })
    .then((movie) => {
        let movieItems = [movie.Title, movie.Year, movie.imdbRating,
        movie.Country, movie.Language, movie.Plot, movie.Actors,
        movie.Ratings[1].Value];
        
        movieItems.forEach((item) => {
            console.log(item);
            fs.appendFileSync('./log.txt', item + '\n');
        })
        endEntry();
    })
    .catch((error) => {
       throw error;
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

function inquireUsersTweets() {
    inquirer.prompt([
        {
            type: "input",
            message: "Whose tweets would you like to get?",
            name: "user"
        }, 
         {
            type: "confirm",
            message: "Are you sure:",
            name: "confirm",
            default: true
        }
    ])
    .then((response) => {
        if (response.confirm) {
            processRequest("get-tweets", response.user);
        } else {
            inquireUsersTweets();
        }
    })
    .catch((error) => {
        throw error;
    })
}

function inquireTweet() {
    inquirer.prompt([
        {
            type: "input",
            message: "What would you like to tweet?",
            name: "tweet"
        },
         {
            type: "confirm",
            message: "Are you sure:",
            name: "confirm",
            default: true
        }
    ])
    .then((response) => {
        if (response.confirm) {
            processRequest("post-tweet", response.tweet);
        } else {
            inquireTweet();
        }
    })
    .catch((error) => {
        throw error;
    })
}

function inquireTrack() {
    inquirer.prompt([
        {
            type: "input",
            message: "What song would you like to search for?",
            name: "track"
        },
         {
            type: "confirm",
            message: "Are you sure:",
            name: "confirm",
            default: true
        }
    ])
    .then((response) => {
        if (response.confirm) {
            processRequest("spotify-this-song", response.track);
        } else {
            inquireTrack();
        }
    })
    .catch((error) => {
        throw error;
    }) 
}

function inquireMovie() {
    inquirer.prompt([
        {
            type: "input",
            message: "What movie would you like to search for?",
            name: "movie"
        },
         {
            type: "confirm",
            message: "Are you sure:",
            name: "confirm",
            default: true
        }
    ])
    .then((response) => {
        if (response.confirm) {
            processRequest("movie-this", response.movie);
        } else {
            inquireMovie();
        }
    })
    .catch((error) => {
        throw error;
    })
}

function inquireCommand() {
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            choices: ["Get my tweets", "Get another users tweets", "Post tweet", "Search Spotify", "Search Movies", "Run command from file"],
            name: "choice"
        },
        {
            type: "confirm",
            message: "Are you sure:",
            name: "confirm",
            default: true
        }
    ])
    .then((response) => {
        if (response.confirm) {
            switch (response.choice) {
                case "Get my tweets":
                    processRequest("my-tweets", "clever_cobra");
                    break;
                case "Get another users tweets":
                    inquireUsersTweets();
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
    .catch((error) => {
        throw error;
    })
}

processRequest(command, process.argv[3]);

