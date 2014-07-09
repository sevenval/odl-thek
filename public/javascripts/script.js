/*jslint unparam: true, plusplus: true, nomen: true, indent: 2 */
/*global $, document */
'use strict';


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

$(function () {

  $('a#filter-btn').click(function (e) {
    $('#filter-box').toggleClass('box-open');
  });

  $('#filter-box input[type="checkbox"]').change(function (e) {
    $(e.target).closest('form').submit();
  });

  $('.element').mouseover(function (e) {
    $(this).addClass('showDetails');
  });

  $('.element').mouseout(function (e) {
    $(this).removeClass('showDetails');
  });

  $('.book-btn').click(function (e) {
    openBookingLayer($(this).data('url'));
  });

  $('.cancel-booking').click(function (e) {
    $('#delete-booking-modal .modal-footer a').attr('href', $(this).data('href'));
    $('#delete-booking-modal').modal('show');
  });

});