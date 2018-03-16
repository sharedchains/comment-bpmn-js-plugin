'use strict';

var validUrl = require('valid-url');
var _ = require('lodash');
var $ = require('jquery');
// const shell = window.require('electron').shell;

var elementOverlays = [];

function LinkCommentPlugin(keyboard, eventBus, elementRegistry, overlays) {

  // eventBus.on('element.click', function(event) {
  // 	var element = event.element;
  // 	// Verifico se l'elemento è un commento ed è premuto il pulsante ctrl
  //   if (element.type == 'bpmn:TextAnnotation' && keyboard.isCmd(event.originalEvent)) {
  //   	// Prendo il testo del commento
  //   	var elementDescription = element.businessObject.text;
  //   	console.log("It's a comment, let's check if there is a link url");
  //     var tokens = elementDescription.split(/\s+/);
  //     var linkAlreadyOpened = false;
  //     tokens.forEach(function(element) {
  //       // Check if exists one _and only one_ uri in the comment
  //       // if there is more than one uri, opens the first one
  //       if (validUrl.isUri(element) && !linkAlreadyOpened) {
  //         console.log('Opening link');
  //         linkAlreadyOpened = true;
  //         shell.openExternal(element);
  //       }
  //     });
  //   }
  // });

  keyboard.addListener(function(key, modifiers) {
    if (key === 27 && $('div.ann-val-hover.showingPopup').length !== 0) {
      var element = $('div.ann-val-hover.showingPopup');
      element.removeClass('showingPopup');
      element.hide();
    }
  });

  eventBus.on('shape.changed', function (event) {
    _.defer(function () {
      changeShape(event.element);
    });
  });

  eventBus.on('shape.removed', function (event) {
        var element = event.element;

        _.defer(function () {
            removeShape(element);
        });
    });

    eventBus.on('shape.added', function (event) {
        _.defer(function () {
            changeShape(event.element);
        });
    });

  function changeShape(element) {
    if (element.type == 'bpmn:TextAnnotation') {
      _.defer(function () {
        addStyle(element);
      });
    }
  }

  function removeShape(element) {
        var elementObject = elementOverlays[element.id];
        for (var overlay in elementObject) {
            overlays.remove(elementObject[overlay]);
        }
        delete elementOverlays[element.id];
    }


  function addStyle(element) {

    if (elementOverlays[element.id] !== undefined && elementOverlays[element.id].length !== 0) {
      for (var overlay in elementOverlays[element.id]) {
        overlays.remove(elementOverlays[element.id][overlay]);
      }
    }

    elementOverlays[element.id] = [];
    if (element.type == 'bpmn:TextAnnotation'){
      // Prendo il testo del commento
      var elementDescription = element.businessObject.text;
      if( elementDescription !== undefined &&
        elementDescription.length > 0 &&
        elementDescription.trim() !== "") {
          console.log("It's a comment, let's check if there is a link url");
          var tokens = elementDescription.split(/\r\n|\r|\n/);
          var descriptionEscaped = '';
          var uriExists = false;
          tokens.forEach(function(element, index) {
            // Check if exists one _and only one_ uri in the comment
            // if there is more than one uri, opens the first one
            if (validUrl.isUri(element)) {
              uriExists = true;
              descriptionEscaped += '<a href="' + element + '" target="_blank">'+ element + '</a>' + '<br />';
            } else {
              descriptionEscaped += element + '<br />';
            }
          });
          if (uriExists) {
            console.log('Set badge');
            var overlayHtml = $('<div class="ann-val-true" data-badge="D"></div>');

            overlayHtml.click(function(e) {
              var badge = $(this).siblings('.ann-val-hover');
              if (badge.length == 0){
                $(this).after('<div class="ann-val-hover" data-badge="D">'+descriptionEscaped+'</div>');
                badge = $(this).siblings('.ann-val-hover');
              }
              if ($(badge).is(":visible")){
                $(badge).hide();
                $(badge).removeClass('showingPopup');
                keyboard.unbind();
              } else {
                $(badge).show();
                $(badge).addClass('showingPopup');
                keyboard.bind(document);
              }
            });

            elementOverlays[element.id].push(
              overlays.add(element, 'badge', {
                position: {
                  top: 4,
                  right: 4
                },
                html: overlayHtml
              }));
            }
          }
        }
      }

      var elements = elementRegistry.getAll();
      for (var elementCount in elements) {
        var elementObject = elements[elementCount];
        if (elementObject.businessObject.$instanceOf('bpmn:TextAnnotation')) {
          addStyle(elementObject);
        }
      }
    }

    LinkCommentPlugin.$inject = [
      'keyboard',
      'eventBus',
      'elementRegistry',
      'overlays'
    ];

    module.exports = {
      __init__: [ 'linkCommentPlugin' ],
      linkCommentPlugin: [ 'type', LinkCommentPlugin ]
    };
