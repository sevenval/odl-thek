/*jslint unparam: true, plusplus: true, nomen: true, indent: 2 */
/*global $, document */
'use strict';

function bookNow() {
  var book = $('#book');
  $.post(book.attr('action'), book.serialize(), function (_content) {
    $('#bookingModal .modal-content').html(_content);
  });
}

$(function () {

  $('a#filter-btn').click(function (e) {
    $('#filter-box').toggleClass('box-open');
  });

  $('#filter-box input[type="checkbox"]').change(function (e) {
    $(e.target).closest('form').submit();
  });

  $('.gadet-entry').mouseover(function (e) {
    $(this).addClass('showDetails');
  });

  $('.gadet-entry').mouseout(function (e) {
    $(this).removeClass('showDetails');
  });

  $('.cancel-booking').click(function (e) {
    $('#delete-booking-modal .modal-footer a').attr('href', $(this).data('href'));
    $('#delete-booking-modal').modal('show');
  });

});