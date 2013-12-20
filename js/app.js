// Import jQuery and Bootstrap (not that I'm using Bootstrap for anything yet)
window.$ = require('../bower_components/jquery2/jquery.js');
require('../bower_components/bootstrap/dist/js/bootstrap.js');

var LOCALKEY='crosswordify'

$(document).ready(function(){
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
		var $dest = $('.crossword-preview');
		$dest.text('Generating');

		var crossWorker = new Worker('./crossworker.js');
		crossWorker.onmessage = function(oEvent){
			if(oEvent.data.err){
				alert('Error: '+oEvent.data.err);
				return;
			}
			if(oEvent.data.resultHtml){
				$dest.html(oEvent.data.resultHtml);
			}
		}
		crossWorker.postMessage(inputs);
		
		// Create crossword object with the words and clues
		return false;
	});

	var encodeForm = function(){
		var inputs = {
			word: [],
			clue: []
		}

		$.each(['word','clue'],function(i,val){
			$('form.clues tr:not(:last-child)').find('input.'+val+',textarea.'+val).each(function(){
				inputs[val].push($(this).val());
			})
		});
		return inputs;
	}

	var saveState = function(){
		var state = {
			inputs: encodeForm()
		};
		console.log(state);
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

		for(var i=0;i<state.inputs.word.length; i++){
			var $new = $template.clone();
			$.each(['word','clue'],function(j,element){
				$new
					.find('.'+element)
					.val(state.inputs[element][i])
					.on('change keyup',expandyHandler);
			});
			$template.before($new);
		}

	}

	loadState();
});