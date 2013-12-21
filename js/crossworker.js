var Crossword = require('./crosswordgenerator').Crossword;
var CrosswordUtils = require('./crosswordgenerator').CrosswordUtils;

onmessage = function(oEvent){

	try{
		var cw = new Crossword(oEvent.data.word, oEvent.data.clue);
	} catch(e){
		postMessage({
			err : String(e),
			errName: 'constructor'
		});
		return;
	}

	// create the crossword grid (try to make it have a 1:1 width to height ratio in 10 tries)
	var tries = 5000;
	var grid = cw.getSquareGrid(tries);
	// report a problem with the words in the crossword
	if(grid == null){
		var bad_words = cw.getBadWords();
		var str = [];
		for(var i = 0; i < bad_words.length; i++){
			str.push(bad_words[i].word);
		}
		console.log(cw);
		postMessage({
			err: 'A grid could not be created with these words: '+str.join(', '),
			errName: 'badwords',
			errWords: bad_words
		});
		return false;
	}

	// turn the crossword grid into HTML
	var show_answers = true;

	postMessage({
		resultGrid:grid,
		resultHtml: CrosswordUtils.toHtml(grid, show_answers),
		resultWordsElements: cw.word_elements
	})
}