$(document).ready(function(){



	/***************/
	/* INIT HEIGHT */
	/***************/

	$main = $('#main');
	var margin_top = $main.css("marginTop").replace('px', '');
	// because there is padding and margin, top and bottom.
	var toSubstract = 4 * margin_top;
	toSubstract += 2 * $main.css("border-width").replace('px', '');

	$main.css('min-height', $(window).innerHeight() - toSubstract);

	$(window).resize(function() {
		$main.css('min-height', $(window).innerHeight() - toSubstract);
		$('#project-container .wrapper').css('max-height', $(window).innerHeight() - 162 - margin_top);
	});
	


	/***************/
	/* MENU MANAGER*/
	/***************/
	var $menu_link = $('#menu-link'),
		$menu = $('#menu');
	
	$menu_link.on('click', function(event){
		$(this).toggleClass('active');
		$menu.toggleClass('deployed');
	});

	toastFactory = function(container, content){
		var	toast = $('<span class="toast">').text(content);
		container.append(toast);
		toast.delay(1200).fadeOut("slow");
	};

	$('li[data-project-id] a').on('click', function(e){
		var li = $(this).parent();
		if(li.hasClass('pure-menu-disabled'))
			toastFactory(li, 'Tu dois d\'abord débloquer le projet pour y accéder');
		else
			injectTemplateExternal($(e.currentTarget).parent());
		return false;
	});



	/****************/
	/* CARD MANAGER */
	/****************/

	var cards = $('.card')
		, flips = $('.flip')
		, main_wrapper   = $('#project-container')
		, who_i_am = $('#who-i-am')
		, memory_length = Object.keys(memory).length
		, can_click      = true
		, click_count    = 0
		, previous_index = -1
		, up_to_down = {
		  'state'  : 'flipped-up',
		  'target' : 'flipped-down',
		}
		, down_to_up = {
		  'state'  : 'flipped-down',
		  'target' : 'flipped-up',
		}
		, CSS_TRANSITION_TIME = 1000
		, END_OF_ANIMATION  = 'animationend webkitAnimationEnd oanimationend MSAnimationEnd'
		, END_OF_TRANSITION = 'transitionend webkitTransitionEnd otransitionend MSTransitionEnd'
		, END_OF_GAME = 'END_OF_GAME'
		;


	transitionManager = function(selector, flow){
		selector.removeClass('anim-' + flow.state);
		selector.removeClass(flow.state);
		selector.addClass('anim-' + flow.target);
		selector.addClass(flow.target);
	};


	flipManager = function(selector, flow, index){
		transitionManager(selector, flow);
		memory[index].is_visible = !memory[index].is_visible;
	};


	flipCard = function(event){
		if(can_click){
			var $flip = $(event.currentTarget.children[0])
				, current_index = cards.index(this)
				, state = memory[current_index].is_visible
				;
			

			if (state){
				flow = up_to_down;
			}else{
				flow = down_to_up;
			}
			flipManager($flip, flow, current_index);

			if(click_count % 2 === 0){
				previous_index = current_index;
			}else{
				var current_card  = memory[current_index]
				  , previous_card = memory[previous_index]
				  , result = ''
				  ;

				can_click = false;
				if(current_index !== previous_index && previous_card.project_id === current_card.project_id && flow === down_to_up){
					// WIN
					$('.flipped-up').parent().unbind();
					$('flipped-up .front, .flipped-up .back').css('cursor', 'default');
					loadProjectAjax($flip, function(data) {
						$flip.one(END_OF_ANIMATION, function(){
						injectTemplate(data, main_wrapper);
						});
					});

				}else{
					$flip.one(END_OF_ANIMATION, function(){
						// LOOSE
						// Catch when you consciously flipped down cards
						if(flow === down_to_up){
							flipManager(current_card.selector, up_to_down, current_index);
							flipManager(previous_card.selector, up_to_down, previous_index);
						}
						can_click = true;
					});
				}
			}
			click_count++;
			return false;
		}
	};


	loadProjectAjax = function($elem, done_function){
		project_url = $elem.attr('data-project-url');

		$.ajax({
			type: 'GET',
			url: BASE_URL + project_url,
			dataType : 'json',
			context: document.body,
		}).done(done_function);
	};


	injectTemplate = function(data, container){
		$('#instruction').fadeOut();
		container.empty();
		document.title = data.title;
		container.append(data.template);
		$('#project-container .wrapper').css('max-height', $(window).innerHeight() - 162 - margin_top);

		// Set class of controls mirror
		$flipped_up = $(".flipped-up");
		$flipped_up.each(function(i){
			nth_index = parseInt($(this).attr('id').replace('c', '')) + 1;
			$('#back-to-cards li:nth-child(' + nth_index + ')').addClass('flipped-mirror');
		});

		// Enable menu
		$to_unlock = $('li[data-project-id=' + data.project_id + ']');
		$to_unlock.removeClass('pure-menu-disabled');
		$padlock = $to_unlock.find('img')
		if($padlock.attr('src') == 'ui/images/locked.png'){
			$padlock.attr('src', 'ui/images/unlocked.png')
		};

		$('.pure-menu-selected').removeClass('pure-menu-selected');
		$to_unlock.addClass('pure-menu-selected');

		if($flipped_up.size() == memory_length){
			$(document).trigger(END_OF_GAME);
		}

		main_wrapper.toggleClass('toTop');
	};


	backToCards = function(){
		can_click=true;
		$('#instruction').fadeIn();
		main_wrapper.toggleClass('toTop');
	}
	$(document).on('click', '#back-to-cards', backToCards);


	injectTemplateExternal= function($elem){
		if(main_wrapper.hasClass('toTop')){
			main_wrapper.removeClass('toTop');
			main_wrapper.one(END_OF_TRANSITION, function(){
				loadProjectAjax($elem, function(data){
					injectTemplate(data, main_wrapper);
					main_wrapper.unbind();
				});
			});
		}else{
			loadProjectAjax($elem, function(data){
				injectTemplate(data, main_wrapper);
			});
		}
		// To be flipped
		$('div[data-project-id='+ $elem.attr('data-project-id')+']').not('.flipped-up').each(function(i){
			flipManager($(this), down_to_up, $(this).attr('id').replace('c', ''));
			$('.flipped-up').parent().unbind();
			$('flipped-up .front, .flipped-up .back').css('cursor', 'default');
		})

	}

	$(document).on('click', '.nav-project-item', function(e){
		injectTemplateExternal($(e.currentTarget));
		return false;
	});

	cards.click(flipCard);



  	/***********************/
  	/* END OF GAME MANAGER */
  	/***********************/

  	toggleWhoIAm = function(){
  		$('.cards-wrapper').toggleClass('final');
  		if(who_i_am.hasClass('displayed')){
			who_i_am.slideUp(1000);
			who_i_am.removeClass('displayed');
			$('html').unbind("click", closeWhoIAm);
		}else{
			who_i_am.addClass('displayed');
			who_i_am.slideDown();
			$('html').bind("click", closeWhoIAm);
		}
  	}

	who_i_am.click(function(event){
		event.stopPropagation();
	});

	closeWhoIAm= function(){
		toggleWhoIAm();
	}


	$('#final-step a').on('click', function(e){
		var li = $(this).parent()
		if(li.hasClass('pure-menu-disabled'))
			toastFactory(li, 'Tu dois d\'abord débloquer tous les projets pour y accéder');
		else{
			toggleWhoIAm();
		}
		return false;
	});


  	$(document).bind(END_OF_GAME, function(){

  		$(document).unbind('click', backToCards);
  		$('#final-step').removeClass('pure-menu-disabled');
  		$('#final-step img').attr('src', 'ui/images/unlocked.png');


  		// add infinitePulse class to .controls
  		$utils = $('#back-to-cards');
  		$utils.parent().parent().addClass('finish-him');
  		$utils.on('click', function(){
  			main_wrapper.removeClass('toTop');
  			main_wrapper.one(END_OF_TRANSITION, function(){
  				$('.cards-wrapper').css('position', 'absolute');
  				toggleWhoIAm();
  			});
  		});
  	});



	/************************/
	/* DOTS ANIMATION D3.js */
	/************************/

	var selector  = '.card',
		$sel      = $(selector),
		d3_sel    = d3.selectAll(selector),
		dimension = {};
	
	// add 80px for dots overflow.
	dimension['w'] = $sel.width() + 80;
	dimension['h'] = $sel.height() + 80;

	// Check routes.ini
	d3_sel.each(function(d, i){
		generateGraph(d3.select(this), dimension, 'json');
	});

	function generateGraph(selector, dimension, json_route){

		var force = d3.layout.force()
			.charge(-130)
			.linkDistance(60)
			.size([dimension.w, dimension.h]);

		var svg = selector.append("svg")
			.attr("class", "pure-hidden-phone");

		d3.json(json_route, function(error, graph) {
			force
				.nodes(graph.nodes)
				.links(graph.links)
				.start();

			var link = svg.selectAll(".link")
				.data(graph.links)
			.enter().append("line")
				.attr("class", "link")

			// Draw dots between 3px and 1px
			var node = svg.selectAll(".node")
				.data(graph.nodes)
			.enter().append("circle")
				.attr("class", "node")
				.attr("r", function(d){ return Math.floor(Math.random() * (3 - 1 + 1)) + 1; })
				.call(force.drag);

			node.append("title")
				.attr("text-anchor", "middle")
				.style("font-size", "16px") 
				.text(function(d) { return d.name; });

			force.on("tick", function() {
				link.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });

				node.attr("cx", function(d) { return d.x; })
					.attr("cy", function(d) { return d.y; });
			});

		});

	}
});