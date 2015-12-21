// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require react
//= require react_ujs
//= require components
//= require_tree .

// Based off the jQuery method
function isNumeric(obj) { return (obj - parseFloat( obj ) + 1) >= 0; }

function highlightButtons() {
  var labelProps = MagicLabeler.parsePageLabel($('.thumbnail.selected').find('.label').text());
  // console.log(labelProps);
  $('button.active').removeClass('active');
  for (var prop in labelProps) {
    if (prop === 'brackets') {
      if (labelProps[prop] === true) {
        $('.toggles button:eq(0)').addClass('active');
      }
    } else if (labelProps[prop].length > 0 && !isNumeric(labelProps[prop])) {
      // console.log('button[data-reactid$="'+labelProps[prop]+'"], button[data-reactid$="'+labelProps[prop]+' "]');
      $('button[data-reactid$="'+labelProps[prop]+'"], button[data-reactid$="'+labelProps[prop]+' "]').addClass('active');
    }
  }
}

addEventListener('job loaded', function(e) {
  $('.thumbnail, button').click(function() {
    setTimeout(highlightButtons, 10);
  });
  $('#page').on('change', highlightButtons);
}, false);