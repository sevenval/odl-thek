/*jslint unparam: true, plusplus: true, nomen: true, indent: 2 */
/*global $, document */
'use strict';



$(document).ready(function () {


  $('a#filter-btn').click(function (e) {
    $('#filter-box').toggleClass('box-open');
  });

  $('#filter-box input[type="checkbox"]').change(function (e) {
    $(e.target).closest('form').submit();
  });

});


function openBookingLayer(_url) {
  $.ajax({
    url: _url
  }).done(function (_content) {
    $('#layerBookGadget').html(_content);
    $('#layerBookGadget').show();
    $('#blank').show();
  });
}

function bookNow() {
  var book = $('#book');
  $.post(book.attr('action'), book.serialize(), function (_content) {
    $('#layerBookGadget').html(_content);
    $('#layerBookGadget').show();
    $('#blank').show();
  });
}