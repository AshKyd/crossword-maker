// Import jQuery and Bootstrap (not that I'm using Bootstrap for anything yet)
window.$ = require('../bower_components/jquery2/jquery.js');
require('../bower_components/bootstrap/dist/js/bootstrap.js');

var LOCALKEY='crosswordify'

$(document).ready(function(){

	var undoStack = [];
	var redoStack = [];
	var saveFields = ['word','clue','x','y','dir'];

	/**
	 * Expandy
	 */
	var expandyHandler = function(){
		var $expandThing = $(this).closest('.expandthing');
		if($(this).val() != '' && $expandThing.next().length == 0){
			var $newThing = $expandThing.clone();
			$newThing
				.find('input,textarea')
				.val('')
				.on('change keyup',expandyHandler);
			$expandThing.after($newThing);
		}

		saveState();
	}
	$('.expandy .expandthing').find('input,textarea').on('change keyup',expandyHandler);
	$('.expandy').on('click',function(e){
		var $target = $(e.target).closest('button');
		if($target.is('.deleterow') && !$target.closest('tr').is(':last-child')){
			$target.closest('tr').remove();
		}
	});

	/**
	 * Crossword Gen
	 */
	$('form.clues').submit(function(){

		var inputs = encodeForm();
		var words = [];
		var clues = [];
		inputs.forEach(function(input){
			words.push(input.word);
			clues.push(input.clue);
		})
		$('.crossword-preview').text('Generating');

		var crossWorker = new Worker('./crossworker.js');
		crossWorker.onmessage = function(oEvent){
			if(oEvent.data.err){
				alert('Error: '+oEvent.data.err);
				return;
			}
			if(oEvent.data.resultHtml){
				doThis(loadFromGenerator,oEvent.data);
			}
		}
		crossWorker.postMessage({
			word:words,
			clue:clues
		});
		
		// Create crossword object with the words and clues
		return false;
	});

	$('#undo').click(function(){
		undo();
	});
	$('#redo').click(function(){
		redo();
	});

	var undo = function(){
		if(undoStack.length){
			var action = undoStack.pop();
			doThis(action[0],action[1],'redo');
		}
	}

	var redo = function(){
		if(redoStack.length){
			var action = redoStack.pop();
			doThis(action[0],action[1],'undo');
		}
	}

	var doThis = function(action,data,doWut){
		if(doWut == 'redo'){
			redoStack.push([action,data]);
		} else {
			undoStack.push([action,data]);
		}
		action(data);
	}

	var loadFromGenerator = function(data){

		$('.crossword-preview').html(data.resultHtml);

		// Loop through each cell.
		data.resultGrid.forEach(function(gy,y){
			gy.forEach(function(gx,x){
				if(gx === null){
					return;
				}
				// Find words
				['across','down'].forEach(function(dir){
					var word = gx[dir];
					if(word === null || !word.is_start_of_word){
						return;
					}
					$('.clues .expandthing').each(function(){
						if($(this).find('.word').val() == word.word){
							$(this).find('.x').val(x);
							$(this).find('.y').val(y);
							$(this).find('.dir').val(dir.substr(0,1));
						}
					});
				})
			});
		});
	}

	var encodeForm = function(){
		var inputs = [];

		$('form.clues tr:not(:last-child)').each(function(){
			var $parent = $(this);
			var row = {};
			$.each(saveFields,function(i,val){
				$parent.find('input.'+val+',textarea.'+val).each(function(){
					row[val] = $(this).val();
				});
			});
			inputs.push(row);
		});
		return inputs;
	}

	var saveState = function(){
		var state = {
			inputs: encodeForm()
		};
		localStorage[LOCALKEY] = JSON.stringify(state);
	}

	var loadState = function(state){
		if(!state){
			try{
				state = JSON.parse(localStorage[LOCALKEY]);
			} catch(e){
				return;
			}
		}

		var $template = $('.expandy .expandthing');

		for(var i=0;i<state.inputs.length; i++){
			var $new = $template.clone();
			$.each(saveFields,function(j,ele){

				$new
					.find('.'+ele)
					.val(state.inputs[i][ele])
					.on('change keyup',expandyHandler);
			});
			$template.before($new);
		}

	}

	loadState();
});